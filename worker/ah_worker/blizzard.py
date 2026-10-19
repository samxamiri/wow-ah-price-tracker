"""Small client for the Blizzard Battle.net REST API.

Docs: https://develop.battle.net/documentation/world-of-warcraft
Auth uses the OAuth "client credentials" flow: trade your client ID and
secret for a short-lived access token, then send it as a Bearer header.
"""

from dataclasses import dataclass

import requests

TOKEN_URL = "https://oauth.battle.net/token"


@dataclass(frozen=True)
class ItemInfo:
    id: int
    name: str
    quality: str | None
    icon_url: str | None


class BlizzardClient:
    def __init__(self, client_id: str, client_secret: str, region: str = "us",
                 session: requests.Session | None = None):
        if not client_id or not client_secret:
            raise ValueError(
                "BLIZZARD_CLIENT_ID and BLIZZARD_CLIENT_SECRET are required "
                "when MOCK_DATA=false"
            )
        self._client_id = client_id
        self._client_secret = client_secret
        self._region = region
        self._session = session or requests.Session()
        self._token: str | None = None

    def _access_token(self) -> str:
        if self._token is None:
            resp = self._session.post(
                TOKEN_URL,
                auth=(self._client_id, self._client_secret),
                data={"grant_type": "client_credentials"},
                timeout=30,
            )
            resp.raise_for_status()
            self._token = resp.json()["access_token"]
        return self._token

    def _get(self, path: str, namespace: str) -> dict:
        resp = self._session.get(
            f"https://{self._region}.api.blizzard.com{path}",
            params={"namespace": f"{namespace}-{self._region}", "locale": "en_US"},
            headers={"Authorization": f"Bearer {self._access_token()}"},
            timeout=120,  # the commodities payload is large
        )
        resp.raise_for_status()
        return resp.json()

    def get_commodities(self) -> list[dict]:
        """Every commodity listing in the region. Blizzard refreshes this hourly."""
        return self._get("/data/wow/auctions/commodities", "dynamic")["auctions"]

    def get_item(self, item_id: int) -> ItemInfo:
        item = self._get(f"/data/wow/item/{item_id}", "static")
        media = self._get(f"/data/wow/media/item/{item_id}", "static")
        icon = next(
            (a["value"] for a in media.get("assets", []) if a.get("key") == "icon"),
            None,
        )
        return ItemInfo(
            id=item_id,
            name=item["name"],
            quality=item.get("quality", {}).get("type"),
            icon_url=icon,
        )
