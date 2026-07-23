# MEMORY.md — Long-Term Memory

A self-compressing scratchpad. Append entries at the end of each session — technical decisions made, bugs hit and their root cause, and anything a future session shouldn't have to rediscover from scratch. Keep entries short. When this file gets long, compress older entries into a summary rather than deleting them outright — the goal is not to repeat past mistakes, not to keep a full transcript.

## How to use this file

- **Decisions log**: one line per nontrivial decision, with the "why," not just the "what."
- **Recurring bugs**: pattern-level notes, not one-off stack traces — if something is likely to bite again, note the root cause and the fix.
- **Do NOT** log routine work (a normal feature shipped with no surprises). Log the things that would otherwise be re-litigated or re-discovered.

---

## Decisions Log

- **[Project start]** v1 scope locked to single-campus beachhead (Punjabi University). Rationale: this idea previously stalled as "World-Layer" when scoped too broadly (multi-city, full social graph, heavy AI). Narrow scope is a deliberate corrective, not a limitation — do not relitigate this without a explicit product decision.
- **[Architecture]** PostGIS is source of truth for post/geo data; Qdrant is a derived, rebuildable index for semantic search only. Do not let Qdrant become a second source of truth — if the two ever disagree, PostGIS wins.
- **[AI scope]** v1 AI capability capped at two functions: semantic search + auto-tagging. Grounded Q&A must always cite source posts (no ungrounded generation). This cap exists because AI scope creep is called out as a specific historical risk for this project.
- **[Identity]** Users are pseudonymous by default; college-email verification is anti-spam only, not a full identity/KYC system. Real names are not stored as primary identity.
- **[Infra]** India-first, cost-conscious infra choices (e.g., Hetzner, self-hosted PMTiles) — this is a pre-revenue, solo-founder project; do not introduce infra costs that assume funded/scaled usage.

## Recurring Bugs / Gotchas

_(none logged yet — add entries here as they're discovered, in the form: symptom → root cause → fix/avoidance)_

## Open Risks Carried Forward

- Reddit content seeding (PRD FR14) has an unresolved legal/ToS question. Do not implement scraping tooling until this is explicitly resolved — see `TOOLS.md` guardrails.
- GPS spoofing at small scale is an accepted v1 risk, not yet mitigated. Revisit if abuse is observed (flagged as a v2 hardening item).

## Session Log Template

Copy this at the end of each work session and fill in:

```
### [Date] — [Session summary in ~1 line]
- Decisions made:
- Bugs hit / root causes:
- Anything flagged for next session:
```

### 2026-07-23 — Scaffolded P0 post-to-map loop
- Decisions made: Used FastAPI + psycopg with explicit PostGIS SQL for post creation and nearby-pin lookup; kept Qdrant/Gemini/auth/moderation out of scope. Added frontend-only Leaflet clustering for display below zoom threshold while keeping canonical spatial filtering in PostGIS.
- Bugs hit / root causes: Local Docker/PostGIS is not installed or not on PATH, so the real PostGIS happy-path integration test could not run here. Vite dev server needed elevated execution because the sandbox blocked temporary config writes.
- Anything flagged for next session: Run `GEORAG_TEST_DATABASE_URL=... pytest` against a real PostGIS test DB before treating backend storage/query behavior as fully verified. npm install reported 1 moderate and 1 high audit finding; do not run `npm audit fix --force` without checking for breaking dependency changes.

### 2026-07-23 — Geolocked map to Punjabi University
- Decisions made: Added a single-campus bounding box in both client and backend so pins/query centers outside Punjabi University, Patiala are rejected or clamped; added normal/satellite base layers without expanding beyond the P0 map-browse loop.
- Bugs hit / root causes: No authoritative campus boundary polygon was available in-repo, so the perimeter is an approximate bounding box around public Punjabi University coordinate references.
- Anything flagged for next session: Replace the bounding box with an official campus polygon if available; keep the same backend validation so the client is not the only enforcement layer.
- Follow-up: Leaflet now computes the minimum zoom from the campus bounds and viewport size so users cannot zoom out beyond the Punjabi University perimeter.
