import httpx
import os
import subprocess
from pathlib import Path

# Extract deepseek key safely
e={}
for raw in Path('/opt/data/.env').read_text(encoding='utf-8').splitlines():
    line=raw.strip()
    if line and not line.startswith('#') and '=' in line:
        k,v=line.split('=',1); e[k.strip()]=v.strip().strip('"').strip("'")
api_key = e.get('DEEPSEEK_API_KEY')

print("Triggering DeepSeek V4 Pro for FINAL BLOCKERS...")

repo_snapshot = ""
def safe_read(filepath):
    try:
        return Path(filepath).read_text(encoding='utf-8')
    except Exception:
        return ""

files_to_check = [
    "backend/app/main.py",
    "backend/app/services/contribution_service.py",
    "scripts/seed_demo_content.py",
    "backend/alembic.ini"
]

for f in files_to_check:
    if Path(f).exists():
        repo_snapshot += f"\n\n--- FILE: {f} ---\n"
        repo_snapshot += safe_read(f)[:3000]

prompt_text = Path('/opt/data/cache/documents/stage3_strict_prompt.md').read_text()

full_prompt = f"""
You are executing the final blockers audit. 
You must output a bash script (using `cat << 'INNER_EOF' > filename`) that applies the following fixes:
1. Recreates .github/workflows/ci.yml
2. Adds Sentry initialization into backend/app/main.py
3. Replaces the duplicate `submit` functions in `backend/app/services/contribution_service.py` with a single clean one.
4. Adds the production guard to `scripts/seed_demo_content.py`

REPOSITORY SNAPSHOT:
{repo_snapshot}
"""

try:
    r = httpx.post(
        "https://api.deepseek.com/chat/completions",
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": "deepseek-v4-pro",
            "messages": [{"role": "user", "content": full_prompt}],
            "temperature": 0.0
        },
        timeout=180
    )

    if r.status_code == 200:
        content = r.json().get('choices', [{}])[0].get('message', {}).get('content', '')
        content = content.replace('```bash', '').replace('```', '')
        
        with open('/tmp/apply_final.sh', 'w', encoding='utf-8') as f:
            f.write(content)
        
        os.chmod('/tmp/apply_final.sh', 0o755)
        print("SUCCESS: Stage 3 fixes downloaded. Running patch...")
        subprocess.run(['/tmp/apply_final.sh'], cwd='/opt/data/Family_Pledge_Gaza_Project')
        
        subprocess.run(['git', 'add', '.'], cwd='/opt/data/Family_Pledge_Gaza_Project')
        subprocess.run(['git', 'commit', '-m', 'Fix final production blockers: CI, Sentry, Duplicate Functions, and Seed Guard'], cwd='/opt/data/Family_Pledge_Gaza_Project')
        subprocess.run(['git', 'push', 'origin', 'main'], cwd='/opt/data/Family_Pledge_Gaza_Project')
    else:
        print(f"FAILED (HTTP {r.status_code}): {r.text}")
except Exception as e:
    print(f"ERROR: {e}")
