#!/usr/bin/env python3
import os
import sys
import urllib.request
import urllib.error

# Environment variables
API_BASE_URL = os.getenv("API_BASE_URL", "https://familypledgegazaproject-production.up.railway.app/api/v1")
ADMIN_URL = os.getenv("ADMIN_URL", "https://family-pledge-gaza-project.vercel.app")
MOBILE_URL = os.getenv("MOBILE_URL", "https://family-pledge-gaza-project-demo.vercel.app")

endpoints = [
    ("Backend Health", f"{API_BASE_URL.replace('/api/v1', '')}/health"),
    ("Backend Ready", f"{API_BASE_URL.replace('/api/v1', '')}/ready"),
    ("Admin Dashboard", ADMIN_URL),
    ("Mobile Web Preview", MOBILE_URL),
]

all_passed = True
print("Starting Production Smoke Test...")

for name, url in endpoints:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            if status == 200:
                print(f"[PASS] {name}: HTTP 200 OK")
            else:
                print(f"[FAIL] {name}: HTTP {status}")
                all_passed = False
    except urllib.error.URLError as e:
        print(f"[FAIL] {name}: Unreachable ({e.reason})")
        all_passed = False
    except Exception as e:
        print(f"[FAIL] {name}: Exception {e}")
        all_passed = False

if not all_passed:
    print("\nSMOKE TEST FAILED.")
    sys.exit(1)

print("\nSMOKE TEST PASSED.")
sys.exit(0)
