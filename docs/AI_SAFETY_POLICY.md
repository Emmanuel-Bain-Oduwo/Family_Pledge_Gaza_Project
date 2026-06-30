# AI Safety Policy — Family Pledge for Gaza

## Overview

The Family Pledge app uses OpenAI's GPT-4o-mini to help administrators generate drafts for:
- Islamic reminders (Quran, Hadith, Du'a, Motivation)
- Impact updates (stories of delivered aid)
- Weekly fundraising summaries
- Collector outreach messages

This document defines the safety guardrails applied to all AI-generated content.

---

## Core Principles

### 1. Human Approval Required

**All AI-generated content is a draft. Nothing is published without human review and approval.**

The workflow is:
```
Admin requests draft → AI generates → Status: "draft"
         ↓
Admin reviews content
         ↓
Admin approves → Status: "approved" → Admin publishes → Status: "published"
         OR
Admin rejects → Status: "rejected" → Draft discarded
```

No AI draft can be published directly. The `publish` action requires a prior `approve` action by an authorised admin.

### 2. No Fabricated Facts

All AI prompts include the instruction:

> "Only use the facts provided in this prompt. Do not invent statistics, locations, names, or outcomes. If insufficient information is provided, write general, truthful content."

When generating impact updates, the admin must supply:
- Project title
- Verified facts (e.g., "250 food packages delivered")
- Beneficiary count (if known)
- Location (if known)

The AI must not fabricate these details.

### 3. Factual Accuracy for Islamic Content

For Quran verses and Hadith, the AI is instructed to:
- Only cite references the admin provides in the prompt
- Clearly mark the source (e.g., "Quran 5:32", "Sahih Muslim 2564")
- Include a note if no reference is provided: "(unverified — please check before publishing)"

Admins are responsible for verifying all Islamic references before publishing.

### 4. No Harmful or Divisive Content

AI prompts explicitly prohibit:
- Inflammatory political statements beyond humanitarian context
- Content that targets individuals or ethnic groups
- Exaggeration or emotionally manipulative language
- Fabricated testimonials

### 5. Language and Tone

The AI is guided to:
- Use warm, respectful, Islamic language appropriate for Muslim families
- Avoid jargon or technical terms unfamiliar to the audience
- Support English and other requested languages (Arabic, Swahili)
- Keep content concise and actionable

---

## Technical Guardrails

### JSON Mode

All AI responses use OpenAI's `response_format: json_object` to ensure structured output. The backend validates the response schema before saving.

### Token Limits

- Reminder drafts: max 400 tokens
- Impact updates: max 600 tokens
- Weekly summaries: max 800 tokens
- Collector messages: max 500 tokens

### System Prompt Controls

The backend system prompt cannot be modified by admin users. It is hardcoded in `backend/app/services/ai_service.py`.

### Rate Limiting

AI draft generation is limited to prevent abuse. Admins receive an error if too many drafts are requested in a short period.

---

## Admin Responsibilities

Admins using the AI assistant must:

1. **Review every draft** before approving — read it fully
2. **Verify Islamic references** — check Quran verses and Hadith against a reliable source
3. **Verify impact figures** — ensure numbers match actual field reports
4. **Reject drafts with errors** — use the "Reject" button and note the reason
5. **Never publish unreviewed content** — the system prevents this, but admins must not bypass it

---

## Incident Response

If AI-generated content that contains errors is accidentally published:

1. Admin immediately archives or deletes the content
2. Incident is logged with the draft ID, content, and error description
3. The super admin reviews and determines if a correction notice is needed
4. Prompt templates are updated to prevent recurrence

Contact: [admin@familypledge.org]

---

## Model Information

- **Provider**: OpenAI
- **Model**: GPT-4o-mini (configurable via `OPENAI_MODEL` env var)
- **Data retention**: OpenAI's API usage policy applies; no training on API data by default
- **No sensitive personal data** is sent to OpenAI — donor names, phone numbers, and emails are never included in AI prompts
