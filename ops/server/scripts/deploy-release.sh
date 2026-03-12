#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
DB_PATH="$ROOT_DIR/data/sqlite/ataraxia.prod.db"
BACKUP_DIR="$ROOT_DIR/backups/sqlite"

cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

compose() {
  docker compose -f compose.yaml -f compose.production.yaml "$@"
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local host_header="${3:-}"

  for _attempt in $(seq 1 30); do
    if [ -n "$host_header" ]; then
      if curl --silent --show-error --fail -H "Host: $host_header" "$url" >/dev/null; then
        echo "$label is healthy"
        return 0
      fi
    else
      if curl --silent --show-error --fail "$url" >/dev/null; then
        echo "$label is healthy"
        return 0
      fi
    fi
    sleep 2
  done

  echo "$label did not become healthy in time" >&2
  return 1
}

mkdir -p "$BACKUP_DIR"

echo "Stopping containers..."
compose down

timestamp="$(date +%F-%H%M%S)"
if compgen -G "${DB_PATH}*" >/dev/null; then
  snapshot_dir="$BACKUP_DIR/$timestamp"
  mkdir -p "$snapshot_dir"
  cp "${DB_PATH}"* "$snapshot_dir/"
  echo "Backed up SQLite files into $snapshot_dir"
fi

echo "Rebuilding images..."
compose build --pull

echo "Applying database migrations..."
compose run --rm api npm run db:migrate

echo "Starting services..."
compose up -d

echo "Waiting for proxied services..."
if [ -n "${API_HOST:-}" ]; then
  wait_for_url "http://127.0.0.1/health" "api" "$API_HOST"
fi
if [ -n "${PRODUCT_HOST:-}" ]; then
  wait_for_url "http://127.0.0.1/" "web" "$PRODUCT_HOST"
fi

echo "Container status:"
compose ps

echo "Recent logs:"
compose logs --tail=120 api web caddy
