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

# Generate dataset and train fast fallback RF model
RUN python generate_dataset.py && python train_disease_model.py

EXPOSE 8000

RUN useradd -m -u 1001 swasthai && chown -R swasthai:swasthai /app
USER swasthai

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
