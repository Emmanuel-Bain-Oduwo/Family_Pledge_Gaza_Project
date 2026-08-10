from app.services import ai_flexible_chat_service


def test_greeting_is_allowed_without_forcing_database_context(monkeypatch):
    captured = {}

    def fake_call_ai(**kwargs):
        captured.update(kwargs)
        return "Wa alaikum assalam. How can I help you today?"

    monkeypatch.setattr(ai_flexible_chat_service, "call_ai", fake_call_ai)

    result = ai_flexible_chat_service.answer_admin_question(object(), "Assalamu alaikum")

    assert result["answer"].startswith("Wa alaikum assalam")
    assert result["context_used"] == []
    assert result["scope"] == "family_pledge_admin_flexible"
    assert "greeting" in captured["system_prompt"].lower()


def test_benign_general_help_is_allowed_without_scope_keyword(monkeypatch):
    def fake_call_ai(**kwargs):
        assert "Explain Docker volumes" in kwargs["user_prompt"]
        return "Docker volumes persist container data outside the container lifecycle."

    monkeypatch.setattr(ai_flexible_chat_service, "call_ai", fake_call_ai)

    result = ai_flexible_chat_service.answer_admin_question(object(), "Explain Docker volumes simply")

    assert result["context_used"] == []
    assert "Docker volumes" in result["answer"]


def test_family_pledge_question_uses_sanitized_context(monkeypatch):
    expected = [{"name": "platform_summary", "description": "safe aggregate", "data": {"active_donors": 12}}]

    monkeypatch.setattr(ai_flexible_chat_service.ai_workspace_service, "select_context", lambda db, message: expected)
    monkeypatch.setattr(ai_flexible_chat_service, "call_ai", lambda **kwargs: "There are 12 active donors in the supplied context.")

    result = ai_flexible_chat_service.answer_admin_question(object(), "Summarize the Family Pledge dashboard")

    assert result["context_used"] == expected
    assert result["actions_executed"] == []
