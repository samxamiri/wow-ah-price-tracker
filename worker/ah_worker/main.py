"""Entry point: take one snapshot of the Auction House and save it.

Usage:
    python -m ah_worker.main                    # one snapshot for the current hour
    python -m ah_worker.main --backfill-days 30 # mock mode only: fill 30 days of history

In mock mode, the first run against an empty database backfills 30 days
automatically so the charts have something to show right away.

In Kubernetes this runs as an hourly CronJob.
"""

import argparse
import logging
from datetime import datetime, timedelta, timezone

import requests

from . import db
from .blizzard import BlizzardClient
from .config import Config, load_config
from .mock import generate_auctions, mock_item_infos
from .transform import summarize_auctions

log = logging.getLogger("ah_worker")


def current_hour() -> datetime:
    return datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)


def run_mock(conn, hours: list[datetime]) -> None:
    for info in mock_item_infos():
        db.upsert_item_info(conn, info, fetched=False)
    for when in hours:
        db.insert_snapshots(conn, summarize_auctions(generate_auctions(when), when))
    log.info("mock: wrote %d hourly snapshot(s)", len(hours))


def run_blizzard(conn, config: Config) -> None:
    client = BlizzardClient(
        config.blizzard_client_id, config.blizzard_client_secret, config.region
    )
    when = current_hour()

    auctions = client.get_commodities()
    snapshots = summarize_auctions(auctions, when)
    log.info("blizzard: %d listings -> %d items", len(auctions), len(snapshots))

    db.ensure_items_exist(conn, [s.item_id for s in snapshots])
    db.insert_snapshots(conn, snapshots)
    conn.commit()  # save prices before the slower metadata step

    # Look up names/icons for a limited number of new items per run so we
    # stay well under Blizzard's rate limit. The rest get filled in later runs.
    missing = db.items_missing_metadata(conn, config.metadata_batch_size)
    for item_id in missing:
        try:
            db.upsert_item_info(conn, client.get_item(item_id))
        except requests.HTTPError as err:
            log.warning("could not fetch item %s: %s", item_id, err)
    log.info("blizzard: fetched metadata for %d item(s)", len(missing))


def main(argv: list[str] | None = None) -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="Snapshot WoW Auction House prices")
    parser.add_argument("--backfill-days", type=int, default=0,
                        help="mock mode only: generate this many days of history")
    args = parser.parse_args(argv)
    config = load_config()

    with db.connect(config.database_url) as conn:
        if config.mock_data:
            days = args.backfill_days or (0 if db.has_snapshots(conn) else 30)
            now = current_hour()
            hours = [now - timedelta(hours=h) for h in range(days * 24, -1, -1)]
            run_mock(conn, hours)
        else:
            if args.backfill_days:
                parser.error("--backfill-days only works with MOCK_DATA=true "
                             "(Blizzard's API has no price history)")
            run_blizzard(conn, config)
        # Leaving the `with` block commits the transaction.


if __name__ == "__main__":
    main()
