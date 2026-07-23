# DESIGN.md — Architecture & System Design

Read this before modifying any structural code (schema, service boundaries, data flow). The goal is to prevent confidently rewriting logic that already has a reason behind it.

## System Overview

```
Client (PWA — React + Leaflet/MapLibre)
        │
        ▼
API Layer (FastAPI)
        │
        ├── PostGIS (Postgres) — canonical post + geo store, spatial queries
        ├── Qdrant — vector index for semantic search over post embeddings
        ├── Cloudflare R2 — image storage
        └── Gemini Flash — embedding generation, auto-tagging, grounded Q&A synthesis
```

## Component Responsibilities & Boundaries

### Client (PWA)
- React + Leaflet/MapLibre for map rendering.
- Owns: map interaction, post composition UI, viewport-based query triggering.
- Does **not** own: any business logic around trust scoring, post decay/archival, or moderation thresholds — those live server-side so they can't be bypassed by a modified client.

### API Layer (FastAPI)
- All writes (post creation, reports, edits) go through here — no direct client-to-DB access.
- Owns: request validation, auth (college-email verification), rate limiting, orchestration between PostGIS and Qdrant on write.

### PostGIS (Postgres) — source of truth
- Canonical store for posts, geo-coordinates, categories, timestamps, report counts.
- All spatial queries (radius search, bounding-box, clustering) happen here — this is what PostGIS is for. Do not reimplement spatial logic in application code.
- **Rule:** if PostGIS and Qdrant ever disagree, PostGIS wins. Qdrant is a derived/secondary index.

### Qdrant — derived index, not source of truth
- Stores embeddings of post content for semantic search.
- Rebuildable from PostGIS at any time — treat it as a cache/index, not as data that needs its own backup strategy independent of the source data.

### Gemini Flash — AI layer
- Three jobs only (per PRD FR9, intentionally capped): embedding generation, auto-tagging, and grounded Q&A synthesis.
- Grounded Q&A **must** cite source posts (FR10). If a code change would let the model answer without a citable source, that change is out of scope — flag it rather than shipping it.
- Do not expand AI scope (open-ended chat, city-wide summarization, predictive features) without an explicit product decision — this is a repeated point in the PRD because scope creep on the AI layer has been the recurring failure mode on this idea historically.

### Cloudflare R2
- Image storage only. Client uploads via signed URL, never routes image bytes through the API server unnecessarily.

## Data Model (high-level)

**Post**
- id, author_handle (pseudonymous), category (enum: Safety / Recommendation / Lost&Found / Event / General)
- geo-coordinates, GPS-verified flag (vs. manual pin)
- text (≤280 chars), optional image reference (R2 key)
- created_at, expires_at (nullable — Event/Lost&Found auto-archive at 7 days; Safety/Recommendation persist with rank decay)
- report_count

**User**
- id, college-email-verified flag, pseudonymous handle
- (no real name required or stored as primary identity — deliberate trust/adoption lever, see PRD FR12)

## Structural Rules (do not violate without explicit sign-off)

1. **Geo queries live in PostGIS**, not in application code or Qdrant. If you find yourself computing distance in Python/JS, stop — there's a PostGIS function for that.
2. **Precise poster GPS coordinates are never exposed to other users** (NFR3) — only the public pin location. Check any new endpoint against this before shipping.
3. **Single-region, campus-scoped v1.** Don't introduce multi-tenant/multi-city abstractions preemptively — YAGNI applies here specifically because premature generalization is a known risk for this project (see PRD "Risks").
4. **AI answers require grounding.** Any new AI-powered feature must follow the citation pattern already established for "ask the map" — no ungrounded generation shipped to users.
5. Folder/service boundaries above are the intended structure. If the actual repo has diverged, treat divergence as something to flag and reconcile, not to silently work around.

## Open Design Questions

- Migration tool choice (Alembic vs. other) not yet finalized — confirm before assuming in scripts.
- Whether Qdrant is self-hosted or managed cloud — confirm before assuming connection/auth pattern.
- Push notification architecture is explicitly deferred (PRD Section 12) — no design work here yet.
