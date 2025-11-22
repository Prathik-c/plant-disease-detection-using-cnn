# prepare_potato_dataset.py
import os
import shutil
from pathlib import Path
import random

random.seed(42)

# root where you unzipped Kaggle dataset
RAW_ROOT = Path("data")
OUT_ROOT = Path("potato_dataset")   # output folder with train/val/test
OUT_ROOT.mkdir(exist_ok=True)

# possible folder name patterns for PlantVillage potato classes:
# e.g. "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy"
def is_potato_folder(foldername):
    n = foldername.lower()
    return "potato" in n

# find candidate class folders (recursively)
class_folders = []
for p in RAW_ROOT.rglob("*"):
    if p.is_dir() and is_potato_folder(p.name):
        # ensure folder contains images
        imgs = list(p.glob("*.jpg")) + list(p.glob("*.png"))
        if len(imgs) > 0:
            class_folders.append(p)

if not class_folders:
    print("No potato class folders found under", RAW_ROOT)
    print("Please check where you unzipped the Kaggle dataset.")
    raise SystemExit(1)

print("Found potato class folders:")
for cf in class_folders:
    print(" -", cf)

# map class folder names to friendly class labels
# e.g. "Potato___Early_blight" -> "Early_blight" (or "early_blight")
class_map = {}
for cf in class_folders:
    # try splitting by '___' like PlantVillage style
    parts = cf.name.split("___")
    if len(parts) >= 2:
        cls = parts[1]
    else:
        # fallback: remove "potato" prefix
        cls = cf.name.replace("Potato", "").replace("potato", "").strip("_- ")
        if cls == "":
            cls = "potato_unknown"
    cls = cls.lower()
    class_map[cf] = cls

print("Class mapping:")
for k, v in class_map.items():
    print(k, "->", v)

# create out dir structure
for split in ("train", "val", "test"):
    for cls in set(class_map.values()):
        d = OUT_ROOT / split / cls
        d.mkdir(parents=True, exist_ok=True)

# split ratios
train_ratio = 0.7
val_ratio = 0.15
test_ratio = 0.15

# copy images with stratified split
for src_folder, cls in class_map.items():
    imgs = [p for p in src_folder.glob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png")]
    random.shuffle(imgs)
    n = len(imgs)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)
    train_imgs = imgs[:n_train]
    val_imgs = imgs[n_train:n_train + n_val]
    test_imgs = imgs[n_train + n_val:]

    for p in train_imgs:
        shutil.copy(p, OUT_ROOT / "train" / cls / p.name)
    for p in val_imgs:
        shutil.copy(p, OUT_ROOT / "val" / cls / p.name)
    for p in test_imgs:
        shutil.copy(p, OUT_ROOT / "test" / cls / p.name)

print("Finished preparing dataset at", OUT_ROOT)
