"""Fake Auction House data for running the project without Blizzard API keys.

Listings come back in the same shape as Blizzard's commodities endpoint, so
they go through exactly the same transform and database code as real data.

Prices follow a weekly wave (cheap after the Tuesday reset, pricier on
weekends), a smaller daily wave, and random noise, so the charts look like a
real market.
"""

import math
import random
from datetime import datetime

from .blizzard import ItemInfo

# (item_id, name, quality, base price in copper). IDs are sample values for mock mode.
MOCK_ITEMS: list[tuple[int, str, str, int]] = [
    (210930, "Bismuth", "COMMON", 18_000),
    (210933, "Aqirite", "COMMON", 22_000),
    (210936, "Ironclaw Ore", "COMMON", 45_000),
    (210796, "Mycobloom", "COMMON", 15_000),
    (210799, "Luredrop", "COMMON", 25_000),
    (210802, "Orbinid", "COMMON", 30_000),
    (210805, "Blessing Blossom", "COMMON", 40_000),
    (210808, "Arathor's Spear", "COMMON", 55_000),
    (224828, "Weavercloth", "COMMON", 9_000),
    (219946, "Storm Dust", "COMMON", 12_000),
    (212265, "Algari Healing Potion", "COMMON", 70_000),
    (212283, "Flask of Alchemical Chaos", "RARE", 1_850_000),
    (222731, "Crystalline Powder", "UNCOMMON", 160_000),
    (213610, "Mote of Pure Shadow", "UNCOMMON", 95_000),
]


def mock_item_infos() -> list[ItemInfo]:
    return [ItemInfo(id=i, name=n, quality=q, icon_url=None) for i, n, q, _ in MOCK_ITEMS]


def _market_price(base: int, item_id: int, when: datetime) -> float:
    hours = when.timestamp() / 3600
    phase = (item_id % 97) / 97 * 2 * math.pi  # each item peaks at a different time
    weekly = 0.15 * math.sin(2 * math.pi * hours / 168 + phase)
    daily = 0.04 * math.sin(2 * math.pi * hours / 24 + phase)
    return base * (1 + weekly + daily)


def generate_auctions(when: datetime, seed: int | None = None) -> list[dict]:
    """Make 5–15 fake listings per mock item for the given hour."""
    rng = random.Random(seed if seed is not None else int(when.timestamp()))
    auctions: list[dict] = []
    next_id = 1
    for item_id, _name, _quality, base in MOCK_ITEMS:
        floor = _market_price(base, item_id, when) * rng.uniform(0.96, 1.04)
        for _ in range(rng.randint(5, 15)):
            auctions.append({
                "id": next_id,
                "item": {"id": item_id},
                "quantity": rng.randint(1, 200),
                # Each listing is at or above the market floor, like a real AH.
                "unit_price": int(floor * rng.uniform(1.0, 1.25)),
                "time_left": "LONG",
            })
            next_id += 1
    return auctions
