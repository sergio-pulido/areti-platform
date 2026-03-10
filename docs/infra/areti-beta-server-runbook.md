# Simple Single-Server Production Runbook

Reusable runbook for small/private beta deployments of web + API apps on one Ubuntu server using Docker Compose and Caddy.

## Scope

This guide is for:
- 1 Ubuntu server
- 1 web app
- 1 API
- 1 reverse proxy (Caddy)
- file-based secrets on the host
- small private beta / low traffic / founder-led product validation

This is **not** a high-availability setup.

## Target hostname pattern

- `yourdomain.com` → marketing/public site (optional)
- `my.yourdomain.com` → authenticated product
- `api.yourdomain.com` → API

## Assumptions

- You already created the server in Hetzner.
- Your SSH public key was added during provisioning.
- Server OS is Ubuntu 24.04 LTS or 22.04 LTS.
- You control DNS for the domain/subdomains.
- You have your app code in Git.

---

## 0. Variables used in this guide

Replace these values before executing commands:

- `DEPLOY_USER=deployer`
- `APP_NAME=areti`
- `APP_DIR=/opt/areti`
- `GIT_REPO=git@github.com:YOUR_USER/YOUR_REPO.git`
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

---

## 2. Create non-root deployment user

Create a dedicated sudo user:

```bash
adduser deployer
usermod -aG sudo deployer
```

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

Ubuntu documents OpenSSH configuration in `/etc/ssh/sshd_config` and modular snippets in `/etc/ssh/sshd_config.d/`.

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

Validate config:

```bash
sshd -t
```

Reload SSH:

```bash
systemctl reload ssh
```

Do **not** close your current root session until you verify that `ssh deployer@YOUR_SERVER_IP` still works.

Optionally lock root password:

```bash
passwd -l root
```

---

## 4. Configure firewall

Ubuntu recommends `ufw` as the standard host firewall tool.

Allow SSH, HTTP, HTTPS:

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status verbose
```

If you changed SSH port, allow that instead of `22/tcp`.

---

## 5. Enable basic brute-force protection

Enable and start fail2ban:

```bash
systemctl enable fail2ban
systemctl start fail2ban
systemctl status fail2ban --no-pager
```

Create minimal local jail config:

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

Restart fail2ban:

```bash
systemctl restart fail2ban
fail2ban-client status sshd
```

---

## 6. Install Docker Engine and Compose plugin

Docker’s official Ubuntu docs recommend removing conflicting unofficial packages first, then installing from Docker’s repository.

Remove conflicting packages if present:

```bash
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do apt remove -y $pkg; done
```

Set up Docker repository:

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu   $(. /etc/os-release && echo "$VERSION_CODENAME") stable" |   tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
```

Install Docker Engine + Compose plugin:

```bash
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Enable Docker:

```bash
systemctl enable docker
systemctl start docker
systemctl status docker --no-pager
```

Allow deploy user to run Docker without sudo:

```bash
usermod -aG docker deployer
```

Verify:

```bash
docker --version
docker compose version
```

Log out and back in as `deployer` so group membership applies.

---

## 7. Create app directory structure

As root:

```bash
mkdir -p /opt/areti/{config/caddy,data/caddy,data/sqlite,data/uploads,backups,scripts,secrets,logs}
chown -R deployer:deployer /opt/areti
chmod 755 /opt/areti
chmod 700 /opt/areti/secrets
```

Recommended final structure:

```text
/opt/areti/
  repo/
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
```

---

## 8. Prepare Git access for deployer

Switch to deploy user:

```bash
su - deployer
```

Generate a dedicated SSH key for Git deploys (recommended):

```bash
ssh-keygen -t ed25519 -C "deployer@areti-prod" -f ~/.ssh/id_ed25519_github
chmod 600 ~/.ssh/id_ed25519_github
```

Create SSH config:

```bash
cat > ~/.ssh/config <<'EOFSSH'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
EOFSSH
chmod 600 ~/.ssh/config
```

Print the public key and add it to GitHub deploy keys or your account:

```bash
cat ~/.ssh/id_ed25519_github.pub
```

Test once the key is added:

```bash
ssh -T git@github.com
```

If your repo is private, add this key as a deploy key with read access, or use a machine user.

---

## 9. Clone the repository

As `deployer`:

```bash
cd /opt/areti
git clone git@github.com:YOUR_USER/YOUR_REPO.git repo
cd repo
git checkout main
```

For future deploys:

```bash
cd /opt/areti/repo
git fetch origin
git checkout main
git pull --ff-only origin main
```

---

## 10. Create production compose files

You can either keep production files inside the repo or symlink them from `/opt/areti`.

Recommended approach: keep them in `/opt/areti` so they are host-owned deployment config.

### `/opt/areti/compose.yaml`

```yaml
services:
  web:
    build:
      context: ./repo
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
      context: ./repo
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

### `/opt/areti/compose.production.yaml`

```yaml
services:
  web:
    environment:
      NODE_ENV: production

  api:
    environment:
      NODE_ENV: production
```

Adjust internal ports if your web/API use different container ports.

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

If your frontend proxies API calls internally and you do not need a public API hostname, you can omit the second site block.

---

## 12. Create `.env`

Create `/opt/areti/.env`:

```env
NODE_ENV=production
TZ=Europe/Madrid

APP_NAME=areti
APP_URL=https://my.areti.app
API_URL=https://api.areti.app
PUBLIC_APP_URL=https://my.areti.app
PUBLIC_API_URL=https://api.areti.app

# App-specific non-secret config only below
FEATURE_SIGNUP_ENABLED=false
FEATURE_BETA_INVITES_ONLY=true
POSTHOG_HOST=https://eu.i.posthog.com
POSTHOG_PUBLIC_KEY=REPLACE_ME
```

Do **not** put secrets here if you can avoid it.

Protect file permissions:

```bash
chmod 600 /opt/areti/.env
```

---

## 13. Create runtime secret files

Create files in `/opt/areti/secrets`:

```bash
printf 'replace_me_with_real_secret' > /opt/areti/secrets/nextauth_secret.txt
printf 'replace_me_with_real_secret' > /opt/areti/secrets/jwt_secret.txt
printf 'replace_me_with_real_secret' > /opt/areti/secrets/openai_api_key.txt
printf 'replace_me_with_real_secret' > /opt/areti/secrets/resend_api_key.txt
chmod 600 /opt/areti/secrets/*
```

If your app can read secrets from files under `/run/secrets`, define Compose secrets and mount them into the corresponding service.

Example Compose fragment:

```yaml
services:
  web:
    secrets:
      - nextauth_secret

  api:
    secrets:
      - jwt_secret
      - openai_api_key
      - resend_api_key

secrets:
  nextauth_secret:
    file: ./secrets/nextauth_secret.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  openai_api_key:
    file: ./secrets/openai_api_key.txt
  resend_api_key:
    file: ./secrets/resend_api_key.txt
```

Then make your app read either environment variables or `/run/secrets/<name>`.

---

## 14. Point DNS before first launch

In your DNS provider, create:

- `A my.areti.app -> YOUR_SERVER_IP`
- `A api.areti.app -> YOUR_SERVER_IP`

Wait until DNS resolves from your machine:

```bash
dig +short my.areti.app
dig +short api.areti.app
```

Do not expect Caddy to get certificates if DNS is wrong or ports 80/443 are blocked.

---

## 15. First build and start

As `deployer`:

```bash
cd /opt/areti
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

### Standard redeploy

```bash
cd /opt/areti/repo
git fetch origin
git checkout main
git pull --ff-only origin main
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml up -d --build
```

### Redeploy only web

```bash
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml build web
docker compose -f compose.yaml -f compose.production.yaml up -d --no-deps web
```

### Redeploy only api

```bash
cd /opt/areti
docker compose -f compose.yaml -f compose.production.yaml build api
docker compose -f compose.yaml -f compose.production.yaml up -d --no-deps api
```

---

## 17. Backups

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

Add cron job as root:

```bash
crontab -e
```

Add:

```cron
0 3 * * * /opt/areti/scripts/backup-db.sh >/dev/null 2>&1
```

Also plan off-server backups later. If backups live only on the same server, you are one disk failure away from regret.

---

## 18. Optional system cleanup and maintenance

Show disk usage:

```bash
df -h
du -sh /opt/areti/*
```

Prune old Docker build cache occasionally:

```bash
docker system df
docker image prune -a
```

Do **not** run broad prune commands casually on a server you do not fully understand.

---

## 19. PostHog for beta analytics

Recommended minimal setup:
- project in PostHog Cloud EU
- web SDK in frontend
- server-side capture for key backend events if needed
- no more than 10–15 core events initially

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

Avoid tracking dozens of vanity events. Track only what answers product questions.

---

## 20. Beta access model

Recommended for this phase:
- keep public signup disabled
- invite-only access
- admin can generate invite links or create users manually
- email invitation with tokenized link
- expiry time on invites
- track `invite_sent`, `invite_opened`, `invite_accepted`

This is better than a public signup + hidden whitelist mess.

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

At least once, test restore on a copy:

```bash
cp /opt/areti/backups/prod_YYYY-MM-DD_HH-MM-SS.db.gz /tmp/
gunzip /tmp/prod_YYYY-MM-DD_HH-MM-SS.db.gz
ls -lah /tmp/prod_YYYY-MM-DD_HH-MM-SS.db
```

A backup you never tested is just optimism in a file extension.

---

## 23. Reuse this for other similar projects

For another small app, change only:
- app directory (`/opt/projectname`)
- hostnames (`my.project.com`, `api.project.com`)
- repo URL and branch
- Dockerfiles / service names / ports
- `.env` and secrets list

Keep the rest identical.

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
