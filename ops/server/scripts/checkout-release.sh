#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${1:-/opt/areti}"
RELEASE_REF="${2:?Usage: checkout-release.sh <app-dir> <tag-or-ref>}"
REPO_DIR="$APP_DIR/repos/areti-platform"

cd "$REPO_DIR"
git fetch origin --tags
git checkout "$RELEASE_REF"

echo "Checked out $RELEASE_REF in $REPO_DIR"
