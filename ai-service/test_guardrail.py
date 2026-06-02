#!/usr/bin/env python3
"""Safety guardrail validation — run: python test_guardrail.py"""
import subprocess
import sys

if __name__ == "__main__":
    from pathlib import Path
    root = Path(__file__).resolve().parent
    result = subprocess.run([sys.executable, str(root / "test_text_guardrail_direct.py")], cwd=str(root))
    sys.exit(result.returncode)
