#!/bin/bash
set -e

cd /app
git pull origin main

cd /app/backend
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

cd /app/frontend
npm install
npm run build

pm2 reload all
echo "Deployment complete!"
