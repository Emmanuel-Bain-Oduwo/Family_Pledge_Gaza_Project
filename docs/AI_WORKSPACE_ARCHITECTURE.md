# Family Pledge Admin AI Workspace

## Purpose

The Family Pledge AI workspace is an internal admin assistant. It uses the existing OpenAI-compatible AI provider configuration (currently intended for the OVH GPT-OSS-120B endpoint) to help admins draft content, understand aggregate platform information, and prepare recurring internal work.

The AI is **not** an autonomous operator.

## Scope

Allowed scope:

- Family Pledge and NAMLEF operations.
- Gaza/Palestine humanitarian donation and relief work.
- Campaign, pledge, contribution, collector and admin operating summaries.
- Relevant Islamic charity/reminder context.
- Facts supplied through approved read-only backend tools.

Out-of-scope general-assistant requests are rejected by the backend before calling the provider.

## Database access model

```text
Admin question
      |
      v
Family Pledge backend scope gate
      |
      v
Approved read-only context selectors
      |
      +-- platform_summary
      +-- contribution_summary
      +-- active_campaigns
      +-- approved_religious_reminders
      |
      v
Sanitized JSON context
      |
      v
OVH/OpenAI-compatible model
      |
      v
Admin answer
```

The model does not receive PostgreSQL credentials, an unrestricted SQL tool, raw payment screenshots, transaction references, donor phone/email/password/token data, or a general database dump.

Current contribution context is aggregate only: status counts and confirmed totals grouped by currency for the current month.

## Religious-content guardrails

The AI must not invent Quran verses, hadith wording, Arabic text, translations, citations, or religious rulings. For exact religious wording/source references, the backend may provide only admin-approved/published reminder content already stored in Family Pledge. When verified source material is not available, the AI should tell the admin that the exact source requires human verification.

## Editable drafts

Generated `AiDraft` records remain status `draft` until reviewed.

Admins can:

1. Generate a draft.
2. Edit the generated text manually.
3. Save changes.
4. Approve only after the saved text is correct.
5. Reject instead.
6. Mark approved content published/ready to use.

Approval is blocked in the UI while edits are unsaved. Draft edits are audited.

## Chat

`POST /api/v1/admin/ai/chat` is admin-only. The chat interface shows which read-only context blocks were used for each answer. Chat has no write tools and cannot send notifications, publish content, approve/reject contributions, delete accounts, or alter campaigns.

## Scheduled tasks

Task schedules currently support:

- Manual / Run Now
- Daily
- Weekly

A background worker checks due tasks. Every run:

1. Validates Family Pledge AI scope.
2. Verifies `requires_approval=true`.
3. Obtains only approved read-only context.
4. Calls the configured AI provider.
5. Stores generated output in `AiTaskRun`.
6. Sets the successful result to `waiting_approval`.
7. Executes **zero external actions**.

Admins can Run Now, Pause, Resume, Cancel, view history, and Retry failed runs.

OVH configuration:

```text
AI_TASKS_WORKER_ENABLED=true
AI_TASKS_WORKER_INTERVAL_SECONDS=60
```

## Provider failure behavior

Provider failures are visible. The new workspace/task/content path does not silently replace a failed GPT-OSS response with canned text that looks like successful AI generation.

## Human authority retained

AI never receives permission to:

- send a push notification or email;
- confirm/reject a contribution;
- approve or publish its own draft;
- delete or edit a donor;
- change campaign totals/status;
- upload/delete media;
- alter accounting records.

Any future write-capable admin tool must be designed as a separate explicit human-approved workflow rather than added to the chat context layer.

## Deployment verification

After deployment, confirm the existing OVH AI settings without printing the API key:

```bash
cd ~/Family_Pledge_Gaza_Project/deploy/ovh

docker compose exec -T backend python - <<'PY'
from app.core.config import settings
print('AI key loaded:', bool(settings.OPENAI_API_KEY))
print('AI base URL:', settings.OPENAI_BASE_URL)
print('AI model:', settings.OPENAI_MODEL)
PY
```

Then test the admin chat and a manual task run. A successful manual task should create a run in `waiting_approval`, never a sent/published action.
