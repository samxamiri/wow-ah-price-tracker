import pytest

from ah_worker.blizzard import BlizzardClient


class FakeResponse:
    def __init__(self, data):
        self._data = data

    def raise_for_status(self):
        pass

    def json(self):
        return self._data


class FakeSession:
    """Stands in for requests.Session so tests never hit the real API."""

    def __init__(self, routes):
        self.routes = routes
        self.calls = []

    def post(self, url, **kwargs):
        return FakeResponse({"access_token": "test-token"})

    def get(self, url, **kwargs):
        self.calls.append((url, kwargs))
        path = url.split("api.blizzard.com", 1)[1]
        return FakeResponse(self.routes[path])


def test_get_item_reads_name_quality_and_icon():
    session = FakeSession({
        "/data/wow/item/42": {"name": "Bismuth", "quality": {"type": "COMMON"}},
        "/data/wow/media/item/42": {"assets": [{"key": "icon", "value": "https://x/icon.jpg"}]},
    })
    client = BlizzardClient("id", "secret", "eu", session=session)

    info = client.get_item(42)

    assert (info.name, info.quality, info.icon_url) == ("Bismuth", "COMMON", "https://x/icon.jpg")
    url, kwargs = session.calls[0]
    assert url.startswith("https://eu.api.blizzard.com")
    assert kwargs["params"]["namespace"] == "static-eu"
    assert kwargs["headers"]["Authorization"] == "Bearer test-token"


def test_requires_credentials():
    with pytest.raises(ValueError):
        BlizzardClient("", "")
