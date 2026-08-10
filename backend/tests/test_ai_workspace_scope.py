from types import SimpleNamespace

from app.models.enums import AiTaskStatus
from app.services.ai_task_service import validate_task
from app.services.ai_workspace_service import is_in_scope


def test_family_pledge_operational_questions_are_in_scope():
    assert is_in_scope("Summarize Family Pledge pending contributions this month")
    assert is_in_scope("Show active Gaza campaign progress and donation totals")
    assert is_in_scope("Prepare an Islamic sadaqah reminder for the Gaza campaign")


def test_unrelated_general_assistant_questions_are_out_of_scope():
    assert not is_in_scope("Write me a Python video game about racing cars")
    assert not is_in_scope("Recommend the best gaming laptop for school")
    assert not is_in_scope("Explain how to train a computer vision model")
    assert not is_in_scope("Write a weekly report about cryptocurrency prices")
    assert not is_in_scope("Create an admin task to summarize Mars exploration")


def test_task_requires_human_approval_even_when_scope_is_valid():
    task = SimpleNamespace(
        instruction="Summarize Family Pledge contribution status for admin review",
        requires_approval=False,
        status=AiTaskStatus.active,
    )
    result = validate_task(task)
    assert result["scope_ok"] is True
    assert result["requires_approval"] is False
    assert result["valid"] is False


def test_cancelled_task_cannot_run():
    task = SimpleNamespace(
        instruction="Summarize active Gaza campaigns for admin review",
        requires_approval=True,
        status=AiTaskStatus.cancelled,
    )
    result = validate_task(task)
    assert result["scope_ok"] is True
    assert result["status_allows_run"] is False
    assert result["valid"] is False


def test_valid_task_is_review_only():
    task = SimpleNamespace(
        instruction="Summarize Family Pledge pending contributions for admin review",
        requires_approval=True,
        status=AiTaskStatus.active,
    )
    result = validate_task(task)
    assert result["valid"] is True
    assert result["phase"] == "generate_reviewable_output_only"
