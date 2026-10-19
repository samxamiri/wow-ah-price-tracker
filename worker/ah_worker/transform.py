"""Turns raw auction listings into one price summary per item.

This module has no network or database code, which makes it easy to unit test.
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Snapshot:
    item_id: int
    snapshot_time: datetime
    min_price: int  # copper
    avg_price: int  # copper, weighted by quantity
    total_quantity: int


def summarize_auctions(auctions: list[dict], snapshot_time: datetime) -> list[Snapshot]:
    """Group listings by item and compute min price, weighted average and quantity.

    Each listing looks like Blizzard's commodities response:
        {"id": 1, "item": {"id": 190396}, "quantity": 20, "unit_price": 1500, ...}
    """
    min_price: dict[int, int] = {}
    total_cost: dict[int, int] = {}
    total_qty: dict[int, int] = {}

    for auction in auctions:
        price = auction.get("unit_price")
        qty = auction.get("quantity", 0)
        if price is None or qty <= 0:
            continue  # skip malformed listings

        item_id = auction["item"]["id"]
        min_price[item_id] = min(price, min_price.get(item_id, price))
        total_cost[item_id] = total_cost.get(item_id, 0) + price * qty
        total_qty[item_id] = total_qty.get(item_id, 0) + qty

    return [
        Snapshot(
            item_id=item_id,
            snapshot_time=snapshot_time,
            min_price=min_price[item_id],
            avg_price=round(total_cost[item_id] / total_qty[item_id]),
            total_quantity=total_qty[item_id],
        )
        for item_id in sorted(min_price)
    ]
