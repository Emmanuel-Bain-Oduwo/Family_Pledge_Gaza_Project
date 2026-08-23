import pytest
from fastapi import HTTPException

from app.services.payments.mpesa_service import parse_stk_callback
from app.services.payments.payment_service import normalize_ke_phone


def test_normalize_ke_phone_accepts_common_formats():
    assert normalize_ke_phone("0728 123 456") == "254728123456"
    assert normalize_ke_phone("+254728123456") == "254728123456"
    assert normalize_ke_phone("728123456") == "254728123456"


def test_normalize_ke_phone_rejects_invalid_number():
    with pytest.raises(HTTPException):
        normalize_ke_phone("12345")


def test_parse_successful_stk_callback_metadata():
    parsed = parse_stk_callback(
        {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "merchant-1",
                    "CheckoutRequestID": "checkout-1",
                    "ResultCode": 0,
                    "ResultDesc": "Success",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 100},
                            {"Name": "MpesaReceiptNumber", "Value": "TEST123"},
                            {"Name": "PhoneNumber", "Value": 254728123456},
                        ]
                    },
                }
            }
        }
    )
    assert parsed["result_code"] == "0"
    assert parsed["checkout_request_id"] == "checkout-1"
    assert parsed["amount"] == 100
    assert parsed["mpesa_receipt_number"] == "TEST123"
