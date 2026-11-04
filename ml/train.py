#!/usr/bin/env python3
"""
Smart Waste Management System — Machine Learning Training & Evaluation Pipeline
===============================================================================
Categories : ['organic', 'paper', 'plastic']
Dataset    : ml/dataset/{organic,paper,plastic}/*.jpg (180 images, 60 per class)
Split      : 80% Training (144 images) / 20% Testing (36 images)
Input Shape: (224, 224, 3) normalized RGB [0.0, 1.0]
Outputs    :
  - ml/models/waste_classifier.h5
  - ml/models/tfjs/model.json + weights.bin
  - ml/evaluation/confusion_matrix.png
  - ml/evaluation/training_history.png
  - ml/evaluation/classification_report.txt
  - ml/evaluation/evaluation_metrics.json
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers

CLASSES = ["organic", "paper", "plastic"]
IMG_SIZE = (224, 224)
BATCH_SIZE = 12
EPOCHS = 25
SEED = 20261104

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODELS_DIR = os.path.join(BASE_DIR, "models")
TFJS_DIR = os.path.join(MODELS_DIR, "tfjs")
EVAL_DIR = os.path.join(BASE_DIR, "evaluation")


def load_dataset():
    """Loads 224x224 RGB images according to the 80/20 deterministic split."""
    x_train, y_train = [], []
    x_test, y_test = [], []

    for label_idx, cls_name in enumerate(CLASSES):
        cls_dir = os.path.join(DATASET_DIR, cls_name)
        files = sorted([f for f in os.listdir(cls_dir) if f.endswith(".jpg")])
        split_idx = int(len(files) * 0.8)  # 48 train, 12 test per class

        for i, fname in enumerate(files):
            img_path = os.path.join(cls_dir, fname)
            img = Image.open(img_path).convert("RGB").resize(IMG_SIZE)
            arr = np.asarray(img, dtype=np.float32) / 255.0
            if i < split_idx:
                x_train.append(arr)
                y_train.append(label_idx)
            else:
                x_test.append(arr)
                y_test.append(label_idx)

    x_train = np.array(x_train, dtype=np.float32)
    y_train = tf.keras.utils.to_categorical(y_train, num_classes=len(CLASSES))
    x_test = np.array(x_test, dtype=np.float32)
    y_test = tf.keras.utils.to_categorical(y_test, num_classes=len(CLASSES))

    return (x_train, y_train), (x_test, y_test)


def build_cnn_model():
    """Builds the 224x224x3 Convolutional Neural Network with Data Augmentation."""
    data_augmentation = tf.keras.Sequential(
        [
            layers.RandomFlip("horizontal_and_vertical"),
            layers.RandomRotation(0.15),
            layers.RandomZoom(0.15),
            layers.RandomBrightness(0.10),
        ],
        name="data_augmentation",
    )

    model = models.Sequential(
        [
            layers.Input(shape=(224, 224, 3), name="input_rgb_224"),
            data_augmentation,
            layers.AveragePooling2D(pool_size=(7, 7), strides=(7, 7), name="spatial_downsample_32x32"),
            layers.Conv2D(16, (3, 3), padding="same", activation="relu", name="conv2d_block1"),
            layers.MaxPooling2D(pool_size=(2, 2), strides=(2, 2), name="maxpool_block1"),
            layers.Conv2D(32, (3, 3), padding="same", activation="relu", name="conv2d_block2"),
            layers.GlobalAveragePooling2D(name="global_avg_pool"),
            layers.Dense(24, activation="relu", name="dense_features"),
            layers.Dropout(0.15, name="dropout_reg"),
            layers.Dense(len(CLASSES), activation="softmax", name="waste_category_probs"),
        ],
        name="SmartWaste_CNN_v1",
    )

    model.compile(
        optimizer=optimizers.Adam(learning_rate=0.004),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def save_evaluation_plots(history, y_true, y_pred):
    os.makedirs(EVAL_DIR, exist_ok=True)

    # 1. Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6), dpi=150)
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Greens",
        xticklabels=[c.upper() for c in CLASSES],
        yticklabels=[c.upper() for c in CLASSES],
    )
    plt.title("Confusion Matrix — Smart Waste CNN (Test Set n=36)")
    plt.xlabel("Predicted Category")
    plt.ylabel("Actual Category")
    plt.tight_layout()
    plt.savefig(os.path.join(EVAL_DIR, "confusion_matrix.png"))
    plt.close()

    # 2. Training History
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5), dpi=150)
    epochs_range = range(1, len(history.history["accuracy"]) + 1)

    ax1.plot(epochs_range, np.array(history.history["accuracy"]) * 100, label="Train Accuracy", color="#111315", lw=2)
    ax1.plot(epochs_range, np.array(history.history["val_accuracy"]) * 100, label="Val Accuracy", color="#1E4D2B", lw=2.5)
    ax1.axhline(80, color="#B45309", linestyle="--", label="PRD Target (80%)")
    ax1.set_title("Accuracy Curve (%)")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy (%)")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    ax2.plot(epochs_range, history.history["loss"], label="Train Loss", color="#111315", lw=2)
    ax2.plot(epochs_range, history.history["val_loss"], label="Val Loss", color="#B91C1C", lw=2.5)
    ax2.set_title("Cross-Entropy Loss Curve")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Loss")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(EVAL_DIR, "training_history.png"))
    plt.close()


def main():
    tf.random.set_seed(SEED)
    np.random.seed(SEED)

    print("1. Loading 224x224 RGB Waste Dataset (80% Train / 20% Test)...")
    (x_train, y_train), (x_test, y_test) = load_dataset()
    print(f"   Train shape: {x_train.shape}, Test shape: {x_test.shape}")

    print("2. Building CNN Model...")
    model = build_cnn_model()
    model.summary()

    print("3. Training Model...")
    history = model.fit(
        x_train,
        y_train,
        validation_data=(x_test, y_test),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        shuffle=True,
    )

    print("4. Evaluating on 20% Held-out Test Split...")
    preds = model.predict(x_test)
    y_true = np.argmax(y_test, axis=1)
    y_pred = np.argmax(preds, axis=1)

    acc = accuracy_score(y_true, y_pred)
    report = classification_report(y_true, y_pred, target_names=CLASSES, digits=4)
    print(f"\nTest Accuracy: {acc * 100:.2f}% (PRD Target: >= 80.00%)\n")
    print(report)

    os.makedirs(MODELS_DIR, exist_ok=True)
    h5_path = os.path.join(MODELS_DIR, "waste_classifier.h5")
    model.save(h5_path)
    print(f"Saved Keras model to {h5_path}")

    save_evaluation_plots(history, y_true, y_pred)


if __name__ == "__main__":
    main()
