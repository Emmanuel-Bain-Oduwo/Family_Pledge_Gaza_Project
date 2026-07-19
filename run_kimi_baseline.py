import httpx
import json

api_key = "sk-ai-v1-952cccc6b5ed556ce5fb32a705a6d7e70b4c4747493863b6488d639841e6ee8c"
base_url = "https://zenmux.ai/api/v1"

print("Triggering Step 0: Baseline Report via Kimi K3...")

prompt = """
You are acting as an expert Senior DevOps and Fullstack Engineer.
Please evaluate the current repository structure and create a production-readiness baseline report.

Repository: Emmanuel-Bain-Oduwo/Family_Pledge_Gaza_Project

Do not modify code. Check the current state of:
- backend
- frontend/admin
- frontend/mobile
- deployment config
- environment variable expectations
- migrations
- auth
- CORS
- Vercel configs
- Railway startup

Produce a markdown report answering:
1. current backend health/readiness endpoints;
2. current frontend/admin build scripts;
3. current frontend/mobile build scripts;
4. current migrations;
5. current production environment variables required;
6. current known technical risks;
7. exact commands that currently pass;
8. exact commands that currently fail and why.

Do not open a PR. Do not change files. Only produce a report.
"""

r = httpx.post(
    f"{base_url}/chat/completions",
    headers={"Authorization": f"Bearer {api_key}"},
    json={
        "model": "moonshotai/kimi-k3-free",
        "messages": [{"role": "user", "content": prompt}],
    },
    timeout=180
)

if r.status_code == 200:
    content = r.json().get('choices', [{}])[0].get('message', {}).get('content', '')
    with open('docs/BASELINE_REPORT_KIMI.md', 'w') as f:
        f.write(content)
    print("SUCCESS: Baseline report generated and saved to docs/BASELINE_REPORT_KIMI.md")
else:
    print(f"FAILED (HTTP {r.status_code}): {r.text}")
