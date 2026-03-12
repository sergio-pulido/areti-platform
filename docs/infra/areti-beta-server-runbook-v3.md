# Simple Single-Server Production Runbook - v3

Reusable runbook for private beta deployment of Areti (web + API) on one Ubuntu server using Docker Compose and Caddy.

The repo source of truth for wrapper assets is now `ops/server/`. You should no longer hand-edit `compose.yaml`, `compose.production.yaml`, or the deploy scripts directly on the host unless you are performing emergency recovery.

This v3 is specific to the current Areti monorepo and updates v2 with a secure, practical secret model:

- non-sensitive config in `/opt/areti/.env`
- sensitive values in `/opt/areti/secrets/*.txt`
- Docker Compose `secrets` mount into `/run/secrets/*`
- API container exports secret values from files at startup (no app code changes required)
- correct monorepo Dockerfiles: `Dockerfile.api` and `Dockerfile.web` at repository root
- correct API upstream port in Caddy: `api:4000`
- remove ceremonial secrets not used by this repository (`NEXTAUTH`, `JWT`)

---

## Scope

This guide is for:
- 1 Ubuntu server
- 1 app stack
- Docker Compose
- Caddy reverse proxy with automatic HTTPS
- host-side file secrets (`.txt`), mounted as Docker secrets

This is not a high-availability setup.

---

## 0. Variables used in this guide

Replace these placeholders before executing commands:

- `DEPLOY_USER=deployer`
- `APP_NAME=areti`
- `APP_DIR=/opt/areti`
- `REPO_NAME=areti-platform`
- `REPO_DIR=/opt/areti/repos/areti-platform`
- `GIT_REPO=git@github.com:sergio-pulido/areti-platform.git`
- `GIT_BRANCH=main`
- `PRODUCT_HOST=my.areti.app`
- `API_HOST=api.areti.app`
- `SERVER_TIMEZONE=Europe/Madrid`

---

## 1) First login and base hardening (same as v2)

Follow v2 steps 1-6 for:
- server update
- non-root deploy user
- SSH hardening
- UFW + fail2ban
- Docker Engine + Compose plugin install
- `deployer` user added to `docker` group (then re-login)

---

## 2) Create app directory structure

As `deployer`:

```bash
sudo mkdir -p /opt/areti/{config/caddy,data/caddy,data/sqlite,data/uploads,backups,scripts,secrets,logs,repos/areti-platform}
sudo chown -R deployer:deployer /opt/areti
sudo chmod 755 /opt/areti
sudo chmod 700 /opt/areti/secrets
```

Expected layout:

```text
/opt/areti/
  repos/areti-platform/
  compose.yaml
  compose.production.yaml
  .env
  config/caddy/Caddyfile
  data/caddy/
  data/sqlite/
  data/uploads/
  backups/
  scripts/
  secrets/
  logs/
```

---

## 3) Git deploy key and clone

Use the same v2 steps 8-9.

Then verify monorepo structure from `REPO_DIR`:

```bash
cd /opt/areti/repos/areti-platform
find . -maxdepth 2 -name 'Dockerfile*'
find . -maxdepth 3 -name package.json
find . -maxdepth 3 \( -name bun.lockb -o -name bun.lock -o -name pnpm-lock.yaml -o -name package-lock.json \)
```

For this repo, expected Dockerfiles are:
- `./Dockerfile.api`
- `./Dockerfile.web`

---

## 4) Sync repo-owned wrapper files

After cloning the repository, the wrapper files should come from the repository itself:

```bash
cd /opt/areti/repos/areti-platform
./ops/server/scripts/sync-layout.sh /opt/areti
```

This installs:

- `/opt/areti/compose.yaml`
- `/opt/areti/compose.production.yaml`
- `/opt/areti/.env.example`
- `/opt/areti/config/caddy/Caddyfile`
- `/opt/areti/scripts/deploy-release.sh`
- `/opt/areti/scripts/checkout-release.sh`

The committed source of truth for those files is:

- `ops/server/compose.yaml`
- `ops/server/compose.production.yaml`
- `ops/server/.env.example`
- `ops/server/config/caddy/Caddyfile`
- `ops/server/scripts/*`

---

## 5) Create non-sensitive `.env`

---

Create `/opt/areti/.env` from `/opt/areti/.env.example` and then fill the real values:

```env
NODE_ENV=production
TZ=Europe/Madrid

APP_NAME=areti

PRODUCT_HOST=my.areti.app
API_HOST=api.areti.app
CADDY_EMAIL=ops@areti.app
WEB_APP_URL=https://my.areti.app
CORS_ORIGINS=https://my.areti.app
PASSKEY_RP_ID=my.areti.app
PASSKEY_RP_NAME=Areti
PASSKEY_ORIGINS=https://my.areti.app

API_BASE_URL=http://api:4000
NEXT_PUBLIC_API_BASE_URL=https://api.areti.app

CHAT_PROVIDER_ORDER=openai
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
OPENAI_BASE_URL=https://api.openai.com/v1

EMAIL_TRANSPORT=resend
RESEND_FROM_EMAIL=Areti <no-reply@areti.app>
SIGNUP_ENABLED=false

SMTP_HOST=
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
```

Protect it:

```bash
chmod 600 /opt/areti/.env
```

---

## 6) Create sensitive secret files (`.txt`)

Create only the secrets used by this repository:

```bash
printf 'replace_with_openai_key' > /opt/areti/secrets/openai_api_key.txt
printf 'replace_with_resend_key' > /opt/areti/secrets/resend_api_key.txt
printf 'replace_with_deepseek_key' > /opt/areti/secrets/deepseek_api_key.txt
printf 'replace_with_long_random_rate_limit_salt' > /opt/areti/secrets/rate_limit_ip_hash_salt.txt
chmod 600 /opt/areti/secrets/*.txt
```

Validate:

```bash
ls -l /opt/areti/secrets
wc -c /opt/areti/secrets/openai_api_key.txt
wc -c /opt/areti/secrets/resend_api_key.txt
wc -c /opt/areti/secrets/deepseek_api_key.txt
wc -c /opt/areti/secrets/rate_limit_ip_hash_salt.txt
```

Important:
- Keep `.txt` values single-line; no quotes.

---

## 7) Point DNS before first launch

Create DNS records:
- `A my.areti.app -> SERVER_IP`
- `A api.areti.app -> SERVER_IP`

Keep records as DNS-only during initial certificate issuance.

Check:

```bash
dig +short my.areti.app
dig +short api.areti.app
```

---

## 8) First build and start (step 15 equivalent, updated)

```bash
cd /opt/areti
./scripts/deploy-release.sh /opt/areti
```

Follow logs:

```bash
docker compose -f compose.yaml -f compose.production.yaml logs -f --tail=120 api web caddy
```

Smoke checks:

```bash
curl -I https://my.areti.app
curl -I https://api.areti.app
```

If something fails:

```bash
docker compose -f compose.yaml -f compose.production.yaml logs --tail=250 api
docker compose -f compose.yaml -f compose.production.yaml logs --tail=250 web
docker compose -f compose.yaml -f compose.production.yaml logs --tail=250 caddy
```

---

## 9) Deploy workflow for future changes

Automated release deploy:

- push a release tag like `v0.1.0`
- GitHub Actions runs `.github/workflows/release-deploy.yml`
- the workflow checks out that tag on the server repo, syncs `ops/server`, and runs `/opt/areti/scripts/deploy-release.sh`

Manual fallback deploy to `main`:

```bash
cd /opt/areti/repos/areti-platform
git fetch origin --tags
git checkout main
./ops/server/scripts/sync-layout.sh /opt/areti
/opt/areti/scripts/deploy-release.sh /opt/areti
```

Deploy a tag:

```bash
cd /opt/areti/repos/areti-platform
git fetch origin --tags
./ops/server/scripts/checkout-release.sh /opt/areti vX.Y.Z
./ops/server/scripts/sync-layout.sh /opt/areti
/opt/areti/scripts/deploy-release.sh /opt/areti
```

---

## 10) Secret rotation procedure

Rotate OpenAI key:

```bash
printf 'new_openai_key' > /opt/areti/secrets/openai_api_key.txt
chmod 600 /opt/areti/secrets/openai_api_key.txt
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml up -d --force-recreate api
```

Rotate Resend key:

```bash
printf 'new_resend_key' > /opt/areti/secrets/resend_api_key.txt
chmod 600 /opt/areti/secrets/resend_api_key.txt
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml up -d --force-recreate api
```

Why recreate API: secret file contents are read when the container starts.

---

## 11) Backups (same baseline as v2)

Create script:

```bash
cat > /opt/areti/scripts/backup-db.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
mkdir -p /opt/areti/backups/sqlite
TS=$(date +"%Y-%m-%d_%H-%M-%S")
SNAPSHOT_DIR="/opt/areti/backups/sqlite/${TS}"
mkdir -p "$SNAPSHOT_DIR"
cp /opt/areti/data/sqlite/ataraxia.prod.db* "$SNAPSHOT_DIR"/
find /opt/areti/backups/sqlite -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
EOF
chmod +x /opt/areti/scripts/backup-db.sh
```

Test:

```bash
/opt/areti/scripts/backup-db.sh
ls -lah /opt/areti/backups
```

Cron:

```cron
0 3 * * * /opt/areti/scripts/backup-db.sh >/dev/null 2>&1
```

---

## 12) Validation checklist (v3)

- `docker compose ps` shows `api`, `web`, `caddy` as running
- `https://my.areti.app` returns `200`/`30x`
- `https://api.areti.app` returns `200`/`404` (not proxy failure)
- signup flow works with email delivery (Resend)
- one API-backed screen in web loads correctly
- `/opt/areti/data/sqlite/ataraxia.prod.db` exists and grows over time

---

## 13) Delta from v2 (quick diff)

1. Use `find ... -name 'Dockerfile*'` because this repo has `Dockerfile.api` and `Dockerfile.web`, not `Dockerfile`.
2. Compose build uses `context: ./areti-platform` and root Dockerfiles.
3. Caddy API upstream is `api:4000` (not `3001`).
4. Sensitive keys moved out of `.env` and into Docker secrets from `/opt/areti/secrets/*.txt`.
5. API reads mounted secret files via container startup command (`sh -lc ... export ...`).
6. `NEXTAUTH`/`JWT` secret files are intentionally not part of current Areti deployment because the code does not use them.
