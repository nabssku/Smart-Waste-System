# Smart Waste Management — Machine Learning Pipeline (`ml/`)

Modul Machine Learning untuk klasifikasi otomatis citra sampah ke dalam 3 kategori utama: **`organic`**, **`paper`**, dan **`plastic`**. Model ini terintegrasi langsung ke dalam **Unified Express Backend** (`backend/src/services/ml.service.ts`) menggunakan `@tensorflow/tfjs` dan `sharp`.

---

## 1. Struktur Direktori

```text
ml/
├── dataset/
│   ├── organic/                              # 60 citra sampah organik (224x224 RGB)
│   ├── paper/                                # 60 citra sampah kertas & kardus (224x224 RGB)
│   ├── plastic/                              # 60 citra sampah plastik & botol (224x224 RGB)
│   └── dataset_split.csv                     # Manifest pembagian 80% Train (144) / 20% Test (36)
├── models/
│   ├── waste_classifier.h5                   # Model terlatih format Keras HDF5 (.h5)
│   └── tfjs/
│       ├── model.json                        # Topologi layer & manifest bobot TensorFlow.js
│       └── weights.bin                       # Bobot float32 terlatih untuk inferensi Node.js
├── notebooks/
│   └── waste_classification_training.ipynb   # Notebook eksperimen, arsitektur, & evaluasi
├── evaluation/
│   ├── confusion_matrix.png                  # Visualisasi Confusion Matrix pada 20% Test Set
│   ├── training_history.png                  # Kurva Accuracy & Cross-Entropy Loss per Epoch
│   ├── classification_report.txt             # Laporan Precision, Recall, F1-Score per kelas
│   └── evaluation_metrics.json               # Ringkasan metrik evaluasi terstruktur (JSON)
├── build_dataset_and_train.ts                # Pipeline end-to-end (Dataset + Training + Evaluasi)
├── train.py                                  # Skrip training referensi Python TensorFlow/Keras
└── requirements.txt                          # Dependensi Python untuk lingkungan notebook/training
```

---

## 2. Spesifikasi Dataset & Data Augmentation

- **Sumber Dataset Resmi:** [Kaggle — Garbage Classification (`mostafaabla/garbage-classification`)](https://www.kaggle.com/datasets/mostafaabla/garbage-classification/data)
- **Pemetaan Kategori:**
  - `organic` $\leftarrow$ diekstrak dari folder `biological/` (`80` foto asli)
  - `paper` $\leftarrow$ diekstrak dari folder `cardboard/` & `paper/` (`80` foto asli)
  - `plastic` $\leftarrow$ diekstrak dari folder `plastic/` (`80` foto asli)
- **Total Sampel:** **240 citra foto asli RGB (`224x224` piksel)** — 80 citra per kelas (melampaui batas minimum PRD 150 citra / 50 per kelas).
- **Pembagian Data (Split):**
  - **Training Set (80%):** `192` citra (`64 organic`, `64 paper`, `64 plastic`) — indeks `001` s/d `064`.
  - **Testing Set (20%):** `48` citra (`16 organic`, `16 paper`, `16 plastic`) — indeks `065` s/d `080`.
- **Hasil Evaluasi (Test Set n=48):**
  - **Test Accuracy:** **93.75%** (`45/48` tepat; melampaui target PRD $\ge 80\%$).
  - **Confusion Matrix:** `organic: [13, 0, 3]`, `paper: [0, 16, 0]`, `plastic: [0, 0, 16]`.
- **Teknik Data Augmentation:**
  - **Rotasi Geometrik:** `-25°` hingga `+25°`
  - **Zoom / Scaling:** `0.82x` hingga `1.22x`
  - **Flip:** Horizontal & vertikal acak
  - **Variasi Pencahayaan (Brightness/Contrast):** Pergeseran intensitas latar & pencahayaan spekular
  - **Normalisasi Input:** Piksel RGB `uint8 [0, 255]` dinormalisasi ke `float32 [0.0, 1.0]` dengan dimensi tensor `[1, 224, 224, 3]`.

---

## 3. Arsitektur Model CNN (`SmartWaste_CNN_v1`)

| Layer | Tipe | Output Shape | Parameter | Deskripsi |
| :--- | :--- | :--- | ---: | :--- |
| `avg_pool_downsample` | `AveragePooling2D (7x7, s=7)` | `(None, 32, 32, 3)` | `0` | Reduksi spasial anti-aliasing dari `224x224x3` |
| `conv2d_block1` | `Conv2D (16 filters, 3x3, ReLU)` | `(None, 32, 32, 16)` | `448` | Ekstraksi fitur warna & tepi lokal |
| `maxpool_block1` | `MaxPooling2D (2x2, s=2)` | `(None, 16, 16, 16)` | `0` | Invariansi translasi spasial |
| `conv2d_block2` | `Conv2D (32 filters, 3x3, ReLU)` | `(None, 16, 16, 32)` | `4,640` | Ekstraksi tekstur & pola bentuk objek |
| `global_avg_pool` | `GlobalAveragePooling2D` | `(None, 32)` | `0` | Agregasi vektor fitur global |
| `dense_features` | `Dense (24 units, ReLU)` | `(None, 24)` | `792` | Kombinasi non-linear fitur klasifikasi |
| `dropout_reg` | `Dropout (rate=0.15)` | `(None, 24)` | `0` | Regularisasi pencegah overfitting |
| `waste_category_probs` | `Dense (3 units, Softmax)` | `(None, 3)` | `75` | Probabilitas kelas `['organic', 'paper', 'plastic']` |

- **Total Parameter:** `5,955` (seluruhnya *trainable*)
- **Optimizer:** `Adam (lr = 0.004)`
- **Loss Function:** `categorical_crossentropy`

---

## 4. Cara Menjalankan Ulang Pipeline

### Opsi A — Menggunakan Node.js / TypeScript (`@tensorflow/tfjs` + `sharp`)
Tanpa memerlukan instalasi Python eksternal (menggunakan paket yang sudah terpasang di `backend/node_modules`):

```bash
./backend/node_modules/.bin/tsx ml/build_dataset_and_train.ts
```

### Opsi B — Menggunakan Python (`tensorflow` + `scikit-learn`)
```bash
cd ml
pip install -r requirements.txt
python3 train.py
```
