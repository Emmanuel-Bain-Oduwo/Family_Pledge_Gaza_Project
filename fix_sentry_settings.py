import os
import subprocess
from pathlib import Path

print("Fixing Sentry DSN configuration bug...")

settings_file = Path('backend/app/core/config.py')
if not settings_file.exists():
    settings_file = Path('backend/app/core/settings.py')

if settings_file.exists():
    content = settings_file.read_text(encoding='utf-8')
    if 'SENTRY_DSN' not in content:
        # We need to safely inject it into the class.
        # A simple string replace looking for standard fields.
        content = content.replace(
            'API_V1_STR: str = "/api/v1"', 
            'API_V1_STR: str = "/api/v1"\n    SENTRY_DSN: str | None = None'
        )
        settings_file.write_text(content, encoding='utf-8')
        
        subprocess.run(['git', 'add', str(settings_file)])
        subprocess.run(['git', 'commit', '-m', 'Fix: Add SENTRY_DSN to pydantic settings to prevent AttributeError on boot'])
        subprocess.run(['git', 'push', 'origin', 'main'])
        print("Settings file patched and pushed.")
    else:
        print("SENTRY_DSN already exists in settings.")
else:
    print("Settings file not found.")
