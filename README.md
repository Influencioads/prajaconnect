# Praja Connect CRM

A Docker-first, full-stack governance CRM for Andhra Pradesh political leaders, cadre, and government coordination — built as an npm-workspaces + Turborepo monorepo.

- **Web admin**: Next.js 15 (App Router) + TypeScript + TailwindCSS + Shadcn UI + Recharts
- **Mobile**: React Native (Expo) + TypeScript + NativeWind
- **API**: NestJS + Prisma + PostgreSQL + JWT + Redis
- **Infra**: Docker Compose (postgres, redis, api, web, adminer)

## Repository structure

```
praja-connect-crm/
  apps/
    web/      Next.js admin dashboard
    mobile/   Expo mobile app (runs on host)
    api/      NestJS REST API (/api)
  packages/
    types/    shared enums + DTO types  (@praja/types)
    ui/       shared web components       (@praja/ui)
    config/   tailwind preset + tokens    (@praja/config)
  database/   Prisma schema, migrations, seed  (@praja/database)
  docker/     per-service Dockerfiles + entrypoint
  docker-compose.yml
  legacy/     archived first-iteration code (reference only)
```

## Prerequisites

- Docker Desktop (running)
- Node.js 20+ and npm 10+ (for mobile + host-side Prisma commands)

## Quick start (Docker)

```bash
cp .env.example .env          # adjust secrets if needed
docker compose up --build     # starts postgres, redis, api, web, adminer
```

The API container automatically applies the Prisma schema and seeds the database on boot.

| Service      | URL                              |
| ------------ | -------------------------------- |
| Web admin    | http://localhost:3000            |
| API          | http://localhost:4000/api        |
| API health   | http://localhost:4000/api/health |
| Adminer      | http://localhost:8080            |

Adminer login → System: `PostgreSQL`, Server: `postgres`, User: `praja`, Password: `praja123`, Database: `prajaconnect`.

## Database commands

Run inside the api container (recommended) or from `database/` on the host (uses `localhost`).

```bash
# Inside Docker
docker compose exec api npm run db:migrate -w @praja/database
docker compose exec api npm run db:seed -w @praja/database

# From host (needs postgres port 5432 exposed)
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Mobile (Expo, on host)

```bash
cd apps/mobile
npm install            # if not already installed at root
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `.env` to your machine's LAN IP (e.g. `http://192.168.1.50:4000/api`) so a physical device can reach the Docker API.

## Local development without Docker

```bash
npm install
npm run db:generate
docker compose up -d postgres redis   # still need a database
npm run dev                            # runs web + api via Turborepo
```

## Demo accounts

All demo accounts use password **`Praja@123`**.

| Role                 | Email                  |
| -------------------- | ---------------------- |
| Super Admin          | admin@praja.in         |
| State Leader         | state@praja.in         |
| District Leader      | district@praja.in      |
| Constituency Incharge| leader@praja.in        |
| Mandal Coordinator   | mandal@praja.in        |
| Booth Coordinator    | booth@praja.in         |
| Volunteer            | volunteer@praja.in     |
| Government Official   | official@praja.in      |
| Citizen              | citizen@praja.in       |

## Features

- **Auth & RBAC**: JWT access/refresh tokens, 9 roles, module-level access control (`view`/`edit`/`full`).
- **Executive dashboard**: live KPIs, mandal & grievance charts, recent activity.
- **CRM**: cadre hierarchy + booth mapping, citizen master with family/voter data.
- **Grievances**: status workflow, department/official assignment, SLA, geo, feedback.
- **Service delivery**: officials directory, escalation matrix, schemes, beneficiaries, eligibility checker.
- **Engagement**: WhatsApp inbox, events + QR check-in, surveys, GIS map (Leaflet), development projects.
- **Intelligence**: rule-based AI Command Center (health, readiness, sentiment, risk alerts, daily briefing) and Reports with CSV export.
- **Mobile**: Expo app for login, dashboard, directory, grievances, eligibility, events, notifications, profile.

## Production hardening

- Security response headers (nosniff, frame-deny, referrer-policy, permissions-policy; `X-Powered-By` removed).
- Per-IP fixed-window rate limiting (`RATE_LIMIT_*`).
- Request logging (method, path, status, latency, user) and an audit trail persisted to `AuditLog` for logins and all mutations.
- Healthchecks on postgres, redis, api (`/api/health`), and web; `depends_on` gating on healthy dependencies.
- Global validation (`whitelist` + `transform`) and typed DTOs via `class-validator`.

### Production deployment notes

1. Copy `.env.example` to `.env` and replace **all** secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD`).
2. Set `NODE_ENV=production` and a real `CORS_ORIGIN` (your web domain).
3. Migrations: the api entrypoint runs `prisma migrate deploy` when migrations exist (falls back to `db push` for a fresh schema). Commit migrations with `npm run db:migrate -w @praja/database`.
4. Put the API and web behind a TLS-terminating reverse proxy; the rate limiter trusts `X-Forwarded-For`.
5. Back up the `pgdata` volume; scale the API behind a shared Redis before running multiple instances (swap the in-memory rate limiter for a Redis-backed one).

> If host port 3000 is already in use, start the web on another port: `WEB_PORT=3001 docker compose up` (and add it to `CORS_ORIGIN`).

## Tech notes

- Shared types are compiled (`@praja/types` → `dist`) and consumed by both web and api.
- WhatsApp, AI/LLM, push, PDF export, and QR check-in are stubbed behind interfaces; persistence and UI are real.
- AI scores are rule-based aggregations over live data (no external LLM).
