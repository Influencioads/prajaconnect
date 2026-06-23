#!/bin/sh
set -e

echo "[api] Regenerating Prisma client + building shared packages (keeps schema in sync in dev)..."
cd /app
npm run db:generate
npm run build -w @praja/types
npm run build -w @praja/database

echo "[api] Applying database schema..."
cd /app/database
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null | grep -v migration_lock.toml || true)" ]; then
  npx prisma migrate deploy || npx prisma db push --accept-data-loss
else
  npx prisma db push --accept-data-loss
fi

echo "[api] Seeding database (idempotent)..."
npm run db:seed || echo "[api] Seed skipped or already applied"

cd /app
echo "[api] Starting NestJS (dev watch)..."
exec npm run dev -w @praja/api
