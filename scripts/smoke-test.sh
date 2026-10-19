#!/usr/bin/env bash
# Calls every API endpoint and fails if any response looks wrong.
# Used by CI after starting the API and loading mock data.
# Usage: scripts/smoke-test.sh [base_url]
set -euo pipefail

BASE="${1:-http://localhost:3000}"

check() {
  local path="$1" expected="$2"
  local body
  body="$(curl -sf "$BASE$path")"
  if [[ "$body" != *"$expected"* ]]; then
    echo "FAIL $path: expected to contain '$expected'"
    echo "     got: ${body:0:300}"
    exit 1
  fi
  echo "ok   $path"
}

check "/health"                          '"status":"ok"'
check "/api/items?search=ore"            '"name":"Ironclaw Ore"'
check "/api/items/210936"                '"signal"'
check "/api/items/210936/prices?range=30d" '"movingAvg24h"'
check "/api/movers"                      '"gainers"'

echo "All smoke tests passed."
