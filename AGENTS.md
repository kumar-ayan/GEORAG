# AGENTS.md — Workspace Rules & Orientation

Read this file first, every session, before touching code.

## Project Overview

**GeoRAG** is a hyperlocal, map-native community platform. Users pin posts (text + optional image) to real-world locations; an AI layer indexes posts into a queryable knowledge graph so users can ask location-scoped natural-language questions instead of scrolling a feed.

v1 scope is a **single-campus beachhead** (Punjabi University, Patiala) — not a general-purpose or multi-city app. See `USE-CASES.md` and the PRD for full requirements. Do not add multi-city, native app, monetization, or open-ended-chat features unless explicitly asked — these are deferred by design (see PRD Section 12), not oversights.

## Repo Orientation

- `/client` — PWA frontend (React + Leaflet/MapLibre)
- `/server` — FastAPI backend
- `/server/db` — PostGIS schema + migrations
- `/server/ai` — embedding, auto-tagging, and grounded-Q&A logic (Gemini Flash + Qdrant)
- `/infra` — deployment config (Hetzner target, India-first infra)

(Adjust paths above once the actual repo structure exists — this is the intended layout per `DESIGN.md`, not yet verified against disk.)

## Build & Run

```bash
# Backend
cd server && pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd client && npm install
npm run dev
```

(Fill in real commands once the project scaffold exists — do not assume these work without checking `package.json` / `requirements.txt` first.)

## Testing Requirements

- Every new API endpoint requires at least one test covering the happy path and one covering an invalid-geo-input case (e.g., out-of-range lat/lng).
- Spatial queries (radius search, clustering) must be tested against PostGIS directly, not mocked — geo bugs are easy to hide behind mocks.
- AI grounding (FR10 in PRD): any test touching the "ask the map" feature must assert that returned answers cite at least one source post. An answer with zero citations is a failing test, not a warning.
- Run the full test suite before any PR; do not merge on partial runs.

## Code Style

- Python (backend): follow PEP 8, type-hint all function signatures, prefer explicit over clever.
- TypeScript/React (frontend): functional components only, no class components; keep map-rendering logic separate from data-fetching hooks.
- Commit messages: short imperative summary line, e.g. `Add radius-based post query endpoint`.
- No commented-out dead code in commits — delete it, git history has it if needed.

## Working Agreement

- This is a solo-founder project. There is no second reviewer — be more conservative about irreversible changes (schema migrations, deletions) than you would be on a team with a safety net.
- When a requirement is ambiguous, check `USE-CASES.md` and the PRD before guessing. If still ambiguous, flag it rather than assuming scope.
- Before adding any new dependency, check `TOOLS.md` — if it's not listed, it needs to be added there, not silently introduced.
- Log any nontrivial technical decision or recurring bug to `MEMORY.md` at the end of the session — don't rely on this conversation being remembered next time.
"" 
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
