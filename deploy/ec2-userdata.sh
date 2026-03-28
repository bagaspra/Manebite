#!/bin/bash
set -e
exec > /var/log/userdata.log 2>&1

# ── 1. Update packages ────────────────────────────────────────────────────────
apt-get update -y
apt-get upgrade -y

# ── 2. Node.js 20 via NodeSource ──────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# ── 3. Python 3.12 + pip + venv ───────────────────────────────────────────────
apt-get install -y python3.12 python3.12-venv python3-pip

# ── 4. PM2 ────────────────────────────────────────────────────────────────────
npm install -g pm2

# ── 5. yt-dlp ─────────────────────────────────────────────────────────────────
pip install yt-dlp

# ── 6. nginx ──────────────────────────────────────────────────────────────────
apt-get install -y nginx

# ── 7. Clone repo ─────────────────────────────────────────────────────────────
git clone https://github.com/bagaspra/Manebite.git /app
cd /app

# ── 8. Backend setup ──────────────────────────────────────────────────────────
cd /app/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy env file (must be created separately — see aws-setup-guide.md STEP 8)
# cp /tmp/backend.env /app/backend/.env

# Run database migrations
# alembic upgrade head

# ── 9. Frontend setup ─────────────────────────────────────────────────────────
cd /app/frontend
npm install
npm run build

# ── 10. PM2 startup ───────────────────────────────────────────────────────────
cd /app
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash

# ── 11. nginx config ──────────────────────────────────────────────────────────
cp /app/deploy/nginx.conf /etc/nginx/sites-available/shadowing-queue
ln -sf /etc/nginx/sites-available/shadowing-queue /etc/nginx/sites-enabled/shadowing-queue
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "✓ EC2 userdata complete"
