"""
SwasthAI Guardian - Disease Prediction Model Training Script
Trains an Ensemble Voting Classifier on the generated multilingual clinical symptoms dataset.
"""
import pandas as pd, joblib
from sklearn.linear_model import LogisticRegression
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
import os

if __name__ == "__main__":
    csv_path = os.path.join(os.path.dirname(__file__), "symptom_dataset.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}. Run generate_dataset.py first.")
        
    df = pd.read_csv(csv_path)
    print(f"[OK] Loaded dataset: {len(df)} samples, {df['disease'].nunique()} classes")
    print(f"   Per class: min={df['disease'].value_counts().min()}, max={df['disease'].value_counts().max()}\n")

    X, y = df["symptoms"].astype(str), df["disease"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)

    # Logistic Regression (Extremely fast, low memory, and highly accurate for text classification)
    clf = LogisticRegression(max_iter=1000, C=1.0, class_weight="balanced", random_state=42)

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=3000, sublinear_tf=True)),
        ("clf", clf)
    ])

    print("[...] Training Logistic Regression Classifier...")
    pipeline.fit(X_train, y_train)

    if os.getenv("GITHUB_ACTIONS"):
        print("[CI] Skipping 5-fold cross-validation for faster pipeline")
        cv_mean, cv_std = 0.0, 0.0
    else:
        cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy")
        cv_mean, cv_std = cv_scores.mean(), cv_scores.std()
        print(f"[OK] 5-Fold Cross-Val Accuracy: {cv_mean*100:.1f}% (+/- {cv_std*100:.1f}%)")

    y_pred = pipeline.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, zero_division=0)
    print(f"[RESULT] Test Accuracy: {test_acc * 100:.1f}%")
    print(report)

    # Save model pipeline
    model_export_path = os.path.join(os.path.dirname(__file__), "disease_model.pkl")
    joblib.dump(pipeline, model_export_path)
    print(f"[SAVED] {model_export_path}")

    # Write audit log for evaluators
    accuracy_file = os.path.join(os.path.dirname(__file__), "model_accuracy.txt")
    with open(accuracy_file, "w", encoding="utf-8") as f:
        f.write("SwasthAI Guardian - Disease Prediction Model\n")
        f.write("=" * 50 + "\n")
        f.write("Algorithm     : Logistic Regression Classifier\n")
        f.write("Vectorizer    : TF-IDF (unigrams + bigrams)\n")
        f.write(f"Training set  : {len(X_train)} samples\n")
        f.write(f"Test set      : {len(X_test)} samples\n")
        f.write(f"CV Accuracy   : {cv_mean*100:.1f}% (+/- {cv_std*100:.1f}%)\n")
        f.write(f"Test Accuracy : {test_acc * 100:.1f}%\n\n")
        f.write(f"Disease Classes ({df['disease'].nunique()}):\n")
        for cls in sorted(df['disease'].unique()):
            f.write(f" - {cls}\n")
        f.write("\nClassification Report:\n")
        f.write(report)
    print(f"[SAVED] {accuracy_file}")
