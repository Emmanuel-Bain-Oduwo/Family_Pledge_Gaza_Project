from pathlib import Path


def test_manual_contribution_submission_is_retired():
    source = Path("app/api/routes/contributions.py").read_text()
    assert "Manual contribution proof submission has been retired" in source
    assert "status_code=410" in source


def test_provider_contributions_cannot_be_manually_reclassified():
    source = Path("app/api/routes/contributions.py").read_text()
    assert "payment_transaction_id" in source
    assert "Provider-confirmed contributions cannot be manually approved" in source


def test_proof_upload_write_endpoints_are_blocked():
    source = Path("app/main.py").read_text()
    assert "contribution-proof/presigned-upload" in source
    assert "contribution-proof/confirm-upload" in source
    assert "Payment screenshot uploads have been retired" in source
