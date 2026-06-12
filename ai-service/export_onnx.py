import os
import joblib
import json
import numpy as np
import torch
import torch.nn as nn
from model_def import SymptomNet
from sentence_transformers import SentenceTransformer

def main():
    print("[...] Starting export process...")
    ai_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(ai_dir, "deep_disease_model.pkl")
    
    if not os.path.exists(model_path):
        print(f"[ERROR] {model_path} not found. Please train the model first.")
        return
        
    print(f"[...] Loading model from {model_path}")
    bundle = joblib.load(model_path)
    state_dict = bundle['model_state']
    classes = bundle['label_encoder'].classes_.tolist()
    input_dim = bundle['input_dim']
    num_classes = bundle['num_classes']
    
    # 1. Instantiate PyTorch Model and Load Weights
    has_bn = any("running_mean" in k for k in state_dict.keys())
    model = SymptomNet(input_dim, num_classes, use_batch_norm=has_bn)
    model.load_state_dict(state_dict)
    model.eval()
    print("[OK] PyTorch SymptomNet model loaded successfully.")

    # 2. Export PyTorch Model to ONNX
    onnx_output_path = os.path.join(os.path.dirname(ai_dir), "frontend", "public", "symptomnet.onnx")
    os.makedirs(os.path.dirname(onnx_output_path), exist_ok=True)
    
    dummy_input = torch.randn(1, input_dim)
    torch.onnx.export(
        model,
        dummy_input,
        onnx_output_path,
        export_params=True,
        opset_version=18,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )
    print(f"[OK] Exported SymptomNet to ONNX: {onnx_output_path}")

    # 3. Precompute Multi-lingual Symptom Keyword Embeddings
    print("[...] Loading SentenceTransformer embedder to precompute key vocabulary embeddings...")
    embedder = SentenceTransformer(bundle['embedding_model'])
    
    # Define vocabulary including all supported languages (EN, HI, TA, TE, MR, BN)
    vocab = [
        # English Symptoms
        "fever", "cough", "chest pain", "breathing difficulty", "bleeding", "headache", "vomiting", 
        "weakness", "dizziness", "vision loss", "paralysis", "pain", "spots", "rash", "diarrhea", 
        "chills", "nausea", "stomach pain", "fatigue", "sore throat", "runny nose", "cold", "flu", 
        "itching", "blister", "constipation", "yellow skin", "yellow eyes", "blood in stool",
        
        # Hindi Transliterated & Devanagari
        "bukhar", "bukhaar", "khansi", "khansi khansi", "dard", "kamzori", "pet dard", "chakti", "sujan", "soojan",
        "khoon", "ulti", "ultiya", "dast", "zukaam", "zukam", "chakkar", "sardi", "gala kharab",
        "बुखार", "दर्द", "कमजोरी", "पेट", "खुजली", "सूजन", "खून", "सर्दी", "जुकाम", "सांस", 
        "चक्कर", "दस्त", "उल्टी", "थकान", "दाने", "छाले", "खांसी", "पसीना", "पेशाब", "सांप",
        
        # Tamil
        "kaichal", "irumal", "moochu", "maarbu", "vali", "thalaivaali", "vayiru", "thalarchi",
        "காய்ச்சல்", "இருமல்", "மூச்சுத் திணறல்", "வலி", "தலைவலி", "வயிற்று வலி", "மயக்கம்",
        
        # Telugu
        "nappi", "jvaram", "kemmu", "vomiting", "కడుపు నొప్పి", "జ్వరం", "దగ్గు", "ఆయాసం", "తలనెప్పి",
        
        # Marathi
        "taap", "khokla", "dokvedna", "potalat dukhte", "ताप", "खोकला", "डोकेदुखी", "पोटदुखी", "अशक्तपणा",
        
        # Bengali
        "jwor", "kashi", "betha", "durbolota", "জ্বর", "কাশি", "ব্যথা", "দুর্বলতা", "বমি", "পেট ব্যথা",
        
        # Key combination phrases
        "fever cough", "fever cold", "chest pain breathing difficulty", "vomiting diarrhea", "headache fever"
    ]
    
    # Clean duplicates
    vocab = list(sorted(list(set(vocab))))
    
    print(f"[...] Encoding {len(vocab)} terms in embedding space...")
    embeddings = embedder.encode(vocab)
    
    vocab_map = {}
    for term, emb in zip(vocab, embeddings):
        vocab_map[term] = [round(float(val), 5) for val in emb]
        
    # 4. Extract weights for pure JS fail-safe runner (in case ONNX Web WASM initialization fails)
    # We retrieve weights and biases from final_model layers
    linear_layers = []
    for layer in model.network:
        if isinstance(layer, nn.Linear):
            linear_layers.append({
                "weights": [[round(float(w), 5) for w in row] for row in layer.weight.data.numpy()],
                "bias": [round(float(b), 5) for b in layer.bias.data.numpy()]
            })
            
    # Write metadata module to frontend
    meta_path = os.path.join(os.path.dirname(ai_dir), "frontend", "src", "utils", "symptomNetMeta.js")
    
    meta_content = f"""/**
 * symptomNetMeta.js
 * Automatically compiled from PyTorch SymptomNet.
 * Contains metadata, vocabulary embeddings, and linear weights for offline inference.
 */

export const CLASSES = {json.dumps(classes)};

export const VOCAB_EMBEDDINGS = {json.dumps(vocab_map, indent=2)};

export const MODEL_WEIGHTS = {json.dumps(linear_layers, indent=2)};
"""
    
    with open(meta_path, "w", encoding="utf-8") as f:
        f.write(meta_content)
        
    print(f"[OK] Saved embedding vocabulary and model metadata to: {meta_path}")

if __name__ == "__main__":
    main()
