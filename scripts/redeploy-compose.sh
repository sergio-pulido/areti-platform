#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="$ROOT_DIR/data/ataraxia.docker.db"

cd "$ROOT_DIR"

mkdir -p data

echo "Stopping containers..."
docker compose down

echo "Rebuilding images..."
docker compose build --pull

if [ -f "$DB_PATH" ]; then
  BACKUP_PATH="${DB_PATH}.bak.$(date +%F-%H%M%S)"
  cp "$DB_PATH" "$BACKUP_PATH"
  echo "Backed up database to $BACKUP_PATH"
fi

echo "Applying database migrations..."
docker compose run --rm api npm run db:migrate

echo "Starting services..."
docker compose up -d

echo "Container status:"
docker compose ps

echo "API health:"
curl --fail http://127.0.0.1:4000/health
echo

echo "Web headers:"
curl --fail -I http://127.0.0.1:3000
echo

echo "Recent logs:"
docker compose logs --tail=120 api web
