"""
SwasthAI Guardian - Deep Learning Disease Prediction
Trains a Transformer-based Neural Network for robust, multilingual symptom checking.

Usage:
  python train_deep_model.py           # Full 5-fold CV + final model (default)
  python train_deep_model.py --no-cv   # Hold-out only, faster (used by CI)
"""
import argparse
import os
import sys
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import pandas as pd
import numpy as np
import joblib
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score

# ── CLI args ──────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--no-cv", action="store_true",
                    help="Skip 5-fold cross-validation (faster, used in CI)")
args = parser.parse_args()

# Respect CI environment variable too
SKIP_CV = args.no_cv or bool(os.getenv("GITHUB_ACTIONS"))

# ── Configuration ─────────────────────────────────────────────────────────────
MODEL_NAME  = 'paraphrase-multilingual-MiniLM-L12-v2'
BATCH_SIZE  = 16
EPOCHS      = 35
LEARNING_RATE = 0.001
N_FOLDS     = 5

# ── Dataset ───────────────────────────────────────────────────────────────────
csv_path = os.path.join(os.path.dirname(__file__), "symptom_dataset.csv")
if not os.path.exists(csv_path):
    raise FileNotFoundError(f"Dataset not found at {csv_path}. Run generate_dataset.py first.")

df = pd.read_csv(csv_path)
df['symptoms'] = df['symptoms'].astype(str)
label_encoder = LabelEncoder()
df['label'] = label_encoder.fit_transform(df['disease'])
print(f"[OK] Loaded {len(df)} samples · {len(label_encoder.classes_)} classes")

# ── Embeddings (expensive — computed ONCE, reused across all folds) ───────────
print(f"[...] Loading {MODEL_NAME} for embedding generation...")
embedder = SentenceTransformer(MODEL_NAME)
X_all = embedder.encode(df['symptoms'].tolist(), show_progress_bar=True,
                        batch_size=64, convert_to_numpy=True)
y_all = df['label'].values
print(f"[OK] Embeddings computed: {X_all.shape}")

# 85/15 stratified split — final model trained on X_train
X_train, X_test, y_train, y_test = train_test_split(
    X_all, y_all, test_size=0.15, random_state=42, stratify=y_all
)

from model_def import SymptomNet

# ── Dataset wrapper ───────────────────────────────────────────────────────────
class SymptomDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.FloatTensor(X)
        self.y = torch.LongTensor(y)
    def __len__(self):          return len(self.y)
    def __getitem__(self, idx): return self.X[idx], self.y[idx]


def train_one_model(X_tr, y_tr, device, input_dim, num_classes):
    """Train a fresh SymptomNet for EPOCHS and return the model."""
    model = SymptomNet(input_dim, num_classes, use_batch_norm=True).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    loader = DataLoader(SymptomDataset(X_tr, y_tr), batch_size=BATCH_SIZE, shuffle=True)
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            loss = criterion(model(inputs), labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        if (epoch + 1) % 5 == 0:
            print(f"  Epoch {epoch+1}/{EPOCHS}  loss={total_loss/len(loader):.4f}")
    return model


def evaluate(model, X_val, y_val, device):
    """Return accuracy on a validation split."""
    model.eval()
    with torch.no_grad():
        out = model(torch.FloatTensor(X_val).to(device))
        _, pred = torch.max(out, 1)
    return accuracy_score(y_val, pred.cpu().numpy())


device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
input_dim  = X_all.shape[1]
num_classes = len(label_encoder.classes_)
print(f"[INFO] Device: {device} · input_dim={input_dim} · classes={num_classes}")

# ── 5-Fold Stratified Cross-Validation ───────────────────────────────────────
cv_scores = []
if SKIP_CV:
    print("[CI] Skipping 5-fold CV (--no-cv / GITHUB_ACTIONS set)")
else:
    print(f"\n[CV] Starting {N_FOLDS}-Fold Stratified Cross-Validation on training set...")
    skf = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=42)
    for fold, (tr_idx, val_idx) in enumerate(skf.split(X_train, y_train), 1):
        print(f"\n── Fold {fold}/{N_FOLDS} "
              f"(train={len(tr_idx)}, val={len(val_idx)}) ──")
        m = train_one_model(X_train[tr_idx], y_train[tr_idx],
                            device, input_dim, num_classes)
        acc = evaluate(m, X_train[val_idx], y_train[val_idx], device)
        cv_scores.append(acc)
        print(f"  ✓ Fold {fold} val accuracy: {acc*100:.2f}%")
        del m  # free VRAM/RAM between folds

    cv_mean = np.mean(cv_scores)
    cv_std  = np.std(cv_scores)
    print(f"\n[CV] 5-Fold CV Accuracy: {cv_mean*100:.1f}% ± {cv_std*100:.1f}%")

# ── Final model — trained on full 85% training set ───────────────────────────
print("\n[...] Training final SymptomNet on full training set...")
final_model = train_one_model(X_train, y_train, device, input_dim, num_classes)

# ── Hold-out evaluation ───────────────────────────────────────────────────────
test_acc = evaluate(final_model, X_test, y_test, device)

final_model.eval()
with torch.no_grad():
    out   = final_model(torch.FloatTensor(X_test).to(device))
    _, pred = torch.max(out, 1)
unique_labels = np.unique(np.concatenate((y_test, pred.cpu().numpy())))
report = classification_report(
    y_test, pred.cpu().numpy(),
    labels=unique_labels,
    target_names=label_encoder.classes_[unique_labels],
    zero_division=0
)
print(f"\n[RESULT] Hold-out Test Accuracy: {test_acc*100:.1f}%")
print(report)

# ── Save artifacts ────────────────────────────────────────────────────────────
artifacts = {
    'model_state':     {k: v.cpu() for k, v in final_model.state_dict().items()},
    'label_encoder':   label_encoder,
    'input_dim':       input_dim,
    'num_classes':     num_classes,
    'embedding_model': MODEL_NAME,
}
joblib.dump(artifacts, "deep_disease_model.pkl")
print("[SAVED] deep_disease_model.pkl")

# ── Audit log (evaluator-readable) ────────────────────────────────────────────────
accuracy_path = os.path.join(os.path.dirname(__file__), "deep_model_accuracy.txt")
with open(accuracy_path, "w", encoding="utf-8") as f:
    f.write("SwasthAI Guardian - SymptomNet Deep Learning Model\n")
    f.write("=" * 56 + "\n")
    f.write(f"Algorithm         : Multilayer Perceptron (3-layer MLP)\n")
    f.write(f"Embeddings        : {MODEL_NAME}\n")
    f.write(f"Total samples     : {len(df)}\n")
    f.write(f"Training set      : {len(X_train)} samples (85%)\n")
    f.write(f"Test set          : {len(X_test)} samples (15%)\n")
    f.write(f"Epochs per fold   : {EPOCHS}\n")
    f.write(f"Device            : {device}\n")
    f.write("\n")
    if cv_scores:
        f.write(f"Cross-Validation  : {N_FOLDS}-Fold Stratified (StratifiedKFold, random_state=42)\n")
        for i, s in enumerate(cv_scores, 1):
            f.write(f"  Fold {i}          : {s*100:.2f}%\n")
        f.write(f"CV Mean Accuracy  : {cv_mean*100:.1f}%\n")
        f.write(f"CV Std Dev        : ±{cv_std*100:.1f}%\n")
    else:
        f.write("Cross-Validation  : Skipped (CI mode)\n")
    f.write(f"\nHold-out Test Acc : {test_acc*100:.1f}%\n")
    f.write("\nClassification Report:\n")
    f.write(report)
print(f"[SAVED] {accuracy_path}")
