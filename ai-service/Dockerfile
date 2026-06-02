# ── AI Service (FastAPI + Python) ─────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train fallback RF + deep SymptomNet if artifacts are missing (gitignored .pkl files)
RUN python train_disease_model.py && \
    (test -f deep_disease_model.pkl || python train_deep_model.py)

EXPOSE 8000

RUN useradd -m -u 1001 swasthai
USER swasthai

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
