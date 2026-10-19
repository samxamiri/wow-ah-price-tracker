-- Database schema for the Auction House tracker.
-- The API runs this file on startup. Every statement is idempotent
-- ("IF NOT EXISTS"), so running it again is always safe.

-- One row per WoW item we have ever seen on the Auction House.
CREATE TABLE IF NOT EXISTS items (
    id                  INTEGER PRIMARY KEY,          -- Blizzard's item ID
    name                TEXT        NOT NULL,
    quality             TEXT,                         -- e.g. COMMON, RARE, EPIC
    icon_url            TEXT,
    metadata_updated_at TIMESTAMPTZ                   -- NULL = name/icon not fetched yet
);

-- One row per item per hourly snapshot. Prices are stored in copper
-- (1 gold = 100 silver = 10,000 copper), the same unit Blizzard uses.
CREATE TABLE IF NOT EXISTS price_snapshots (
    item_id        INTEGER     NOT NULL REFERENCES items (id),
    snapshot_time  TIMESTAMPTZ NOT NULL,
    min_price      BIGINT      NOT NULL,   -- cheapest listing
    avg_price      BIGINT      NOT NULL,   -- quantity-weighted average
    total_quantity INTEGER     NOT NULL,   -- units listed across all auctions
    PRIMARY KEY (item_id, snapshot_time)
);

-- The primary key already indexes (item_id, snapshot_time), which covers
-- "history for one item". This index covers "everything at time X".
CREATE INDEX IF NOT EXISTS idx_price_snapshots_time
    ON price_snapshots (snapshot_time);

