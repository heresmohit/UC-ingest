#!/usr/bin/env bash
#
# Freshness check / dead-man's-switch for the daily local publish.
#
# The daily launchd job (publish-local.sh) is skipped silently if the Mac is
# asleep or off at 21:15 — no error, no notification. This checks how long ago
# that job last ran *successfully* and alerts if it's overdue, so a string of
# missed days can't go unnoticed.
#
# It watches publish-local.sh's heartbeat (.last-run), NOT the published release.
# The release only changes when events change; the job can run fine for days
# without publishing during a quiet period, so release age is the wrong signal.
#
# Run at login + periodically via launchd; see
# ops/launchd/com.uc-ingest.freshness.plist.

set -euo pipefail

# Alert if the job hasn't completed in this long. It runs daily, so anything
# past ~26h (a day plus slack) means at least one run was missed.
MAX_AGE_HOURS=26
HEARTBEAT_FILE=".last-run"

# Run from the repo root so the heartbeat path resolves (launchd cwd is /).
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

notify() {
  osascript -e "display notification \"$1\" with title \"UC-ingest publish overdue\"" 2>/dev/null || true
}

if [[ ! -f "$HEARTBEAT_FILE" ]]; then
  notify "No successful run recorded yet. Has the daily job run? Try: bash ops/publish-local.sh"
  echo "[$(date '+%F %T %Z')] freshness: no heartbeat ($HEARTBEAT_FILE missing)" >&2
  exit 0
fi

last_epoch="$(cat "$HEARTBEAT_FILE")"
now_epoch="$(date -u +%s)"
age_hours=$(( (now_epoch - last_epoch) / 3600 ))

if (( age_hours >= MAX_AGE_HOURS )); then
  notify "Last successful run was ${age_hours}h ago (expected daily). The Mac may have missed a run — open it / run ops/publish-local.sh."
  echo "[$(date '+%F %T %Z')] freshness: OVERDUE — ${age_hours}h since last successful run" >&2
else
  echo "[$(date '+%F %T %Z')] freshness: ok — ${age_hours}h since last successful run"
fi
