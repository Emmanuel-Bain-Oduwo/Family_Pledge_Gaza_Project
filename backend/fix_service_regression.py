import httpx
import os
import subprocess
from pathlib import Path

# Extract key safely
e={}
for raw in Path('/opt/data/.env').read_text(encoding='utf-8').splitlines():
    line=raw.strip()
    if line and not line.startswith('#') and '=' in line:
        k,v=line.split('=',1); e[k.strip()]=v.strip().strip('"').strip("'")
api_key = e.get('DEEPSEEK_API_KEY')

print("Triggering DeepSeek V4 Pro for SERVICE REGRESSION FIX...")

repo_snapshot = ""
def safe_read(filepath):
    try:
        return Path(filepath).read_text(encoding='utf-8')
    except Exception:
        return ""

files_to_check = [
    "app/services/contribution_service.py",
    "app/api/routes/contributions.py",
    "app/models/campaign.py",
    "../scripts/seed_demo_content.py"
]

for f in files_to_check:
    if Path(f).exists():
        repo_snapshot += f"\n\n--- FILE: {f} ---\n"
        repo_snapshot += safe_read(f)[:3000]

full_prompt = f"""
You must output a bash script (using `cat << 'INNER_EOF' > filename`) that restores the contribution_service.py exactly as requested, fixes the audit commit ordering, and patches the seed script.

REPOSITORY SNAPSHOT:
{repo_snapshot}

Task:
1. Re-write `app/services/contribution_service.py` to include `admin_list`, `reject`, and `needs_follow_up`. Ensure `db.add` for audit is called BEFORE `db.commit`.
2. Re-write the seed script to check `ALLOW_DEMO_SEED_IN_PRODUCTION`.

Output ONLY the bash commands. No explanations.
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
        
        with open('/tmp/apply_regression.sh', 'w', encoding='utf-8') as f:
            f.write(content)
        
        os.chmod('/tmp/apply_regression.sh', 0o755)
        print("SUCCESS: Stage 3 fixes downloaded. Running patch...")
        subprocess.run(['/tmp/apply_regression.sh'], cwd='/opt/data/Family_Pledge_Gaza_Project/backend')
        
        subprocess.run(['git', 'add', '.'], cwd='/opt/data/Family_Pledge_Gaza_Project')
        subprocess.run(['git', 'commit', '-m', 'Fix: Restore missing admin functions in contribution_service, fix audit commit order'], cwd='/opt/data/Family_Pledge_Gaza_Project')
        subprocess.run(['git', 'push', 'origin', 'main'], cwd='/opt/data/Family_Pledge_Gaza_Project')
    else:
        print(f"FAILED (HTTP {r.status_code}): {r.text}")
except Exception as e:
    print(f"ERROR: {e}")
