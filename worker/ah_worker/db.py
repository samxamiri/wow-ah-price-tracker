"""All SQL the worker runs. The tables themselves are created by the API (api/sql/schema.sql)."""

import psycopg

from .blizzard import ItemInfo
from .transform import Snapshot


def connect(database_url: str) -> psycopg.Connection:
    return psycopg.connect(database_url)


def ensure_items_exist(conn: psycopg.Connection, item_ids: list[int]) -> None:
    """Insert a placeholder row for any item we haven't seen before.

    price_snapshots has a foreign key to items, so the item row must exist
    first. The real name and icon are filled in later by upsert_item_info.
    """
    with conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO items (id, name) VALUES (%s, %s) ON CONFLICT (id) DO NOTHING",
            [(item_id, f"Item #{item_id}") for item_id in item_ids],
        )


def upsert_item_info(conn: psycopg.Connection, info: ItemInfo, fetched: bool = True) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO items (id, name, quality, icon_url, metadata_updated_at)
            VALUES (%s, %s, %s, %s, CASE WHEN %s THEN now() END)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                quality = EXCLUDED.quality,
                icon_url = EXCLUDED.icon_url,
                metadata_updated_at = EXCLUDED.metadata_updated_at
            """,
            (info.id, info.name, info.quality, info.icon_url, fetched),
        )


def items_missing_metadata(conn: psycopg.Connection, limit: int) -> list[int]:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM items WHERE metadata_updated_at IS NULL ORDER BY id LIMIT %s",
            (limit,),
        )
        return [row[0] for row in cur.fetchall()]


def has_snapshots(conn: psycopg.Connection) -> bool:
    with conn.cursor() as cur:
        cur.execute("SELECT EXISTS (SELECT 1 FROM price_snapshots)")
        return cur.fetchone()[0]


def insert_snapshots(conn: psycopg.Connection, snapshots: list[Snapshot]) -> None:
    """Insert snapshots. Re-running for the same hour overwrites instead of duplicating."""
    with conn.cursor() as cur:
        cur.executemany(
            """
            INSERT INTO price_snapshots
                (item_id, snapshot_time, min_price, avg_price, total_quantity)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (item_id, snapshot_time) DO UPDATE SET
                min_price = EXCLUDED.min_price,
                avg_price = EXCLUDED.avg_price,
                total_quantity = EXCLUDED.total_quantity
            """,
            [
                (s.item_id, s.snapshot_time, s.min_price, s.avg_price, s.total_quantity)
                for s in snapshots
            ],
        )
