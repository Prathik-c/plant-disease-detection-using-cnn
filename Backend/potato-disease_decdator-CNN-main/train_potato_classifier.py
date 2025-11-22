# train_potato_classifier.py
import tensorflow as tf
from tensorflow.keras import layers, models
from pathlib import Path

DATA_DIR = "potato_dataset"   # from prepare script
IMG = 224
BATCH = 32
EPOCHS = 30
AUTOTUNE = tf.data.AUTOTUNE

train_ds = tf.keras.preprocessing.image_dataset_from_directory(
    Path(DATA_DIR)/"train",
    image_size=(IMG, IMG),
    batch_size=BATCH,
    label_mode='int'
)
val_ds = tf.keras.preprocessing.image_dataset_from_directory(
    Path(DATA_DIR)/"val",
    image_size=(IMG, IMG),
    batch_size=BATCH,
    label_mode='int'
)
test_ds = tf.keras.preprocessing.image_dataset_from_directory(
    Path(DATA_DIR)/"test",
    image_size=(IMG, IMG),
    batch_size=BATCH,
    label_mode='int',
    shuffle=False
)

class_names = train_ds.class_names
num_classes = len(class_names)
print("Classes:", class_names)

# Prefetching
train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

# Data augmentation
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip('horizontal'),
    layers.RandomRotation(0.05),
    layers.RandomZoom(0.05),
])

# Build model
base_model = tf.keras.applications.EfficientNetB0(include_top=False, input_shape=(IMG,IMG,3), pooling='avg', weights='imagenet')
base_model.trainable = False

inputs = tf.keras.Input(shape=(IMG,IMG,3))
x = data_augmentation(inputs)
x = tf.keras.applications.efficientnet.preprocess_input(x)  # important
x = base_model(x, training=False)
x = layers.Dropout(0.4)(x)
outputs = layers.Dense(num_classes, activation='softmax')(x)
model = models.Model(inputs, outputs)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

callbacks = [
    tf.keras.callbacks.ModelCheckpoint("best_potato.h5", save_best_only=True, monitor='val_accuracy'),
    tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, verbose=1),
    tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=7, restore_best_weights=True)
]

history = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS, callbacks=callbacks)

# Optional: fine-tune top layers
base_model.trainable = True
# unfreeze last N layers
fine_tune_at = int(len(base_model.layers) * 0.6)
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

history_fine = model.fit(train_ds, validation_data=val_ds, epochs=15, callbacks=callbacks)

# Evaluate on test set
res = model.evaluate(test_ds)
print("Test loss, test acc:", res)

# Save final model
model.save("potato_classifier_final.h5")
