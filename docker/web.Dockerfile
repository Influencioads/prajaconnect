# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/

RUN npm install --legacy-peer-deps

COPY packages ./packages
COPY apps/web ./apps/web

# Build shared types consumed by the web app
RUN npm run build -w @praja/types

EXPOSE 3000

CMD ["npm", "run", "dev", "-w", "@praja/web"]
