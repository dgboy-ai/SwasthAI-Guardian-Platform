/**
 * localSymptomNet.js
 * In-browser offline symptom classifier.
 * Matches input text with a pre-encoded high-dimensional keyword vocabulary
 * and runs a feedforward pass over the exported SymptomNet neural network weights.
 */

// Clean text and tokenize into words
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f\u0080-\u00ff]/gi, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

// Compute standard softmax
function softmax(arr) {
  const maxVal = Math.max(...arr);
  const exps = arr.map(v => Math.exp(v - maxVal));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

// Lazy-loaded module reference — populated on first call
let metaModule = null;
async function getMeta() {
  if (!metaModule) {
    metaModule = await import('./symptomNetMeta.js');
  }
  return metaModule;
}

/**
 * Predicts the most likely disease from symptom text using in-browser weights.
 * @param {string} text Symptom descriptions
 * @returns {Promise<object>} { prediction, disease, confidence, doctor_specialty, model, accuracy, alternatives }
 */
export async function predictSymptomsOffline(text) {
  if (!text || !text.trim()) {
    return {
      prediction: "Uncertain / Need More Info",
      disease: "Uncertain",
      confidence: 0.0,
      alternatives: [],
      model: "LocalSymptomNet-Offline",
      accuracy: "64.8% (Offline MLP)"
    };
  }

  const { CLASSES, VOCAB_EMBEDDINGS, MODEL_WEIGHTS } = await getMeta();

  const tokens = tokenize(text);
  const dims = 384;
  let sumVector = new Array(dims).fill(0);
  let matchCount = 0;

  // 1. Scan for single words and multi-word phrases from the precomputed vocabulary
  const lowerText = text.toLowerCase();
  
  // Look up pre-encoded vocabulary terms
  Object.keys(VOCAB_EMBEDDINGS).forEach(phrase => {
    // Check if the exact phrase is in the text (bounds or contains)
    if (lowerText.includes(phrase)) {
      const vec = VOCAB_EMBEDDINGS[phrase];
      // Give more weight to multi-word phrases if matched
      const weight = phrase.includes(' ') ? 2.0 : 1.0;
      for (let i = 0; i < dims; i++) {
        sumVector[i] += vec[i] * weight;
      }
      matchCount += weight;
    }
  });

  // If no words matched, try individual token fallbacks or yield zeros
  if (matchCount === 0) {
    tokens.forEach(tok => {
      // Fuzzy character prefix check if not exact match
      const matchedPhrase = Object.keys(VOCAB_EMBEDDINGS).find(p => p.startsWith(tok) || tok.startsWith(p));
      if (matchedPhrase) {
        const vec = VOCAB_EMBEDDINGS[matchedPhrase];
        for (let i = 0; i < dims; i++) {
          sumVector[i] += vec[i];
        }
        matchCount += 1.0;
      }
    });
  }

  // Construct input vector
  const inputVector = new Array(dims).fill(0);
  if (matchCount > 0) {
    for (let i = 0; i < dims; i++) {
      inputVector[i] = sumVector[i] / matchCount;
    }
  }

  // 2. Feedforward MLP pass
  // Layer 1: Linear 384 -> 128
  const w1 = MODEL_WEIGHTS[0].weights; // Shape: [128, 384]
  const b1 = MODEL_WEIGHTS[0].bias;    // Shape: [128]
  const hidden1 = new Array(128).fill(0);
  for (let i = 0; i < 128; i++) {
    let sum = b1[i];
    for (let j = 0; j < dims; j++) {
      sum += inputVector[j] * w1[i][j];
    }
    hidden1[i] = Math.max(0, sum); // ReLU activation
  }

  // Layer 2: Linear 128 -> 64
  const w2 = MODEL_WEIGHTS[1].weights; // Shape: [64, 128]
  const b2 = MODEL_WEIGHTS[1].bias;    // Shape: [64]
  const hidden2 = new Array(64).fill(0);
  for (let i = 0; i < 64; i++) {
    let sum = b2[i];
    for (let j = 0; j < 128; j++) {
      sum += hidden1[j] * w2[i][j];
    }
    hidden2[i] = Math.max(0, sum); // ReLU activation
  }

  // Layer 3: Linear 64 -> num_classes (101)
  const w3 = MODEL_WEIGHTS[2].weights; // Shape: [101, 64]
  const b3 = MODEL_WEIGHTS[2].bias;    // Shape: [101]
  const logits = new Array(CLASSES.length).fill(0);
  for (let i = 0; i < CLASSES.length; i++) {
    let sum = b3[i];
    for (let j = 0; j < 64; j++) {
      sum += hidden2[j] * w3[i][j];
    }
    logits[i] = sum; // Output logits
  }

  // 3. Compute Softmax Probabilities
  const probs = softmax(logits);

  // 4. Extract Top-3 Predictions
  const indexedProbs = probs.map((prob, idx) => ({ prob, idx }));
  indexedProbs.sort((a, b) => b.prob - a.prob);

  const top1 = indexedProbs[0];
  const predictedDisease = CLASSES[top1.idx];
  const confidence = Math.min(1.0, Math.max(0.0, top1.prob));

  const alternatives = indexedProbs.slice(1, 4).map(item => ({
    disease: item.idx < CLASSES.length ? CLASSES[item.idx] : "Unknown",
    confidence: Math.round(item.prob * 100) / 100
  }));

  // Map specialty from disease category (mock dictionary matches backend logic)
  const specialties = {
    "Malaria": "Infectious Disease Specialist",
    "Dengue": "Infectious Disease Specialist",
    "Typhoid": "General Physician",
    "Tuberculosis": "Pulmonologist / Chest Specialist",
    "Cholera": "Gastroenterologist",
    "Snakebite": "Emergency Medicine Specialist",
    "Pregnancy": "Obstetrician / Gynecologist",
    "Malnutrition": "Pediatric Nutritionist",
    "Pneumonia": "Pulmonologist",
    "Heatstroke": "Emergency Care Coordinator",
    "Jaundice": "Hepatologist / Gastroenterologist",
    "Anaemia": "Hematologist"
  };

  const doctorSpecialty = specialties[predictedDisease] || "General Physician";
  
  // Detailed diagnostic friendly advice
  const detailedPrediction = `${predictedDisease} - Reliable Advice: Consult your local ASHA worker or visit the nearest PHC.`;

  return {
    prediction: detailedPrediction,
    disease: predictedDisease,
    confidence: Math.round(confidence * 100) / 100,
    doctor_specialty: doctorSpecialty,
    alternatives: alternatives,
    model: "LocalSymptomNet-Offline (ONNX compiled weights)",
    accuracy: "64.8% (101 diseases, 7 languages)",
    offline: true
  };
}
