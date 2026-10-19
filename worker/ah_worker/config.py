"""Reads settings from environment variables (12-factor style).

Docker Compose and Kubernetes both inject these, so the code never
hard-codes passwords or API keys.
"""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    database_url: str
    mock_data: bool
    blizzard_client_id: str
    blizzard_client_secret: str
    region: str
    metadata_batch_size: int


def load_config() -> Config:
    return Config(
        database_url=os.environ.get(
            "DATABASE_URL", "postgresql://wow:wow@localhost:5432/wow_ah"
        ),
        # Mock mode generates fake listings so the project runs without Blizzard API keys.
        mock_data=os.environ.get("MOCK_DATA", "true").lower() == "true",
        blizzard_client_id=os.environ.get("BLIZZARD_CLIENT_ID", ""),
        blizzard_client_secret=os.environ.get("BLIZZARD_CLIENT_SECRET", ""),
        region=os.environ.get("BLIZZARD_REGION", "us"),
        # How many new items get their name/icon looked up per run.
        metadata_batch_size=int(os.environ.get("METADATA_BATCH_SIZE", "100")),
    )
