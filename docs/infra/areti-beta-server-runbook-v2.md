# Simple Single-Server Production Runbook — v2

Reusable runbook for small/private beta deployments of web + API apps on one Ubuntu server using Docker Compose and Caddy.

This v2 improves the original runbook by:
- using **named repo directories** instead of a generic `repo/`
- clarifying **bootstrap vs long-term deploy workflow**
- adding both **Option 1: Automatic (recommended)** and **Option 2: Manual fallback** for deployments
- keeping **host-level DB backups inside the server** (without Hetzner paid backups)
- clarifying the **Docker group re-login step**
- using a **dedicated read-only GitHub deploy key** for the server
- making it explicit that `compose`, `.env`, and `secrets` must be adapted to the **actual repository structure**, not guessed blindly

This runbook is based on the original file and the deployment decisions refined during setup. fileciteturn1file0

---

## Scope

This guide is for:
- 1 Ubuntu server
- 1 small app stack
- Docker Compose
- Caddy reverse proxy with automatic HTTPS
- file-based secrets on the host
- private beta / low traffic / founder-led validation

This is **not** a high-availability setup.

---

## Target hostname pattern

Recommended hostname pattern:
- `yourdomain.com` → marketing/public site (optional)
- `my.yourdomain.com` → authenticated product
- `api.yourdomain.com` → API

For Areti:
- `my.areti.app`
- `api.areti.app`

During first launch, keep Cloudflare records as **DNS only** until Caddy has successfully issued certificates and both hosts respond correctly.

---

## Assumptions

- You already created the server in Hetzner.
- Your SSH public key was added during provisioning.
- Server OS is Ubuntu 24.04 LTS or 22.04 LTS.
- You control DNS for the domain/subdomains.
- You have your app code in GitHub.
- You are doing a **single-server bootstrap**, not full CI/CD platform engineering.

---

## 0. Variables used in this guide

Replace these values before executing commands:

- `DEPLOY_USER=deployer`
- `APP_NAME=areti`
- `APP_DIR=/opt/areti`
- `REPO_NAME=areti-platform`
- `REPO_DIR=/opt/areti/areti-platform`
- `GIT_REPO=git@github.com:sergio-pulido/areti-platform.git`
- `GIT_BRANCH=main`
- `PRODUCT_HOST=my.areti.app`
- `API_HOST=api.areti.app`
- `SSH_PORT=22`
- `SERVER_TIMEZONE=Europe/Madrid`

---

## 1. First login as root

From your local machine:

```bash
ssh root@YOUR_SERVER_IP
```

Update packages and basic tools:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release ufw fail2ban git unzip htop vim tree rsync jq
```

Set server timezone:

```bash
timedatectl set-timezone Europe/Madrid
timedatectl status
```

Set hostname if needed:

```bash
hostnamectl set-hostname areti-prod-01
hostnamectl
```

If a kernel upgrade is installed, reboot before continuing with Docker.

---

## 2. Create non-root deployment user

Create a dedicated sudo user:

```bash
adduser deployer
usermod -aG sudo deployer
```

Use a **long random password** stored in your password manager.

Create SSH folder and copy your authorized keys from root:

```bash
mkdir -p /home/deployer/.ssh
cp /root/.ssh/authorized_keys /home/deployer/.ssh/authorized_keys
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys
```

Test login in a second terminal before touching SSH config:

```bash
ssh deployer@YOUR_SERVER_IP
sudo whoami
```

You should get `root` after `sudo whoami`.

---

## 3. Harden SSH minimally and safely

Create a hardening snippet:

```bash
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'SSHEOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
ChallengeResponseAuthentication no
PubkeyAuthentication yes
X11Forwarding no
UsePAM yes
SSHEOF
```

Validate and reload:

```bash
sshd -t
systemctl reload ssh
```

Only after confirming `ssh deployer@YOUR_SERVER_IP` still works:

```bash
passwd -l root
```

---

## 4. Configure firewall

Allow SSH, HTTP and HTTPS:

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status verbose
```

This is acceptable for bootstrap. Later, if practical, restrict SSH to your own IP.

---

## 5. Enable basic brute-force protection

```bash
systemctl enable fail2ban
systemctl start fail2ban
```

Create local jail config:

```bash
cat > /etc/fail2ban/jail.local <<'F2BEOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = systemd
F2BEOF
```

Restart and verify:

```bash
systemctl restart fail2ban
fail2ban-client status sshd
```

---

## 6. Install Docker Engine and Compose plugin

Continue as `deployer` with `sudo`.

Check if conflicting packages exist:

```bash
dpkg -l | grep -E 'docker|containerd|runc'
```

If needed, remove conflicts:

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do sudo apt remove -y "$pkg"; done
```

Set up Docker repo:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Enable Docker:

```bash
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl status docker --no-pager
```

Allow deploy user to run Docker without sudo:

```bash
sudo usermod -aG docker deployer
```

**Important:** group membership does not apply to the current shell session.
Log out and back in now:

```bash
exit
ssh deployer@YOUR_SERVER_IP
```

Then verify:

```bash
groups
docker version
docker compose version
```

Expected: `docker` must appear in `groups`.

---

## 7. Create app directory structure

As `deployer`:

```bash
sudo mkdir -p /opt/areti/{config/caddy,data/caddy,data/sqlite,data/uploads,backups,scripts,secrets,logs,areti-platform}
sudo chown -R deployer:deployer /opt/areti
sudo chmod 755 /opt/areti
sudo chmod 700 /opt/areti/secrets
```

Recommended final structure:

```text
/opt/areti/
  areti-platform/
  compose.yaml
  compose.production.yaml
  .env
  config/
    caddy/
      Caddyfile
  data/
    caddy/
    sqlite/
    uploads/
  backups/
  scripts/
  secrets/
  logs/
```

### Naming rule

Do **not** force everything into a generic `repo/` folder if you plan to host more than one repository for the same project later.

Bad:
```text
/opt/areti/repo
```

Better:
```text
/opt/areti/areti-platform
/opt/areti/areti-marketing-site
```

Verify:

```bash
tree -a /opt/areti
ls -ld /opt/areti /opt/areti/secrets
```

---

## 8. Prepare Git access for deployer

Use a **dedicated read-only deploy key** for the repository.
Do **not** reuse your personal GitHub SSH key on the server.

Generate key without passphrase for this read-only repo-specific deploy key:

```bash
ssh-keygen -t ed25519 -C "deployer@areti-prod-readonly" -f ~/.ssh/id_ed25519_github_areti
chmod 600 ~/.ssh/id_ed25519_github_areti
chmod 644 ~/.ssh/id_ed25519_github_areti.pub
```

Create SSH config:

```bash
cat > ~/.ssh/config <<'EOFSSH'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github_areti
  IdentitiesOnly yes
EOFSSH
chmod 600 ~/.ssh/config
```

Print public key and add it to GitHub as a **Deploy Key (read-only)** on this repo only:

```bash
cat ~/.ssh/id_ed25519_github_areti.pub
```

Test once added:

```bash
ssh -T git@github.com
```

With a repo deploy key, GitHub may identify the repository rather than your personal username. That is expected. Successful authentication means the key is working.

---

## 9. Clone the repository

This clone is used for:
- initial bootstrap
- manual fallback deployments
- emergency fixes if your CI/CD pipeline is unavailable

Clone into the named repo directory:

```bash
cd /opt/areti
git clone git@github.com:sergio-pulido/areti-platform.git areti-platform
cd /opt/areti/areti-platform
git checkout main
```

Before writing Compose files, inspect the actual repo structure:

```bash
find . -maxdepth 4 -name Dockerfile
find . -maxdepth 3 -name package.json
find . -maxdepth 3 \( -name bun.lockb -o -name bun.lock -o -name pnpm-lock.yaml -o -name package-lock.json \)
```

**Do not assume** paths like `apps/web/Dockerfile` or ports like `3000/3001` unless the repo actually contains them.

---

## 10. Create production compose files

Keep deployment config in `/opt/areti`, owned by the host.

### Important

The Compose examples below are **templates**, not truth.
You must adapt them to the **actual repository structure**, runtime commands, ports, storage paths, and secrets.

If your repo does not contain Dockerfiles yet, you have two choices:
- create proper Dockerfiles in the repository
- or use container images / runtime commands directly in Compose as a temporary bootstrap

### `/opt/areti/compose.yaml` (template)

```yaml
services:
  web:
    build:
      context: ./areti-platform
      dockerfile: apps/web/Dockerfile
    restart: unless-stopped
    env_file:
      - .env
    expose:
      - "3000"
    depends_on:
      - api
    networks:
      - appnet

  api:
    build:
      context: ./areti-platform
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    env_file:
      - .env
    expose:
      - "3001"
    volumes:
      - ./data/sqlite:/app/data
      - ./data/uploads:/app/uploads
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

networks:
  appnet:
    driver: bridge
```

### `/opt/areti/compose.production.yaml` (template)

```yaml
services:
  web:
    environment:
      NODE_ENV: production

  api:
    environment:
      NODE_ENV: production
```

---

## 11. Create Caddy config

Caddy automatically provisions and renews HTTPS certificates for public hostnames.

Create `/opt/areti/config/caddy/Caddyfile`:

```caddy
my.areti.app {
  encode gzip zstd
  reverse_proxy web:3000
}

api.areti.app {
  encode gzip zstd
  reverse_proxy api:3001
}
```

If your frontend handles API proxying internally and you do not need a public API hostname, you can omit the second block.

---

## 12. Create `.env`

Create `/opt/areti/.env` only after confirming the exact variables the app actually needs.

Safe base template:

```env
NODE_ENV=production
TZ=Europe/Madrid

APP_NAME=areti
APP_URL=https://my.areti.app
API_URL=https://api.areti.app

FEATURE_SIGNUP_ENABLED=false
FEATURE_BETA_INVITES_ONLY=true
POSTHOG_HOST=https://eu.i.posthog.com
POSTHOG_PUBLIC_KEY=REPLACE_ME
```

Protect it:

```bash
chmod 600 /opt/areti/.env
```

Do **not** dump secrets here unless you really must.

---

## 13. Create runtime secret files

Only create the secret files your app actually requires.

Example:

```bash
openssl rand -hex 32 > /opt/areti/secrets/nextauth_secret.txt
openssl rand -hex 32 > /opt/areti/secrets/jwt_secret.txt
printf 'replace_me' > /opt/areti/secrets/openai_api_key.txt
printf 'replace_me' > /opt/areti/secrets/resend_api_key.txt
chmod 600 /opt/areti/secrets/*.txt
```

If your app supports reading from `/run/secrets`, define Compose secrets and mount them.
If not, either:
- adapt the app to read secret files
- or use environment variables for now

Do not create fake ceremonial secrets just for aesthetics.

---

## 14. Point DNS before first launch

In Cloudflare or your DNS provider, create:

- `A my.areti.app -> YOUR_SERVER_IP`
- `A api.areti.app -> YOUR_SERVER_IP`

For first launch, keep them as **DNS only**.

Validate from your machine:

```bash
dig +short my.areti.app
dig +short api.areti.app
```

Caddy cannot issue certificates if DNS is wrong or ports 80/443 are blocked.

---

## 15. First build and start

Before first launch, verify repo structure again:

```bash
cd /opt/areti/areti-platform
find . -maxdepth 4 -name Dockerfile
```

Then, from `/opt/areti`:

```bash
docker compose -f compose.yaml -f compose.production.yaml up -d --build
```

Check containers:

```bash
docker compose ps
```

Check logs:

```bash
docker compose logs -f --tail=100 caddy
```

In another terminal:

```bash
curl -I https://my.areti.app
curl -I https://api.areti.app
```

If something fails:

```bash
docker compose logs --tail=200 web
docker compose logs --tail=200 api
docker compose logs --tail=200 caddy
```

---

## 16. Deploy workflow for changes

Use both options below.
Option 1 is the normal flow.
Option 2 is the manual fallback when you need to deploy or fix something quickly without relying on GitHub Actions.

### Option 1 — Automatic deploy with GitHub Actions [Recommended]

Recommended trigger:
- `push` of a production tag, for example `v*`

Alternative:
- `workflow_dispatch` for manual controlled deploys from the GitHub UI

#### Which is better?

- **Tag push** is better when you want versioned, auditable, release-style deployments.
- **workflow_dispatch** is useful when you want to choose branch/tag manually from the UI, retry a deploy, or run a hotfix deploy without inventing a throwaway tag first.

Best practice for you:
- use **tag push** as the normal production flow
- keep **workflow_dispatch** available as an operator override

#### Recommended GitHub Actions flow

1. Checkout repository
2. Validate tag / branch
3. Optional tests / lint / build checks
4. SSH into server
5. `cd /opt/areti/areti-platform`
6. `git fetch --all --tags`
7. `git checkout <tag or main>`
8. `cd /opt/areti`
9. `docker compose -f compose.yaml -f compose.production.yaml up -d --build`
10. Run smoke checks

Store server SSH credentials in GitHub Actions secrets, not in the repo.

### Option 2 — Manual deploy [Fallback]

Standard redeploy:

```bash
cd /opt/areti/areti-platform
git fetch origin
git checkout main
git pull --ff-only origin main
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml up -d --build
```

Deploy a specific tag manually:

```bash
cd /opt/areti/areti-platform
git fetch --all --tags
git checkout vX.Y.Z
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml up -d --build
```

Redeploy only web:

```bash
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml build web
docker compose -f compose.yaml -f compose.production.yaml up -d --no-deps web
```

Redeploy only api:

```bash
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml build api
docker compose -f compose.yaml -f compose.production.yaml up -d --no-deps api
```

---

## 17. Backups

We are **not** using Hetzner paid server backups for this bootstrap.
That does **not** mean “no backups”.
It means backups are handled **inside the server** for now.

Create backup script:

```bash
cat > /opt/areti/scripts/backup-db.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
mkdir -p /opt/areti/backups
TS=$(date +"%Y-%m-%d_%H-%M-%S")
cp /opt/areti/data/sqlite/prod.db /opt/areti/backups/prod_${TS}.db
gzip /opt/areti/backups/prod_${TS}.db
find /opt/areti/backups -type f -mtime +14 -delete
EOF
chmod +x /opt/areti/scripts/backup-db.sh
```

Test manually:

```bash
/opt/areti/scripts/backup-db.sh
ls -lah /opt/areti/backups
```

Add cron job:

```bash
crontab -e
```

Add:

```cron
0 3 * * * /opt/areti/scripts/backup-db.sh >/dev/null 2>&1
```

### Important reality check

A backup stored only on the same server is better than nothing, but still fragile.
Plan off-server backup copies later.
Otherwise one disk failure, full server loss, or major operator mistake can still ruin your day.

---

## 18. Optional system cleanup and maintenance

Show disk usage:

```bash
df -h
du -sh /opt/areti/*
```

Prune Docker cache carefully:

```bash
docker system df
docker image prune -a
```

Do **not** run broad prune commands casually on a server you do not fully understand.

---

## 19. PostHog for beta analytics

Recommended minimal setup after the app is online:
- PostHog Cloud EU project
- web SDK in frontend
- server-side capture for key backend events if needed
- 10–15 core events max at the start

Suggested events:
- `invite_opened`
- `signup_completed`
- `login_completed`
- `onboarding_started`
- `onboarding_completed`
- `first_chat_started`
- `first_reflection_created`
- `reflection_saved`
- `session_returned_day_2`
- `feedback_submitted`

Suggested properties:
- `cohort`
- `invite_code`
- `device_type`
- `country`
- `locale`
- `onboarding_version`
- `beta_group`

Avoid vanity tracking.
Track only what helps answer product questions.

---

## 20. Beta access model

Recommended for this phase:
- public signup disabled
- invite-only access
- admin can generate invite links or create users manually
- email invitation with tokenized link
- expiry time on invites
- track `invite_sent`, `invite_opened`, `invite_accepted`

This is cleaner than a fake public signup plus hidden whitelist logic.

---

## 21. Validation checklist before inviting testers

### Server
- [ ] deploy user works
- [ ] root SSH disabled
- [ ] password auth disabled
- [ ] firewall enabled
- [ ] fail2ban running
- [ ] Docker installed
- [ ] Compose installed

### DNS / TLS
- [ ] `my.areti.app` resolves to server IP
- [ ] `api.areti.app` resolves to server IP
- [ ] HTTPS works on both hosts

### App
- [ ] frontend loads
- [ ] API health endpoint responds
- [ ] login works
- [ ] invite flow works
- [ ] onboarding works
- [ ] core feature works
- [ ] feedback flow works

### Data / Recovery
- [ ] DB file persists between restarts
- [ ] backup script created
- [ ] backup script tested manually
- [ ] restore procedure documented

### Analytics
- [ ] PostHog events arriving
- [ ] core funnel visible
- [ ] tester cohort property attached

---

## 22. Restore test

At least once, test a restore on a copy:

```bash
cp /opt/areti/backups/prod_YYYY-MM-DD_HH-MM-SS.db.gz /tmp/
gunzip /tmp/prod_YYYY-MM-DD_HH-MM-SS.db.gz
ls -lah /tmp/prod_YYYY-MM-DD_HH-MM-SS.db
```

A backup you never tested is just optimism disguised as process.

---

## 23. Reuse this for other similar projects

For another small app, change only:
- app directory (`/opt/projectname`)
- named repo directories (`/opt/projectname/project-api`, `/opt/projectname/project-marketing-site`)
- hostnames (`my.project.com`, `api.project.com`)
- repo URL and branch
- Dockerfiles / service names / ports
- `.env` and secrets list

Keep the server bootstrap and host hardening steps essentially identical.

---

## 24. What not to add yet

Do not add this on day one unless there is a real reason:
- Kubernetes
- Docker Swarm
- Terraform for one box
- Vault
- Prometheus + Loki + Grafana stack
- Authentik
- Redis “just in case”
- CI/CD overengineering

Those are future tools, not current necessities.

---

## 25. Official documentation used

- Docker Engine on Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Docker Compose plugin on Linux: https://docs.docker.com/compose/install/linux/
- Docker Compose production usage: https://docs.docker.com/compose/how-tos/production/
- Docker Compose secrets: https://docs.docker.com/compose/how-tos/use-secrets/
- Docker build secrets: https://docs.docker.com/build/building/secrets/
- Caddy install docs: https://caddyserver.com/docs/install
- Caddy automatic HTTPS: https://caddyserver.com/docs/automatic-https
- Caddy reverse proxy quick start: https://caddyserver.com/docs/quick-starts/reverse-proxy
- Ubuntu OpenSSH server docs: https://ubuntu.com/server/docs/how-to/security/openssh-server/
- Ubuntu user management docs: https://ubuntu.com/server/docs/how-to/security/user-management/
- Ubuntu firewall docs: https://ubuntu.com/server/docs/how-to/security/firewalls/
- Ubuntu UFW help wiki: https://help.ubuntu.com/community/UFW
