#!/usr/bin/env bash
#
# Daily local publish for UC-ingest.
#
# District's API geoblocks non-India IPs, so GitHub Actions can't fetch it.
# This script runs the full pipeline from a local (Indian) IP instead:
#   1. build (Discourse + District) -> writes the per-community JSON files
#   2. if the built files differ from what's already published, upload them to
#      the `events-latest` GitHub release (what the site reads)
#   3. and trigger the Cloudflare Pages rebuild
#
# When the build produces data identical to what's live, steps 2-3 are skipped
# so we don't burn a Cloudflare deploy on an unchanged dataset.
#
# Run daily via launchd; see ops/launchd/com.uc-ingest.publish.plist.
# Requires: gh (authenticated), and CF_DEPLOY_HOOK in .env.local.

set -euo pipefail

# Post a macOS notification when a step fails. Without this, a failed launchd
# run is silent — only visible if you happen to read publish.log. STEP is set
# before each step so the alert names what broke.
STEP="startup"
notify_failure() {
  osascript -e "display notification \"Failed at: ${STEP}. See publish.log.\" with title \"UC-ingest publish failed\"" 2>/dev/null || true
  echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] FAILED at: ${STEP}" >&2
}
trap notify_failure ERR

# Resolve repo root from this script's location, so launchd can run it from
# anywhere without a hardcoded cwd.
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# Load local secrets (CF_DEPLOY_HOOK). Not committed.
if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  set -a; source .env.local; set +a
fi

# The release these assets live on, and the files to publish. Keep in sync with
# the enabled communities in communities.json / the CI workflow.
RELEASE_TAG="events-latest"
FILES=(improvlore.json mtg.json)

# Heartbeat: records that a publish run *completed successfully*, whether it
# uploaded new data or skipped because nothing changed. The freshness checker
# watches this (not the release) so a quiet day with no event changes doesn't
# look like a missed/failed run. Local runtime state — gitignored.
HEARTBEAT_FILE=".last-run"
heartbeat() { date -u +%s > "$HEARTBEAT_FILE"; }

echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] Starting local publish"

# 1. Build (this is where District enrichment happens, on the local India IP).
STEP="build (node src/build.js)"
node src/build.js

# 1b. Compare each freshly-built file against what's currently published on the
# release. Comparing against the live assets (not a local cache) means we still
# publish if CI or a manual run changed things underneath us. If every file
# matches, there's nothing to ship.
STEP="diff against published release"
RELEASE_BASE="https://github.com/heresmohit/UC-ingest/releases/download/$RELEASE_TAG"
changed=0
for f in "${FILES[@]}"; do
  published="$(curl -fsSL "$RELEASE_BASE/$f" 2>/dev/null || true)"
  if [[ "$published" != "$(cat "$f")" ]]; then
    echo "  changed: $f"
    changed=1
  fi
done

if (( changed == 0 )); then
  heartbeat
  echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] No changes vs published release; skipping upload + Cloudflare rebuild"
  exit 0
fi

# 2. Upload to the release, overwriting the existing assets (--clobber).
STEP="release upload (gh)"
gh release upload "$RELEASE_TAG" "${FILES[@]}" --clobber

# 3. Trigger the Cloudflare Pages rebuild so the site picks up the new data.
STEP="cloudflare rebuild trigger"
if [[ -n "${CF_DEPLOY_HOOK:-}" ]]; then
  curl -fsS -X POST "$CF_DEPLOY_HOOK" >/dev/null
  echo "Triggered Cloudflare rebuild"
else
  echo "WARN: CF_DEPLOY_HOOK not set; skipped Cloudflare rebuild" >&2
fi

heartbeat
echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] Publish complete"
