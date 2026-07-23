# USE-CASES.md — Product & Domain Knowledge

This file anchors implementation decisions to actual business/product reality. When a technical choice has a product tradeoff, check here before deciding unilaterally.

## Product Summary

GeoRAG: a hyperlocal, map-native community platform. Users pin posts to real-world locations instead of posting into a generic feed. An AI layer lets users query the map in natural language ("where's safe to walk alone at night near campus?") grounded in actual nearby posts.

**v1 is a single-campus beachhead** (Punjabi University, Patiala), deliberately narrow in scope to solve cold-start and prove retention before any expansion. This project has a history of over-scoping and stalling (see "Project History" below) — treat narrow v1 scope as a feature, not a limitation to work around.

## Personas

1. **The Poster** — sees something worth sharing locally (lost item, safety concern, event, recommendation) and wants it visible to people physically nearby, not broadcast to the whole internet.
2. **The Lurker/Searcher** — opens the app to answer a specific spatial question without necessarily posting anything themselves. This is the persona the AI query feature primarily serves.
3. **The Ambassador** — early power user, recruited pre-launch specifically to seed content density and avoid an empty-map first impression. Not a persona to design permanent product surface for — a growth/bootstrapping role.

## Core Use Cases

| Use case | Priority | Notes |
|---|---|---|
| Pin a post to a location | P0 | Core loop — must work reliably before anything else |
| Browse nearby pins on map | P0 | Default view on app open |
| Ask the map (AI semantic query) | P0 | Differentiator vs. plain map or plain feed — but scope capped, see below |
| Report/hide a bad post | P1 | Trust & safety, needed before public launch |
| Auto-archive Event/Lost&Found posts | P1 | Keeps map from becoming stale clutter |
| Category-based filtering | P2 | Nice-to-have once volume justifies it |

## Explicit AI Scope Boundary

The AI layer is intentionally limited to two functions in v1:
1. Semantic search over posts in the current map viewport
2. Auto-tagging of post category when the user doesn't select one

**Do not build**: open-ended chat, city-wide summarization, predictive/forecasting features, or anything beyond these two functions — this is a repeated, deliberate constraint (see PRD Section 10, "AI scope creep" risk). If a feature request seems to expand this, flag it as a scope decision rather than implementing it.

## Success Criteria (business-level, not just technical)

- Day-7 retention ≥25% at the beachhead campus — this is the gate for any further investment or expansion. Building more features before this is validated is treating the wrong problem as urgent.
- 150+ posts/week and 300+ WAU by week 8.
- Expansion to a second campus is **not** greenlit until the Week-8 retention gate is met — do not build multi-campus infrastructure preemptively.

## Trust & Safety Context

- Users are pseudonymous by default (not real-name), which is a deliberate adoption/safety lever, especially for Safety-category posts about specific locations or incidents.
- College-email verification is the anti-spam/anti-outsider gate for the beachhead campus, not a KYC or identity system — don't over-build this into something heavier than it needs to be for v1.

## Project History (context for why scope discipline matters here)

This idea has been pitched publicly before (as "World-Layer," ~6 months prior) with a similar maps + community concept, and stalled without shipping. The current PRD and this scope discipline exist specifically to break that pattern — treat aggressive scope-cutting requests from the founder as intentional, not as underselling the vision.

## Monetization / B2B (deferred, not designed against yet)

Long-term, the location-tagged dataset itself (not the app) is the intended differentiation/moat — potential future B2B use cases around hyperlocal data. This is explicitly out of scope for v1 implementation; do not build data-export or B2B-facing features until this becomes an active workstream.
