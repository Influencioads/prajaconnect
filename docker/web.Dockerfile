# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
# @praja/types compiles itself in a `prepare` script, which npm runs during
# install — so its source must be present before npm install, not after.
COPY packages ./packages

RUN npm install --legacy-peer-deps

COPY apps/web ./apps/web

# Build shared types consumed by the web app
RUN npm run build -w @praja/types

EXPOSE 3000

CMD ["npm", "run", "dev", "-w", "@praja/web"]
