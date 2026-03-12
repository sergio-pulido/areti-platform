# Ops

Operational assets that sit around the application repository live here.

## Structure

- `server/`
  - Source of truth for the single-server `/opt/areti` wrapper layout
  - Includes Compose files, Caddy config, env template, and deploy scripts

## Production Model

The production host is intentionally split into two roots:

- `/opt/areti`
  - Deployment wrapper
  - Compose files, Caddy config, secrets, persistent data, backups, logs, and runtime scripts
- `/opt/areti/repos/areti-platform`
  - Git checkout of this repository

`ops/server/scripts/sync-layout.sh` copies the repo-owned wrapper assets from this repository into `/opt/areti` without touching `.env`, `secrets/`, `data/`, or `backups/`.
