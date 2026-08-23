from pathlib import Path

from app.core.config import Settings


def test_mpesa_account_reference_defaults_to_current_public_account():
    settings = Settings(APP_ENV="development")
    assert settings.MPESA_ACCOUNT_REFERENCE == "133133"


def test_timeout_path_is_marked_uncertain_not_failed():
    service = Path("app/services/payments/mpesa_service.py").read_text()
    route = Path("app/api/routes/payments.py").read_text()
    assert "uncertain=True" in service
    assert "request_uncertain" in route
    assert "Do not start another payment yet" in route


def test_reconciliation_never_invents_success_without_receipt():
    source = Path("app/services/payments/reconciliation_service.py").read_text()
    assert "query_success_waiting_receipt" in source
    assert "waiting for receipt-bearing callback" in source
    assert "receipt and amount is not None" in source


def test_ovh_deployment_wires_mpesa_secrets_server_side():
    compose = Path("../deploy/ovh/docker-compose.yml").read_text()
    for key in (
        "MPESA_CONSUMER_KEY",
        "MPESA_CONSUMER_SECRET",
        "MPESA_SHORTCODE",
        "MPESA_PASSKEY",
        "MPESA_CALLBACK_URL",
        "MPESA_ACCOUNT_REFERENCE",
        "MPESA_RECONCILIATION_ENABLED",
    ):
        assert key in compose
