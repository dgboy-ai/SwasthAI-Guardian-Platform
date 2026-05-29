# ── AI Service (FastAPI + Python) ─────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Install system deps for Pillow and scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source files
COPY . .

# Train the model if pkl doesn't exist yet (first run only)
RUN python train_disease_model.py

EXPOSE 8000

# Non-root user for security
RUN useradd -m -u 1001 swasthai
USER swasthai

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
