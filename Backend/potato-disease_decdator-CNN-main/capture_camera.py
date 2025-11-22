# capture_and_predict_improved.py
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input
import time
from pathlib import Path
import traceback

# CONFIG
MODEL_PATH = "potato_classifier_final.h5"   # or .keras
IMG = 224
CONF_THRESH = 0.50        # require >= 50% confidence to accept prediction
GREEN_RATIO_THRESH = 0.02 # fraction of pixels that must be "green" to consider leaf present
SAVE_SUSPECT_DIR = Path("suspect_frames")
SAVE_SUSPECT_DIR.mkdir(exist_ok=True)

# Auto-cleanup config
DELETE_AFTER_SECONDS = 5 * 60   # delete files older than 5 minutes (300s)
CLEANUP_INTERVAL = 60           # run cleanup at most once every 60 seconds

class_names = ['early_blight', 'late_blight', 'healthy']  # must match training order

# load model
print("Loading model:", MODEL_PATH)
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded.")

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise SystemExit("Cannot open camera. Check camera index or permissions.")

fps_prev = time.time()

def leaf_present_bgr(frame):
    """
    Simple heuristic: convert to HSV and threshold for green-like colors.
    Returns fraction of pixels classified as green and the mask.
    """
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    # green range - these numbers are heuristics and can be tuned
    lower = np.array([25, 40, 30])
    upper = np.array([100, 255, 255])
    mask = cv2.inRange(hsv, lower, upper)
    green_ratio = np.count_nonzero(mask) / (frame.shape[0]*frame.shape[1])
    return green_ratio, mask

def preprocess_frame_for_model(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    img = cv2.resize(rgb, (IMG, IMG))
    arr = img.astype("float32")
    arr = preprocess_input(arr)   # keep parity with training
    arr = np.expand_dims(arr, axis=0)
    return arr

def cleanup_old_files(directory: Path, max_age_seconds: int):
    """
    Delete files older than max_age_seconds in directory.
    We wrap unlink calls in try/except to avoid crashes if file is locked.
    """
    now = time.time()
    for f in directory.iterdir():
        try:
            if f.is_file():
                age = now - f.stat().st_mtime
                if age > max_age_seconds:
                    try:
                        f.unlink()
                        print(f"Deleted old file: {f} (age {int(age)}s)")
                    except Exception as e:
                        # Could be in-use or permission issue
                        print(f"Could not delete {f}: {e}")
        except Exception:
            # stat or iteration may fail for transient reasons
            print(f"Error checking file {f} for cleanup:", traceback.format_exc())

last_cleanup = 0.0
frame_idx = 0
fps = 0.0

while True:
    now = time.time()
    # periodic cleanup
    if now - last_cleanup > CLEANUP_INTERVAL:
        cleanup_old_files(SAVE_SUSPECT_DIR, DELETE_AFTER_SECONDS)
        last_cleanup = now

    ret, frame = cap.read()
    if not ret or frame is None:
        blank = np.zeros((480,640,3), dtype=np.uint8)
        cv2.putText(blank, "NO CAMERA FRAME", (20,240), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0,0,255), 2)
        cv2.imshow("Potato Detector", blank)
        if cv2.waitKey(100) & 0xFF == 27:
            break
        continue

    # check leaf presence
    green_ratio, green_mask = leaf_present_bgr(frame)
    if green_ratio < GREEN_RATIO_THRESH:
        label_text = "NO LEAF DETECTED"
        conf_text = ""
        color = (0,0,255)
        # occasional save for inspection (rotate less frequently)
        if frame_idx % 150 == 0:
            fname = SAVE_SUSPECT_DIR / f"no_leaf_{frame_idx}.jpg"
            try:
                cv2.imwrite(str(fname), frame)
                print("Saved no-leaf frame:", fname)
            except Exception as e:
                print("Could not save no-leaf frame:", e)
    else:
        # run model
        try:
            x = preprocess_frame_for_model(frame)
            raw = model.predict(x, verbose=0).squeeze()
        except Exception as e:
            print("Model prediction error:", e)
            raw = np.array([0.0]*len(class_names))

        # safe softmax conversion
        try:
            exp = np.exp(raw - np.max(raw))
            probs = exp / exp.sum() if exp.sum() != 0 else np.ones_like(exp)/len(exp)
        except Exception:
            probs = np.ones(len(class_names)) / len(class_names)

        top_idx = int(np.argmax(probs))
        top_conf = float(probs[top_idx])

        if top_conf < CONF_THRESH:
            label_text = "LOW CONFIDENCE"
            conf_text = f"{top_conf:.2f}"
            color = (0,255,255)
            # save frame for debugging
            fname = SAVE_SUSPECT_DIR / f"lowconf_{frame_idx}_top_{class_names[top_idx]}_{top_conf:.2f}.jpg"
            try:
                cv2.imwrite(str(fname), frame)
                print("Saved low-confidence frame:", fname, "conf:", top_conf)
            except Exception as e:
                print("Could not save low-confidence frame:", e)
        else:
            label_text = class_names[top_idx].upper()
            conf_text = f"{top_conf*100:.1f}%"
            color = (255,255,255) if label_text.lower()=="healthy" else (0,200,0)

    # overlay mask thumbnail and texts
    overlay = frame.copy()
    cv2.putText(overlay, f"Label: {label_text}", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
    if conf_text:
        cv2.putText(overlay, f"Confidence: {conf_text}", (10,60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    cv2.putText(overlay, f"Green ratio: {green_ratio:.3f}", (10,90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200,200,200), 1)

    # show small mask inset
    try:
        mask_small = cv2.resize(green_mask, (160,120))
        mask_bgr = cv2.cvtColor(mask_small, cv2.COLOR_GRAY2BGR)
        h,w = mask_bgr.shape[:2]
        overlay[10:10+h, overlay.shape[1]-10-w:overlay.shape[1]-10] = mask_bgr
    except Exception:
        pass

    # FPS
    now2 = time.time()
    fps = 0.9*fps + 0.1/(now2 - fps_prev) if fps_prev else 0.0
    fps_prev = now2
    cv2.putText(overlay, f"FPS: {fps:.1f}", (10,120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200,200,200), 1)

    cv2.imshow("Potato Detector", overlay)

    key = cv2.waitKey(1) & 0xFF
    if key == 27:
        break
    if key == ord('s'):
        fname = SAVE_SUSPECT_DIR / f"manual_{frame_idx}.jpg"
        try:
            cv2.imwrite(str(fname), frame)
            print("Saved manual frame:", fname)
        except Exception as e:
            print("Could not save manual frame:", e)

    frame_idx += 1

cap.release()
cv2.destroyAllWindows()
