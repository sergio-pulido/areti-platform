#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SOURCE_ROOT="$REPO_ROOT/ops/server"
TARGET_ROOT="${1:-/opt/areti}"

install -d "$TARGET_ROOT/config/caddy" "$TARGET_ROOT/scripts"

install -m 0644 "$SOURCE_ROOT/compose.yaml" "$TARGET_ROOT/compose.yaml"
install -m 0644 "$SOURCE_ROOT/compose.production.yaml" "$TARGET_ROOT/compose.production.yaml"
install -m 0644 "$SOURCE_ROOT/.env.example" "$TARGET_ROOT/.env.example"
install -m 0644 "$SOURCE_ROOT/config/caddy/Caddyfile" "$TARGET_ROOT/config/caddy/Caddyfile"
install -m 0755 "$SOURCE_ROOT/scripts/deploy-release.sh" "$TARGET_ROOT/scripts/deploy-release.sh"
install -m 0755 "$SOURCE_ROOT/scripts/checkout-release.sh" "$TARGET_ROOT/scripts/checkout-release.sh"

echo "Synced deployment wrapper files to $TARGET_ROOT"
