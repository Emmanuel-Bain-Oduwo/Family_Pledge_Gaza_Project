from app.services import notification_service


class _Response:
    def raise_for_status(self):
        return None

    def json(self):
        return {"data": [{"status": "ok"}]}


class _Client:
    last_payload = None

    def __init__(self, **_kwargs):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return None

    def post(self, _url, json, headers):
        self.__class__.last_payload = json
        return _Response()


def test_background_push_has_sound_priority_channel_and_deep_link(monkeypatch):
    monkeypatch.setattr(notification_service.httpx, "Client", _Client)
    sent, failed = notification_service._send_expo_push(
        ["ExpoPushToken[test]"], "Urgent update", "Please open the app", "emergency"
    )
    assert (sent, failed) == (1, 0)
    message = _Client.last_payload[0]
    assert message["sound"] == "default"
    assert message["priority"] == "high"
    assert message["channelId"] == "emergency"
    assert message["data"]["screen"] == "/screens/notifications"
