import os
import numpy as np
from sentence_transformers import SentenceTransformer
from health_kb_data import HEALTH_KNOWLEDGE

def main():
    print("[RAG Precompute] Loading health knowledge base...")
    texts = [chunk["text"] for chunk in HEALTH_KNOWLEDGE]
    print(f"[RAG Precompute] Loaded {len(texts)} chunks.")

    model_name = "paraphrase-multilingual-MiniLM-L12-v2"
    # Persist model to local cache just in case
    _MODEL_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".model_cache")
    os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", _MODEL_CACHE)
    
    print(f"[RAG Precompute] Loading SentenceTransformer: {model_name}...")
    embedder = SentenceTransformer(model_name)

    print("[RAG Precompute] Encoding knowledge base texts...")
    embeddings = embedder.encode(texts, normalize_embeddings=True, show_progress_bar=True)

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "kb_embeddings.npy")
    np.save(output_path, embeddings)
    print(f"[RAG Precompute] Saved embeddings of shape {embeddings.shape} to {output_path}")

if __name__ == "__main__":
    main()
