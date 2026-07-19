import httpx
import json
import os
from pathlib import Path

# Extract deepseek key safely
e={}
for raw in Path('/opt/data/.env').read_text(encoding='utf-8').splitlines():
 line=raw.strip()
 if line and not line.startswith('#') and '=' in line:
  k,v=line.split('=',1); e[k.strip()]=v.strip().strip('"').strip("'")
api_key = e.get('DEEPSEEK_API_KEY')

print("Triggering Step 0: Baseline Report via DeepSeek V4 Pro...")

# First we need to feed DeepSeek the actual files to read, since it doesn't just
# magically know what's in the directory. We will pack the key structural files.
repo_data = ""

def safe_read(filepath):
    try:
        return Path(filepath).read_text(encoding='utf-8')
    except Exception:
        return "[File unreadable or missing]"

files_to_check = [
    "README.md",
    "backend/app/main.py",
    "backend/requirements.txt",
    "backend/alembic.ini",
    "frontend/admin/package.json",
    "frontend/mobile/package.json",
    "railway.json",
    "railway.toml",
    "vercel.json"
]

for f in files_to_check:
    if Path(f).exists():
        repo_data += f"\n\n--- FILE: {f} ---\n"
        content = safe_read(f)
        repo_data += content[:3000] # truncating slightly to save tokens

prompt = f"""
You are acting as an expert Senior DevOps and Fullstack Engineer.
Please evaluate the provided repository files and create a production-readiness baseline report.

Repository: Emmanuel-Bain-Oduwo/Family_Pledge_Gaza_Project

Here is a snapshot of the core repository files:
{repo_data}

Produce a markdown report answering:
1. current backend health/readiness endpoints;
2. current frontend/admin build scripts;
3. current frontend/mobile build scripts;
4. current migrations setup (is Alembic configured?);
5. current production environment variables required (infer from the files);
6. current known technical risks;
7. exact commands that currently pass (based on standard Python/Node flows);
8. exact commands that currently fail and why.

Do not open a PR. Do not change files. Only produce a report.
"""

try:
    r = httpx.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "deepseek-v4-pro",
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=180
    )

    if r.status_code == 200:
        content = r.json().get('choices', [{}])[0].get('message', {}).get('content', '')
        os.makedirs('docs', exist_ok=True)
        with open('docs/BASELINE_REPORT.md', 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS: Baseline report generated and saved to docs/BASELINE_REPORT.md")
    else:
        print(f"FAILED (HTTP {r.status_code}): {r.text}")
except Exception as e:
    print(f"ERROR: {e}")
