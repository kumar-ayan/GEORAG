# TOOLS.md — Tool & Command Catalog

Index of everything the agent is permitted to invoke on this project. If a tool isn't listed here, don't reach for it silently — add it here first (with justification) or ask.

## Terminal / CLI

| Tool | Purpose | Notes |
|---|---|---|
| `uvicorn` | Run FastAPI dev server | `server/` directory |
| `pytest` | Run backend test suite | Required before any PR |
| `npm run dev` | Run frontend dev server | `client/` directory |
| `npm run build` | Production frontend build | Verify before deploy |
| `psql` | Direct PostGIS/Postgres access | Use for schema inspection; never run destructive queries (`DROP`, `DELETE` without `WHERE`) without explicit confirmation |
| `alembic` (or chosen migration tool) | DB schema migrations | One migration per schema change, never hand-edit prod schema |
| `docker compose` | Run local PostGIS for development/testing | Local-only dev service; do not use against production volumes without confirmation |

## Project Dependencies

| Dependency | Purpose | Notes |
|---|---|---|
| FastAPI | Backend API framework | Existing architecture choice in `DESIGN.md` |
| psycopg | PostgreSQL/PostGIS access from FastAPI and tests | Keeps spatial queries in PostGIS SQL |
| React + Vite | PWA frontend scaffold | PWA only; no native app tooling |
| Leaflet + react-leaflet | Map rendering and pin interaction | Client display layer only; canonical geo queries remain in PostGIS |

## APIs / External Services

| Service | Purpose | Auth notes |
|---|---|---|
| Gemini Flash API | Embedding generation, auto-tagging, grounded Q&A synthesis | API key via env var, never hardcoded |
| Qdrant | Vector search over post embeddings | Self-hosted or cloud instance — confirm which before assuming endpoint |
| Cloudflare R2 | Image storage for post attachments | Signed upload URLs only, never expose bucket credentials client-side |
| PostGIS (Postgres) | Canonical post + geo data store | Source of truth — Qdrant is a derived index, not the source of truth |

| OpenStreetMap tiles | Normal map base layer in local PWA | No credentials in code; keep usage modest for development |
| Esri World Imagery tiles | Satellite map base layer in local PWA | No credentials in code; review tile terms before production launch |

## MCP Integrations

None configured yet for this project. If MCP tooling is added (e.g., for deployment, monitoring, or issue tracking), list it here with:
- What it's used for
- What actions it's permitted to take autonomously vs. requiring confirmation

## Guardrails on Tool Use

- **Never** run destructive database operations without explicit user confirmation, even in a dev environment, unless the session has already established dev-DB-is-disposable.
- **Never** commit API keys, `.env` files, or credentials — check `.gitignore` covers them before any commit involving config files.
- Seeding-related scraping tools (see PRD FR14 — Reddit content seeding): **do not implement or run any scraping tooling until the legal/ToS review noted in the PRD is resolved.** This is an open risk, not a green light.
- Prefer read-only inspection commands first when debugging (`psql` read queries, log tailing) before reaching for anything that mutates state.

## Adding a New Tool

Before introducing a new dependency, CLI tool, or API integration:
1. Confirm it's actually needed (not just convenient).
2. Add an entry to the appropriate table above with purpose and auth notes.
3. Note any cost implications (relevant given India-first, cost-conscious infra approach per `DESIGN.md`).
