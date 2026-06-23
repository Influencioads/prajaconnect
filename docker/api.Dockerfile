# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

# Prisma needs openssl
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY database/package.json ./database/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/

RUN npm install --legacy-peer-deps

# Copy source
COPY database ./database
COPY packages ./packages
COPY apps/api ./apps/api

# Generate Prisma client, then build shared packages the API depends on
RUN npm run db:generate \
  && npm run build -w @praja/types \
  && npm run build -w @praja/database

EXPOSE 4000

COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh
RUN chmod +x /usr/local/bin/api-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/api-entrypoint.sh"]
