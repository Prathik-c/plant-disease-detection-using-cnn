from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)

model = load_model("potato_classifier_final.h5")  # your trained model

CLASS_NAMES = ["early_blight", "late_blight", "healthy"]  # must match your model's training

# --- LEAF PRESENCE CHECK ---
def leaf_present_bgr(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower = np.array([25, 40, 30])
    upper = np.array([100, 255, 255])
    mask = cv2.inRange(hsv, lower, upper)
    green_ratio = np.count_nonzero(mask) / (img.shape[0]*img.shape[1])
    return green_ratio

def preprocess(img):
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)       # Convert from BGR (OpenCV) to RGB (Keras)
    img = cv2.resize(img, (224, 224))
    arr = img.astype("float32")
    arr = preprocess_input(arr)                      # EfficientNet preprocessing
    arr = np.expand_dims(arr, axis=0)
    return arr

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Get file from request
        if "file" not in request.files:
            return jsonify({"error": "No file part in request"}), 400
        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No selected file"}), 400

        # Decode image
        image_bytes = file.read()
        img_np = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(img_np, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({"error": "File could not be decoded as an image"}), 400

        # GREEN PIXEL CHECK
        GREEN_RATIO_THRESH = 0.05
        green_ratio = leaf_present_bgr(img)
        if green_ratio < GREEN_RATIO_THRESH:
            return jsonify({
                "label": "no_leaf",
                "confidence": 1.0
            })

        # Model prediction (only if leaf is present)
        input_img = preprocess(img)
        pred = model.predict(input_img)[0]
        class_id = int(np.argmax(pred))

        return jsonify({
            "label": CLASS_NAMES[class_id],
            "confidence": float(pred[class_id])
        })
    except Exception as e:
        print("Prediction error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)
