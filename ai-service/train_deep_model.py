"""
SwasthAI Guardian - Deep Learning Disease Prediction
Trains a Transformer-based Neural Network for robust, multilingual symptom checking.
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import pandas as pd
import numpy as np
import joblib
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

# 1. Configuration
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'
BATCH_SIZE = 16
EPOCHS = 35
LEARNING_RATE = 0.001

# 2. Data Preparation (Importing from existing data)
from train_disease_model import TRAINING_DATA

df = pd.DataFrame(TRAINING_DATA, columns=["symptoms", "disease"])
label_encoder = LabelEncoder()
df['label'] = label_encoder.fit_transform(df['disease'])

# 3. Embedding Generation
print(f"[...] Loading {MODEL_NAME} for embedding generation...")
embedder = SentenceTransformer(MODEL_NAME)
X_embeddings = embedder.encode(df['symptoms'].tolist(), show_progress_bar=True)
y_labels = df['label'].values

X_train, X_test, y_train, y_test = train_test_split(X_embeddings, y_labels, test_size=0.15, random_state=42)

from model_def import SymptomNet

# 5. Dataset Wrapper
class SymptomDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.FloatTensor(X)
        self.y = torch.LongTensor(y)
    
    def __len__(self): return len(self.y)
    
    def __getitem__(self, idx): return self.X[idx], self.y[idx]

train_loader = DataLoader(SymptomDataset(X_train, y_train), batch_size=BATCH_SIZE, shuffle=True)

# 6. Training Loop
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
input_dim = X_embeddings.shape[1]
num_classes = len(label_encoder.classes_)

model = SymptomNet(input_dim, num_classes).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

print(f"[...] Training Neural Network on {device}...")
for epoch in range(EPOCHS):
    model.train()
    total_loss = 0
    for inputs, labels in train_loader:
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    if (epoch+1) % 5 == 0:
        print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {total_loss/len(train_loader):.4f}")

# 8. Save artifacts for deployment
artifacts = {
    'model_state': {k: v.cpu() for k, v in model.state_dict().items()},
    'label_encoder': label_encoder,
    'input_dim': input_dim,
    'num_classes': num_classes,
    'embedding_model': MODEL_NAME
}
joblib.dump(artifacts, "deep_disease_model.pkl")
print("[SAVED] deep_disease_model.pkl (Neural Network + Label Encoder)")

# 7. Evaluation
model.eval()
with torch.no_grad():
    X_test_tensor = torch.FloatTensor(X_test).to(device)
    outputs = model(X_test_tensor)
    _, predicted = torch.max(outputs, 1)
    
    print("\n[RESULT] Deep Learning Classification Report:")
    # Only report classes that actually appeared in the test set to avoid errors
    unique_labels = np.unique(np.concatenate((y_test, predicted.cpu().numpy())))
    report = classification_report(y_test, predicted.cpu().numpy(), 
                              labels=unique_labels,
                              target_names=label_encoder.classes_[unique_labels])
    print(report)

    # ── Save accuracy to file for audit & judge verification ──────────────────
    from sklearn.metrics import accuracy_score
    acc = accuracy_score(y_test, predicted.cpu().numpy())
    print(f"\n[ACCURACY] SymptomNet Test Accuracy: {acc*100:.1f}%")
    with open("deep_model_accuracy.txt", "w") as f:
        f.write("SwasthAI Guardian - SymptomNet Deep Learning Model\n")
        f.write("=" * 52 + "\n")
        f.write(f"Algorithm      : Multilayer Perceptron (3-layer MLP)\n")
        f.write(f"Embeddings     : {MODEL_NAME}\n")
        f.write(f"Training set   : {len(X_train)} samples\n")
        f.write(f"Test set       : {len(X_test)} samples\n")
        f.write(f"Epochs         : {EPOCHS}\n")
        f.write(f"Test Accuracy  : {acc*100:.1f}%\n")
        f.write("\nClassification Report:\n")
        f.write(report)
    print("[SAVED] deep_model_accuracy.txt")
