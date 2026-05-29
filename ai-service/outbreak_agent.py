"""
Agentic Outbreak Monitor — Autonomous public health intelligence loop.
Runs every 30 minutes in a background thread.
Queries the SwasthAI backend for recent symptom clusters by village.
Calls Groq to classify: real outbreak vs seasonal noise.
If outbreak confirmed (>70% confidence), auto-generates a structured alert.
Stores outbreak events in local SQLite for admin dashboard.
"""
import os
import json
import sqlite3
import threading
import time
import requests
from datetime import datetime
from groq import Groq

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
AGENT_SECRET = os.getenv("AGENT_SECRET", "swasthai_agent_internal_2026")
DB_PATH = os.path.join(os.path.dirname(__file__), "outbreak_events.db")
CHECK_INTERVAL_SECONDS = 30 * 60  # 30 minutes

# ── Outbreak Event DB ───────────────────────────────────────────────────────────
def _init_outbreak_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS outbreak_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            villageId TEXT,
            symptomPattern TEXT,
            caseCount INTEGER,
            confidence REAL,
            classification TEXT,
            action TEXT,
            detectedAt TEXT
        )
    """)
    conn.commit()
    conn.close()

def _save_outbreak(village_id, symptom_pattern, case_count, confidence, classification, action):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO outbreak_events (villageId, symptomPattern, caseCount, confidence, classification, action, detectedAt) VALUES (?,?,?,?,?,?,?)",
        (village_id, symptom_pattern, case_count, confidence, classification, action, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()

def get_recent_outbreaks(limit=10):
    """Called by FastAPI endpoint so admin dashboard can see alerts."""
    _init_outbreak_db()
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT * FROM outbreak_events ORDER BY detectedAt DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [
        {
            "id": r[0], "villageId": r[1], "symptomPattern": r[2],
            "caseCount": r[3], "confidence": r[4], "classification": r[5],
            "action": r[6], "detectedAt": r[7],
        }
        for r in rows
    ]

# ── Cluster Fetching ────────────────────────────────────────────────────────────
def _fetch_symptom_clusters():
    """Fetch recent symptom records from backend grouped by village."""
    try:
        headers = {"X-Agent-Secret": AGENT_SECRET}
        res = requests.get(f"{BACKEND_URL}/api/admin/clusters", headers=headers, timeout=10)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        print(f"[AGENT] Failed to fetch clusters: {e}")
    return []

# ── Groq Classification ─────────────────────────────────────────────────────────
def _classify_cluster(cluster: dict, groq_api_key: str) -> dict:
    """Ask Groq to determine if a village symptom cluster is a real outbreak."""
    client = Groq(api_key=groq_api_key)
    prompt = (
        f"Village ID: {cluster['villageId']}\n"
        f"Reported cases in last 24 hours: {cluster['count']}\n"
        f"Common symptoms: {cluster['symptoms']}\n\n"
        "As a public health epidemiologist, analyze if this represents a disease outbreak or normal seasonal variation. "
        "Respond ONLY with valid JSON: "
        '{"outbreak": true/false, "confidence": 0.0-1.0, "disease": "disease name or unknown", "action": "recommended action in one sentence"}'
    )
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=150,
        )
        text = response.choices[0].message.content.strip()
        # Extract JSON safely
        start = text.find('{')
        end = text.rfind('}') + 1
        return json.loads(text[start:end])
    except Exception as e:
        print(f"[AGENT] Groq classification error: {e}")
        return {"outbreak": False, "confidence": 0.0, "disease": "unknown", "action": "Monitor closely."}

# ── Notification ────────────────────────────────────────────────────────────────
def _trigger_asha_alert(village_id: str, disease: str, action: str):
    """Notify backend to flag an outbreak alert for NGO/Admin dashboard."""
    try:
        headers = {"X-Agent-Secret": AGENT_SECRET, "Content-Type": "application/json"}
        requests.post(
            f"{BACKEND_URL}/api/admin/outbreak-alert",
            json={"villageId": village_id, "disease": disease, "action": action},
            headers=headers,
            timeout=10,
        )
        print(f"[AGENT] ✅ Outbreak alert sent for village {village_id}: {disease}")
    except Exception as e:
        print(f"[AGENT] Failed to send alert: {e}")

# ── Main Agent Loop ─────────────────────────────────────────────────────────────
def run_outbreak_agent():
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print("[AGENT] No GROQ_API_KEY found. Outbreak agent will not run.")
        return

    _init_outbreak_db()
    print(f"[AGENT] 🤖 Agentic Outbreak Monitor started. Checking every {CHECK_INTERVAL_SECONDS // 60} minutes.")

    while True:
        print(f"[AGENT] Running outbreak scan at {datetime.utcnow().isoformat()}Z")
        clusters = _fetch_symptom_clusters()

        for cluster in clusters:
            if cluster.get("count", 0) < 3:
                continue  # Ignore tiny clusters
            result = _classify_cluster(cluster, groq_api_key)

            if result.get("outbreak") and result.get("confidence", 0) >= 0.7:
                village_id = cluster["villageId"]
                disease = result.get("disease", "Unknown")
                action = result.get("action", "Escalate to district health officer.")
                confidence = result["confidence"]

                print(f"[AGENT] 🚨 OUTBREAK DETECTED in {village_id}: {disease} ({confidence:.0%} confidence)")
                _save_outbreak(village_id, cluster["symptoms"], cluster["count"], confidence, disease, action)
                _trigger_asha_alert(village_id, disease, action)
            else:
                print(f"[AGENT] ✔ Village {cluster['villageId']}: No outbreak ({cluster['count']} cases, confidence={result.get('confidence', 0):.0%})")

        time.sleep(CHECK_INTERVAL_SECONDS)

def start_agent_background():
    """Start agent as a daemon thread — auto-stops when FastAPI stops."""
    t = threading.Thread(target=run_outbreak_agent, daemon=True)
    t.start()
    return t
