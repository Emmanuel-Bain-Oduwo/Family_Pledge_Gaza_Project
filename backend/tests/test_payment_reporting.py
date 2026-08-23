from pathlib import Path


def test_admin_dashboard_reports_payments_and_rankings():
    source = Path("app/api/routes/admin.py").read_text()
    assert "paid_donors_this_month" in source
    assert "successful_payments_this_month" in source
    assert "pending_payments" in source
    assert "failed_payments" in source
    assert "mpesa_settled_kes" in source
    assert "top_contributors" in source
    assert "Contribution.status == ContributionStatus.confirmed" in source


def test_collector_pending_uses_payment_transactions():
    source = Path("app/services/collector_service.py").read_text()
    assert "PaymentTransaction" in source
    assert "PaymentStatus.pending" in source
    assert "Contribution.status == ContributionStatus.submitted" not in source
