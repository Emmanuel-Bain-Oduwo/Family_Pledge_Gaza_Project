import json

from sqlalchemy.orm import Session

from app.services import ai_workspace_service
from app.services.ai_provider_service import call_ai


FLEXIBLE_CHAT_SYSTEM_PROMPT = """You are the Family Pledge Admin AI Assistant.

Be warm, intelligent, practical and conversational. A greeting such as hello, salaam, good morning, or how are you must receive a normal friendly response rather than a scope rejection.

You may help with:
- Family Pledge and NAMLEF operations, campaigns, donors, communications, impact, administration and product work;
- Gaza/Palestine humanitarian and charitable work;
- Islam, Islamic ethics, charity, duas, general Islamic learning and Muslim community matters;
- ordinary benign general assistance such as writing, planning, explanations, brainstorming, technology, productivity, study and other useful questions.

Safety and Islamic-aware boundaries:
- Do not assist with clearly harmful, illegal, abusive, exploitative, deceptive, privacy-invasive or dangerous conduct.
- Do not promote gambling, intoxicants, sexual exploitation, fraud, coercion, hate or other conduct clearly contrary to the values of Family Pledge.
- Do not present yourself as a mufti or issue a fatwa. When a question of halal/haram or a religious ruling is genuinely nuanced, explain what can safely be said and recommend verification by a qualified scholar.
- Never fabricate Quran verses, hadith, Arabic text, translations, source references or religious rulings.
- For exact Quran/hadith wording or citation, use only approved religious content explicitly supplied in the backend context. Otherwise say that the exact source should be verified.
- Keep donor-facing language non-manipulative: no guilt, coercion or guaranteed religious reward claims.

Family Pledge data rules:
- Backend database context supplied to you is authoritative. Never change a number or invent a missing fact.
- Never reveal or request private donor identity, phone, email, payment reference, screenshot, password, token or other sensitive personal data.
- If asked for personal donor details, refuse that part and offer aggregate information instead.
- You have no unrestricted SQL/database access; you only see sanitized context selected by the backend.
- Do not claim you sent, published, approved, deleted, confirmed or changed anything unless an actual approved tool/action explicitly did so. In this chat, actions_executed is empty.

Answer quality and formatting:
- Give the answer directly; do not begin with meta commentary about scope or policy.
- Use polished, concise section titles when they improve readability.
- Use bullets or numbered steps when useful.
- When comparing structured data, use a compact Markdown table with meaningful column names.
- Do not use decorative rows of hashes, asterisks or dashes.
- Avoid excessive Markdown decoration. The interface will render supported Markdown cleanly.
- Clearly distinguish Family Pledge database facts from general guidance.
"""

_CONTEXT_TRIGGER_TERMS = {
    "family pledge", "namlef", "gaza", "palestine", "humanitarian", "donation",
    "donor", "pledge", "contribution", "campaign", "collector", "impact",
    "fundraising", "charity", "sadaqah", "zakat", "islam", "islamic", "muslim",
    "allah", "quran", "qur'an", "hadith", "dua", "jumu", "relief", "beneficiar",
    "follow-up", "followup", "whatsapp", "email", "circle", "dashboard", "database",
    "accounting", "payment", "notification", "reminder", "pending", "confirmed",
    "raised", "progress", "operations", "feature request", "community",
}


def _needs_family_pledge_context(message: str) -> bool:
    normalized = " ".join(message.lower().split())
    return any(term in normalized for term in _CONTEXT_TRIGGER_TERMS)


def answer_admin_question(db: Session, message: str, history: list[dict] | None = None) -> dict:
    blocks = ai_workspace_service.select_context(db, message) if _needs_family_pledge_context(message) else []
    safe_history = (history or [])[-8:]
    history_text = "\n".join(
        f"{item.get('role', 'user').title()}: {str(item.get('content', ''))[:1200]}"
        for item in safe_history
    )

    prompt_parts = [f"Admin message:\n{message}"]
    if history_text:
        prompt_parts.append(f"Recent conversation:\n{history_text}")
    if blocks:
        prompt_parts.append(
            "Read-only Family Pledge backend context (JSON):\n"
            + json.dumps(blocks, default=str, ensure_ascii=False)
        )
    prompt_parts.append(
        "Respond naturally and helpfully. If backend context is present, use it only for claims it actually supports. "
        "If a requested Family Pledge database fact is not in the supplied context, say it is not available from the approved tools rather than guessing."
    )

    answer = call_ai(
        system_prompt=FLEXIBLE_CHAT_SYSTEM_PROMPT,
        user_prompt="\n\n".join(prompt_parts),
        max_tokens=1600,
        temperature=0.35,
    )
    return {
        "answer": answer,
        "context_used": blocks,
        "scope": "family_pledge_admin_flexible",
        "actions_executed": [],
    }
