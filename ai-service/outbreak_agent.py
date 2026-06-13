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
import sys
import json
import threading
import time
import requests
from datetime import datetime
from groq import Groq

# ── Fix Windows cp1252 UnicodeEncodeError for emoji in print statements ─────────
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf-8-sig'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BACKEND_URL   = os.getenv("BACKEND_URL", "http://localhost:3001")
AGENT_SECRET  = os.getenv("AGENT_SECRET")

if not AGENT_SECRET or AGENT_SECRET == "REPLACE_WITH_RANDOM_AGENT_SECRET":
    if os.getenv("NODE_ENV") == "production":
        raise RuntimeError("FATAL: AGENT_SECRET environment variable is required for OutbreakAgent in production.")
    else:
        print("[AGENT] [!] Using fallback development AGENT_SECRET.")
        AGENT_SECRET = "dev-only-agent-secret"

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

# ── Duplicate Check ─────────────────────────────────────────────────────────────
def _is_duplicate_outbreak(village_id: str, disease: str) -> bool:
    """Check DynamoDB (via backend proxy) for an existing outbreak with same villageId + disease within 24h."""
    if not AGENT_SECRET:
        return False
    try:
        headers = {"X-Agent-Secret": AGENT_SECRET}
        res = requests.get(
            f"{BACKEND_URL}/api/admin/outbreaks-dynamo",
            params={"days": 1, "limit": 100},
            headers=headers,
            timeout=8
        )
        if res.status_code == 200:
            outbreaks = res.json().get("outbreaks", [])
            for ob in outbreaks:
                if ob.get("villageId") == village_id:
                    existing_disease = ob.get("disease", "").lower().strip()
                    new_disease = disease.lower().strip()
                    # Check if standard disease names match or contain each other
                    if new_disease in existing_disease or existing_disease in new_disease:
                        return True
    except Exception as e:
        print(f"[AGENT] Error checking for duplicate outbreaks: {e}")
    return False

# ── Groq Classification ─────────────────────────────────────────────────────────
def _classify_cluster(cluster: dict, groq_api_key: str) -> dict:
    """Ask Groq (Llama-3.3-70b) to determine if a village symptom cluster is a real outbreak with retries/JSON mode."""
    import random
    client = Groq(api_key=groq_api_key)
    prompt = (
        "You are an expert public health epidemiologist analyzing potential disease outbreaks in rural India.\n"
        f"Village ID: {cluster['villageId']}\n"
        f"Reported cases in last 24 hours: {cluster['count']}\n"
        f"Common symptoms: {cluster['symptoms']}\n\n"
        "Determine if this cluster represents an active epidemic/outbreak or typical seasonal variation. "
        "You MUST return JSON format containing exactly the following keys:\n"
        "- \"outbreak\": boolean (true if outbreak detected, false otherwise)\n"
        "- \"confidence\": float (0.0 to 1.0 confidence score)\n"
        "- \"disease\": string (standard medical name of suspected disease, or \"unknown\")\n"
        "- \"action\": string (recommended immediate response for local health workers in one sentence)\n"
    )
    
    max_retries = 3
    base_delay = 2.0
    
    for attempt in range(max_retries):
        try:
            # Enforce API client timeout of 10 seconds and utilize llama-3.3-70b-versatile with JSON mode
            response = client.chat.completions.with_options(timeout=10.0).create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=150,
                response_format={"type": "json_object"}
            )
            text = response.choices[0].message.content.strip()
            start = text.find('{')
            end   = text.rfind('}') + 1
            return json.loads(text[start:end])
        except Exception as e:
            delay = (base_delay ** attempt) + random.uniform(0.5, 1.5)
            print(f"[AGENT] Groq classification attempt {attempt+1}/{max_retries} failed: {e}. Retrying in {delay:.1f}s...")
            if attempt < max_retries - 1:
                time.sleep(delay)
            else:
                print("[AGENT] Max retries reached. Failing classification for this cluster.")
                
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

def _report_agent_scan(village_id: str, count: int, symptoms: str, result: dict):
    try:
        headers = {"X-Agent-Secret": AGENT_SECRET, "Content-Type": "application/json"}
        payload = {
            "villageId": village_id,
            "casesScanned": count,
            "symptoms": symptoms,
            "outbreakDetected": result.get("outbreak", False),
            "disease": result.get("disease", "unknown"),
            "confidence": result.get("confidence", 0.0),
            "action": result.get("action", ""),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        requests.post(
            f"{BACKEND_URL}/api/admin/agent-scan",
            json=payload,
            headers=headers,
            timeout=8
        )
    except Exception as e:
        print(f"[AGENT] Failed to report agent scan heartbeat: {e}")

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

    print(f"[AGENT] [OK] Agentic Outbreak Monitor v2 started. Interval: {CHECK_INTERVAL_SECONDS // 60} minutes.")
    print(f"[AGENT] Storage: DynamoDB outbreak_telemetry via {BACKEND_URL}")

    while True:
        print(f"[AGENT] Running outbreak scan at {datetime.utcnow().isoformat()}Z")
        clusters = _fetch_symptom_clusters()

        scans_reported = 0
        for cluster in clusters:
            try:
                count = int(cluster.get("count", 0))
            except (ValueError, TypeError):
                count = 0
            if count < 3:
                continue  # Ignore tiny clusters (< 3 cases not epidemiologically significant)

            result = _classify_cluster(cluster, groq_api_key)

            # Report telemetry scan to backend
            _report_agent_scan(cluster["villageId"], count, cluster.get("symptoms", ""), result)
            scans_reported += 1

            if result.get("outbreak") and result.get("confidence", 0) >= 0.7:
                village_id = cluster["villageId"]
                disease    = result.get("disease", "Unknown")
                action     = result.get("action", "Escalate to district health officer.")
                confidence = result["confidence"]

                # Deduplication: check DynamoDB records from the last 24h
                if _is_duplicate_outbreak(village_id, disease):
                    print(f"[AGENT] [SKIP] Skipping duplicate alert for village {village_id} (disease: {disease} flagged in last 24h)")
                    continue

                print(f"[AGENT] [ALERT] OUTBREAK DETECTED in {village_id}: {disease} ({confidence:.0%} confidence)")
                _trigger_asha_alert(
                    village_id, disease, action, confidence,
                    cluster["count"], cluster.get("symptoms", "")
                )
            else:
                print(f"[AGENT] [OK] Village {cluster['villageId']}: No outbreak "
                      f"({cluster['count']} cases, confidence={result.get('confidence', 0):.0%})")

        if scans_reported == 0:
            # Send an idle heartbeat scan to let backend know agent is alive and scanning
            _report_agent_scan("system-check", 0, "No active symptom clusters detected.", {"outbreak": False, "confidence": 0.0, "disease": "None", "action": "Continue monitoring."})

        time.sleep(CHECK_INTERVAL_SECONDS)

def start_agent_background():
    """Start agent as a daemon thread — auto-stops when FastAPI stops."""
    t = threading.Thread(target=run_outbreak_agent, daemon=True)
    t.start()
    return t


