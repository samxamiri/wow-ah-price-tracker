from datetime import datetime, timezone

from ah_worker.transform import summarize_auctions

WHEN = datetime(2026, 1, 6, 12, tzinfo=timezone.utc)


def listing(item_id, unit_price, quantity):
    return {"item": {"id": item_id}, "unit_price": unit_price, "quantity": quantity}


def test_computes_min_weighted_avg_and_quantity():
    auctions = [
        listing(1, 100, 10),  # 1,000 copper total
        listing(1, 200, 30),  # 6,000 copper total
        listing(2, 50, 5),
    ]
    snaps = {s.item_id: s for s in summarize_auctions(auctions, WHEN)}

    assert snaps[1].min_price == 100
    assert snaps[1].avg_price == 175  # 7,000 / 40, not the plain average of 150
    assert snaps[1].total_quantity == 40
    assert snaps[2].min_price == 50
    assert snaps[2].snapshot_time == WHEN


def test_skips_listings_without_price_or_quantity():
    auctions = [
        {"item": {"id": 1}, "quantity": 5},  # no unit_price
        listing(1, 300, 0),
        listing(1, 400, 2),
    ]
    [snap] = summarize_auctions(auctions, WHEN)
    assert snap.min_price == 400
    assert snap.total_quantity == 2


def test_empty_input():
    assert summarize_auctions([], WHEN) == []
