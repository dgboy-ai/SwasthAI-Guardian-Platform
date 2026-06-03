"""
RAG Threshold Calibration & Evaluation Script
Runs 50 test queries (in-scope and out-of-scope) to find the optimal threshold for Sakhi's retrieval filter.
"""
import os
import sys
import numpy as np

# Ensure we can import from local directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set cache environment variable before loading SentenceTransformer
os.environ["SENTENCE_TRANSFORMERS_HOME"] = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), ".model_cache"
)

from sentence_transformers import SentenceTransformer
from health_kb_data import HEALTH_KNOWLEDGE

print("[CALIBRATION] Loading SentenceTransformer from cache/network...")
embedder = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
_TEXTS = [chunk["text"] for chunk in HEALTH_KNOWLEDGE]
kb_embeddings = embedder.encode(_TEXTS, normalize_embeddings=True)
print(f"[CALIBRATION] Embedded {len(HEALTH_KNOWLEDGE)} chunks.")

# 50 Calibration queries: 25 In-Scope (label=True), 25 Out-Of-Scope (label=False)
TEST_QUERIES = [
    # --- In-Scope Queries (25) ---
    ("how many ANC visits are recommended for pregnant women?", True),
    ("what is the standard treatment for eclampsia?", True),
    ("signs of severe gestational hypertension", True),
    ("how long should iron folic acid be taken after birth?", True),
    ("what is the diagnostic value for gestational diabetes?", True),
    ("normal menstrual cycle duration and pad usage", True),
    ("how often to change sanitary pads to avoid infections?", True),
    ("what are the symptoms of polycystic ovary syndrome pcos?", True),
    ("what causes cervical cancer and is there a vaccine?", True),
    ("infant immunisation schedule in india for hepatitis b", True),
    ("muac threshold for severe acute malnutrition sam in children", True),
    ("how to prepare oral rehydration salts solution at home?", True),
    ("zinc tablet dose for infant with diarrhoea under 5", True),
    ("signs of severe dehydration like dry mouth and sunken eyes", True),
    ("treatment duration for standard dots tuberculosis regimen", True),
    ("dengue fever retro-orbital pain and joint swelling", True),
    ("avoiding aspirin in dengue hemorrhagic fever", True),
    ("malaria prevention insecticide bed nets nvbdcp guidelines", True),
    ("symptoms of severe falciparum malaria like black urine", True),
    ("what causes scrub typhus and its treatment with doxycycline", True),
    ("dangers of heatstroke body temperature above 40 degrees", True),
    ("snakebite first aid immobilization and anti snake venom", True),
    ("free ambulance number for institutional delivery under jsy", True),
    ("incentive benefits for pregnant women under pmmvy", True),
    ("cashless delivery options under janani shishu suraksha jssk", True),

    # --- Out-Of-Scope Queries (25) ---
    ("who won the football world cup in 2022?", False),
    ("how to write a binary search algorithm in python?", False),
    ("best restaurants in Mumbai and Delhi to eat biryani", False),
    ("how to repair a punctured tire on a bike?", False),
    ("what is the capital city of France?", False),
    ("latest movie reviews for bollywood releases", False),
    ("how to buy stocks or cryptocurrency online?", False),
    ("weather forecast for next week in lucknow", False),
    ("steps to install docker on windows 11", False),
    ("who is the current prime minister of the united kingdom?", False),
    ("how to bake a chocolate cake without oven?", False),
    ("which is the best smartphone under 20000 rupees?", False),
    ("how to learn english speaking in 30 days?", False),
    ("what are the rules of cricket game?", False),
    ("how to wash a woolen sweater in washing machine?", False),
    ("how does a combustion engine work in detail?", False),
    ("best tourist places to visit in Himachal Pradesh", False),
    ("latest news about space missions to mars", False),
    ("how to write a clean resume for a software job?", False),
    ("what is the distance between earth and moon?", False),
    ("how to play guitar chord progression for beginners?", False),
    ("how to grow tomatoes in home balcony garden?", False),
    ("what is the definition of photosynthesis?", False),
    ("how do you solve a quadratic equation?", False),
    ("which bank offers the highest interest rate on savings?", False),
]

def run_calibration():
    results = []
    print("[CALIBRATION] Running 50 test queries...")
    for query, is_in_scope in TEST_QUERIES:
        query_emb = embedder.encode([query], normalize_embeddings=True)[0]
        scores = np.dot(kb_embeddings, query_emb)
        max_score = float(np.max(scores)) if len(scores) > 0 else 0.0
        results.append((query, is_in_scope, max_score))

    # Evaluate thresholds from 0.15 to 0.45
    best_threshold = 0.28
    best_f1 = 0.0
    best_metrics = {}

    print("\nThreshold Calibration Analysis:")
    print(f"{'Threshold':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 50)

    for threshold in np.linspace(0.15, 0.45, 31):
        tp = fp = tn = fn = 0
        for query, is_in_scope, max_score in results:
            pred_in_scope = max_score >= threshold
            if is_in_scope and pred_in_scope:
                tp += 1
            elif not is_in_scope and pred_in_scope:
                fp += 1
            elif not is_in_scope and not pred_in_scope:
                tn += 1
            elif is_in_scope and not pred_in_scope:
                fn += 1

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

        print(f"{threshold:9.2f} | {precision:9.2f} | {recall:9.2f} | {f1:9.2f}")

        if f1 >= best_f1:
            best_f1 = f1
            best_threshold = threshold
            best_metrics = {"precision": precision, "recall": recall, "f1": f1}

    print("-" * 50)
    print(f"Optimal Threshold: {best_threshold:.2f}")
    print(f"F1-Score: {best_metrics['f1']:.2f} (Precision: {best_metrics['precision']:.2f}, Recall: {best_metrics['recall']:.2f})")
    
    # Save the calibrated threshold to a config file
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rag_config.py")
    with open(config_path, "w") as f:
        f.write(f"# Generated by calibrate_rag.py\n")
        f.write(f"RAG_CALIBRATED_THRESHOLD = {round(best_threshold, 2)}\n")
    print(f"[CALIBRATION] Saved calibrated threshold of {round(best_threshold, 2)} to {config_path}")

if __name__ == "__main__":
    run_calibration()
