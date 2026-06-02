"""
Agentic Outbreak Monitor — Autonomous public health intelligence loop.
Runs every 30 minutes in a background thread.
Queries the SwasthAI backend for recent symptom clusters by village.
Calls Groq Llama-3 to classify: real outbreak vs seasonal noise.
If outbreak confirmed (>70% confidence), posts to backend → DynamoDB outbreak_telemetry.

Architecture note: Outbreak events are stored in Amazon DynamoDB (outbreak_telemetry table,
composite key: villageId HASH + detectedAt RANGE) via the backend API.
This ensures events are queryable cross-service and not siloed in a local SQLite file.
"""
import os
import json
import threading
import time
import requests
from datetime import datetime
from groq import Groq

BACKEND_URL   = os.getenv("BACKEND_URL", "http://localhost:5000")
AGENT_SECRET  = os.getenv("AGENT_SECRET")
if not AGENT_SECRET and os.getenv("NODE_ENV") == "production":
    raise RuntimeError("AGENT_SECRET is required for OutbreakAgent in production")
CHECK_INTERVAL_SECONDS = 30 * 60  # 30 minutes

# ── Cluster Fetching ────────────────────────────────────────────────────────────
def _fetch_symptom_clusters():
    """Fetch recent symptom records from backend grouped by village."""
    if not AGENT_SECRET:
        return []
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
        "As a public health epidemiologist, analyze if this represents a disease outbreak "
        "or normal seasonal variation. "
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
        start = text.find('{')
        end   = text.rfind('}') + 1
        return json.loads(text[start:end])
    except Exception as e:
        print(f"[AGENT] Groq classification error: {e}")
        return {"outbreak": False, "confidence": 0.0, "disease": "unknown", "action": "Monitor closely."}

# ── Notification — posts to backend which writes to DynamoDB ────────────────────
def _trigger_asha_alert(village_id: str, disease: str, action: str,
                         confidence: float, case_count: int, symptoms: str):
    """
    POST outbreak event to backend → backend writes to DynamoDB outbreak_telemetry
    (composite key: villageId + detectedAt) AND broadcasts via SSE to admin dashboard.
    """
    try:
        headers = {"X-Agent-Secret": AGENT_SECRET, "Content-Type": "application/json"}
        payload = {
            "villageId":      village_id,
            "disease":        disease,
            "action":         action,
            "confidence":     confidence,
            "caseCount":      case_count,
            "symptomPattern": symptoms,
            "detectedAt":     datetime.utcnow().isoformat() + "Z",
            "source":         "OutbreakAgent-v2"
        }
        res = requests.post(
            f"{BACKEND_URL}/api/admin/outbreak-alert",
            json=payload,
            headers=headers,
            timeout=10,
        )
        if res.status_code in (200, 201):
            print(f"[AGENT] ✅ Outbreak alert stored in DynamoDB for village {village_id}: {disease}")
        else:
            print(f"[AGENT] ⚠️  Backend returned {res.status_code}: {res.text[:200]}")
    except Exception as e:
        print(f"[AGENT] Failed to send alert to backend: {e}")

def get_recent_outbreaks(limit=10):
    """
    Proxy to backend — which reads from DynamoDB outbreak_telemetry.
    Called by FastAPI /admin/outbreaks endpoint.
    """
    try:
        headers = {"X-Agent-Secret": AGENT_SECRET}
        res = requests.get(
            f"{BACKEND_URL}/api/admin/outbreaks-dynamo",
            params={"limit": limit},
            headers=headers,
            timeout=8
        )
        if res.status_code == 200:
            return res.json().get("outbreaks", [])
    except Exception as e:
        print(f"[AGENT] Failed to fetch recent outbreaks from backend: {e}")
    return []

# ── Main Agent Loop ─────────────────────────────────────────────────────────────
def run_outbreak_agent():
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        print("[AGENT] No GROQ_API_KEY found. Outbreak agent will not run.")
        return

    print(f"[AGENT] 🤖 Agentic Outbreak Monitor v2 started. Interval: {CHECK_INTERVAL_SECONDS // 60} minutes.")
    print(f"[AGENT] Storage: DynamoDB outbreak_telemetry via {BACKEND_URL}")

    while True:
        print(f"[AGENT] Running outbreak scan at {datetime.utcnow().isoformat()}Z")
        clusters = _fetch_symptom_clusters()

        for cluster in clusters:
            if cluster.get("count", 0) < 3:
                continue  # Ignore tiny clusters (< 3 cases not epidemiologically significant)

            result = _classify_cluster(cluster, groq_api_key)

            if result.get("outbreak") and result.get("confidence", 0) >= 0.7:
                village_id = cluster["villageId"]
                disease    = result.get("disease", "Unknown")
                action     = result.get("action", "Escalate to district health officer.")
                confidence = result["confidence"]

                print(f"[AGENT] 🚨 OUTBREAK DETECTED in {village_id}: {disease} ({confidence:.0%} confidence)")
                _trigger_asha_alert(
                    village_id, disease, action, confidence,
                    cluster["count"], cluster.get("symptoms", "")
                )
            else:
                print(f"[AGENT] ✔ Village {cluster['villageId']}: No outbreak "
                      f"({cluster['count']} cases, confidence={result.get('confidence', 0):.0%})")

        time.sleep(CHECK_INTERVAL_SECONDS)

def start_agent_background():
    """Start agent as a daemon thread — auto-stops when FastAPI stops."""
    t = threading.Thread(target=run_outbreak_agent, daemon=True)
    t.start()
    return t

