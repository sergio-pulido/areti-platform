# Simple Single-Server Production Runbook - v3

Reusable runbook for private beta deployment of Areti (web + API) on one Ubuntu server using Docker Compose and Caddy.

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
- `REPO_DIR=/opt/areti/areti-platform`
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
sudo mkdir -p /opt/areti/{config/caddy,data/caddy,data/sqlite,data/uploads,backups,scripts,secrets,logs,areti-platform}
sudo chown -R deployer:deployer /opt/areti
sudo chmod 755 /opt/areti
sudo chmod 700 /opt/areti/secrets
```

Expected layout:

```text
/opt/areti/
  areti-platform/
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
cd /opt/areti/areti-platform
find . -maxdepth 2 -name 'Dockerfile*'
find . -maxdepth 3 -name package.json
find . -maxdepth 3 \( -name bun.lockb -o -name bun.lock -o -name pnpm-lock.yaml -o -name package-lock.json \)
```

For this repo, expected Dockerfiles are:
- `./Dockerfile.api`
- `./Dockerfile.web`

---

## 4) Create `/opt/areti/compose.yaml` (v3, full file)

Create this file exactly:

```yaml
version: "3.9"

services:
  api:
    build:
      context: ./areti-platform
      dockerfile: Dockerfile.api
    restart: unless-stopped
    env_file:
      - .env
    environment:
      NODE_ENV: production
      API_PORT: 4000
      CORS_ORIGINS: ${CORS_ORIGINS}
      WEB_APP_URL: ${WEB_APP_URL}
      PASSKEY_RP_ID: ${PASSKEY_RP_ID}
      PASSKEY_RP_NAME: ${PASSKEY_RP_NAME:-Areti}
      PASSKEY_ORIGINS: ${PASSKEY_ORIGINS}
      ATARAXIA_DB_PATH: /app/data/sqlite/ataraxia.prod.db
      CHAT_PROVIDER_ORDER: ${CHAT_PROVIDER_ORDER:-openai}
      OPENAI_CHAT_MODEL: ${OPENAI_CHAT_MODEL:-gpt-4.1-mini}
      OPENAI_TRANSCRIPTION_MODEL: ${OPENAI_TRANSCRIPTION_MODEL:-gpt-4o-mini-transcribe}
      OPENAI_BASE_URL: ${OPENAI_BASE_URL:-https://api.openai.com/v1}
      DEEPSEEK_CHAT_MODEL: ${DEEPSEEK_CHAT_MODEL:-deepseek-chat}
      DEEPSEEK_BASE_URL: ${DEEPSEEK_BASE_URL:-https://api.deepseek.com/v1}
      EMAIL_TRANSPORT: ${EMAIL_TRANSPORT:-resend}
      RESEND_FROM_EMAIL: ${RESEND_FROM_EMAIL}
      SMTP_HOST: ${SMTP_HOST:-}
      SMTP_PORT: ${SMTP_PORT:-1025}
      SMTP_SECURE: ${SMTP_SECURE:-false}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASS: ${SMTP_PASS:-}
      SMTP_FROM_EMAIL: ${SMTP_FROM_EMAIL:-}
      TZ: ${TZ:-Europe/Madrid}
    command: >
      sh -lc 'export OPENAI_API_KEY="$$(cat /run/secrets/openai_api_key)";
      export RESEND_API_KEY="$$(cat /run/secrets/resend_api_key)";
      exec npm run start:api'
    expose:
      - "4000"
    volumes:
      - ./data/sqlite:/app/data/sqlite
      - ./data/uploads:/app/data/uploads
    secrets:
      - openai_api_key
      - resend_api_key
    networks:
      - appnet

  web:
    build:
      context: ./areti-platform
      dockerfile: Dockerfile.web
    restart: unless-stopped
    env_file:
      - .env
    environment:
      NODE_ENV: production
      API_BASE_URL: http://api:4000
      NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
      TZ: ${TZ:-Europe/Madrid}
    depends_on:
      - api
    expose:
      - "3000"
    networks:
      - appnet

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - ./data/caddy:/data
      - ./config/caddy:/config
    depends_on:
      - web
      - api
    networks:
      - appnet

secrets:
  nextauth_secret:
    file: ./secrets/nextauth_secret.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  openai_api_key:
    file: ./secrets/openai_api_key.txt
  resend_api_key:
    file: ./secrets/resend_api_key.txt

networks:
  appnet:
    driver: bridge
```

Notes:
- `command` exports secret values from mounted files and then starts API.
- This avoids putting API keys in `.env`.
- `NEXT_PUBLIC_API_BASE_URL` is public by design and should stay in `.env`.

---

## 5) Create `/opt/areti/compose.production.yaml`

```yaml
services:
  api:
    environment:
      NODE_ENV: production

  web:
    environment:
      NODE_ENV: production
```

---

## 6) Create Caddy config

Create `/opt/areti/config/caddy/Caddyfile`:

```caddy
my.areti.app {
  encode gzip zstd
  reverse_proxy web:3000
}

api.areti.app {
  encode gzip zstd
  reverse_proxy api:4000
}
```

---

## 7) Create non-sensitive `.env`

Create `/opt/areti/.env`:

```env
NODE_ENV=production
TZ=Europe/Madrid

APP_NAME=areti

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

## 8) Create sensitive secret files (`.txt`)

Create only the secrets used by this repository:

```bash
printf 'replace_with_openai_key' > /opt/areti/secrets/openai_api_key.txt
printf 'replace_with_resend_key' > /opt/areti/secrets/resend_api_key.txt
chmod 600 /opt/areti/secrets/*.txt
```

Validate:

```bash
ls -l /opt/areti/secrets
wc -c /opt/areti/secrets/openai_api_key.txt
wc -c /opt/areti/secrets/resend_api_key.txt
```

Important:
- Do not create `nextauth_secret.txt` or `jwt_secret.txt` for this codebase unless those vars are introduced in code later.
- Keep `.txt` values single-line; no quotes.

---

## 9) Point DNS before first launch

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

## 10) First build and start (step 15 equivalent, updated)

```bash
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml config > /tmp/compose.resolved.yaml
docker compose -f compose.yaml -f compose.production.yaml up -d --build
docker compose -f compose.yaml -f compose.production.yaml ps
```

Follow logs:

```bash
docker compose -f compose.yaml -f compose.production.yaml logs -f --tail=120 api
docker compose -f compose.yaml -f compose.production.yaml logs -f --tail=120 web
docker compose -f compose.yaml -f compose.production.yaml logs -f --tail=120 caddy
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

## 11) Deploy workflow for future changes

Manual fallback deploy:

```bash
cd /opt/areti/areti-platform
git fetch origin
git checkout main
git pull --ff-only origin main

cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml up -d --build
```

Deploy a tag:

```bash
cd /opt/areti/areti-platform
git fetch --all --tags
git checkout vX.Y.Z

cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml up -d --build
```

---

## 12) Secret rotation procedure

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

## 13) Backups (same baseline as v2)

Create script:

```bash
cat > /opt/areti/scripts/backup-db.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
mkdir -p /opt/areti/backups
TS=$(date +"%Y-%m-%d_%H-%M-%S")
cp /opt/areti/data/sqlite/ataraxia.prod.db /opt/areti/backups/prod_${TS}.db
gzip /opt/areti/backups/prod_${TS}.db
find /opt/areti/backups -type f -mtime +14 -delete
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

## 14) Validation checklist (v3)

- `docker compose ps` shows `api`, `web`, `caddy` as running
- `https://my.areti.app` returns `200`/`30x`
- `https://api.areti.app` returns `200`/`404` (not proxy failure)
- signup flow works with email delivery (Resend)
- one API-backed screen in web loads correctly
- `/opt/areti/data/sqlite/ataraxia.prod.db` exists and grows over time

---

## 15) Delta from v2 (quick diff)

1. Use `find ... -name 'Dockerfile*'` because this repo has `Dockerfile.api` and `Dockerfile.web`, not `Dockerfile`.
2. Compose build uses `context: ./areti-platform` and root Dockerfiles.
3. Caddy API upstream is `api:4000` (not `3001`).
4. Sensitive keys moved out of `.env` and into Docker secrets from `/opt/areti/secrets/*.txt`.
5. API reads mounted secret files via container startup command (`sh -lc ... export ...`).
6. `NEXTAUTH`/`JWT` secret files are intentionally not part of current Areti deployment because the code does not use them.

