from datetime import datetime, timezone

from ah_worker.mock import MOCK_ITEMS, generate_auctions
from ah_worker.transform import summarize_auctions

WHEN = datetime(2026, 1, 6, 12, tzinfo=timezone.utc)


def test_every_mock_item_gets_listings():
    snaps = summarize_auctions(generate_auctions(WHEN), WHEN)
    assert {s.item_id for s in snaps} == {item[0] for item in MOCK_ITEMS}
    assert all(s.min_price > 0 and s.total_quantity > 0 for s in snaps)


def test_same_hour_gives_same_data():
    assert generate_auctions(WHEN) == generate_auctions(WHEN)
