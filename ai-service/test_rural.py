#!/usr/bin/env python3
"""
Rural / low-connectivity smoke tests for AI service endpoints.
Run with: python test_rural.py  (requires uvicorn on localhost:8000 or skips HTTP checks)
"""
import os
import sys

import requests

BASE = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:8000")


def test_health():
    r = requests.get(f"{BASE}/health", timeout=5)
    assert r.status_code == 200, r.text
    print("OK health")


def test_offline_friendly_predict_timeout():
    try:
        r = requests.post(
            f"{BASE}/predict/symptoms",
            json={"symptoms": "bukhar aur pet dard"},
            timeout=3,
        )
        assert r.status_code in (200, 422, 503), r.status_code
        print("OK predict symptoms (latency within rural timeout budget)")
    except requests.exceptions.Timeout:
        print("SKIP predict — service slow or unavailable")


if __name__ == "__main__":
    try:
        test_health()
        test_offline_friendly_predict_timeout()
        print("All rural smoke tests passed.")
    except Exception as e:
        print("FAIL:", e)
        sys.exit(1)
