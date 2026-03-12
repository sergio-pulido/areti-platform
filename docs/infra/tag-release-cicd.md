# Tag Release CI/CD

## Purpose

This document describes the repo-owned release flow for the production host at `/opt/areti`.

The deploy model is split into:

- `/opt/areti`
  - deployment wrapper files (`compose.yaml`, `compose.production.yaml`, `config/caddy/Caddyfile`, `.env`, `scripts/`, `data/`, `secrets/`, `backups/`, `logs/`)
- `/opt/areti/repos/areti-platform`
  - checked-out application repository

The source of truth for wrapper assets is now `ops/server/` inside this repository.

## Release Trigger

- Create an annotated release tag, for example `v0.1.0`
- Push the tag to GitHub
- GitHub Actions workflow `.github/workflows/release-deploy.yml` runs automatically

## Workflow Stages

### 1. Validation

The release workflow runs:

- `npm ci`
- `npx playwright install --with-deps chromium`
- `npm run ci`

This keeps release deploys gated by the same lint, typecheck, integration, e2e, and build checks already used in CI.

### 2. Security Gate

The release workflow also runs:

- `npm audit --omit=dev --audit-level=high`
- Trivy filesystem scan with `HIGH,CRITICAL` severity gate

Separate ongoing security workflows also run on push / pull request / schedule:

- `.github/workflows/security.yml`
- `.github/dependabot.yml`

## Remote Deploy Sequence

When validation and security gates pass, the workflow:

1. SSHes into the production host
2. Checks out the pushed tag inside `/opt/areti/repos/areti-platform`
3. Runs `./ops/server/scripts/sync-layout.sh /opt/areti`
4. Runs `/opt/areti/scripts/deploy-release.sh /opt/areti`

The deploy script:

- stops the current stack
- snapshots the SQLite production files into `/opt/areti/backups/sqlite/<timestamp>/`
- rebuilds Docker images from the checked-out tag
- runs DB migrations
- starts the stack again
- checks proxied HTTP health through Caddy using the configured hosts
- prints recent logs for `api`, `web`, and `caddy`

## Required GitHub Secrets

Set these repository or environment secrets for the deploy workflow:

- `PROD_SSH_HOST`
- `PROD_SSH_PORT`
- `PROD_SSH_USER`
- `PROD_APP_DIR`
- `PROD_SSH_PRIVATE_KEY`
- `PROD_KNOWN_HOSTS`

Recommended:

- use a dedicated deploy key scoped to this server
- store these in the GitHub `production` environment
- add environment protection rules before enabling tag deploys

## Required Server Files

These stay on the server and are not committed:

- `/opt/areti/.env`
- `/opt/areti/secrets/openai_api_key.txt`
- `/opt/areti/secrets/resend_api_key.txt`
- `/opt/areti/secrets/deepseek_api_key.txt`
- `/opt/areti/secrets/rate_limit_ip_hash_salt.txt`

Use `ops/server/.env.example` as the non-sensitive template for `/opt/areti/.env`.
