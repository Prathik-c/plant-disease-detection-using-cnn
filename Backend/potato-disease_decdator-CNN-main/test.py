import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image

model = tf.keras.models.load_model("potato_classifier_final.h5")   # or .h5

IMG = 224
class_names = ['early_blight', 'late_blight', 'healthy']  # adjust to your classes

def predict_image(img_path):
    img = image.load_img(img_path, target_size=(IMG, IMG))
    x = image.img_to_array(img)
    x = tf.expand_dims(x, axis=0) / 255.0
    preds = model.predict(x)
    class_id = np.argmax(preds[0])
    return class_names[class_id], preds[0][class_id]

print(predict_image("test_image.jpg"))
