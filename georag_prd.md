# GeoRAG — Product Requirements Document

**Author:** Ayan Kumar
**Status:** Draft v1.0
**Doc type:** PRD (Product + Technical)
**Last updated:** July 23, 2026

---

## 1. Summary

GeoRAG is a hyperlocal, map-native community platform. Instead of a text feed, users post content pinned to physical locations — sightings, warnings, recommendations, questions, events — and an AI layer indexes those posts into a queryable knowledge graph, so users can ask location-scoped natural-language questions ("where's safe to walk alone at night near campus?") instead of scrolling.

We are launching a single-campus beachhead (Punjabi University, Patiala) as v1, not a general-purpose app, to solve cold start and prove retention before expanding.

---

## 2. Problem Statement

- Hyperlocal information (safety, recommendations, lost/found, events) currently lives in text-only, non-spatial feeds (Reddit, WhatsApp groups, Facebook groups) where relevance to *your* location is implicit and hard to filter.
- Google Maps has reviews and static business data but no real-time, community-generated, ephemeral posts layer.
- Reddit-style hyperlocal subreddits have community but no spatial structure — a post about a street two towns over looks identical to one about your building.
- No existing product combines: (a) spatial anchoring of posts, (b) community-generated real-time content, and (c) AI-queryable retrieval over that content.

## 3. Goals

### 3.1 Product goals (v1 — campus beachhead)
- G1: Ship a working PWA where students at one campus can create and view location-pinned posts.
- G2: Achieve meaningful Day-7 retention (target: **≥25%** of Week-1 signups return in Week 2) before any expansion decision.
- G3: Reach a critical mass of ~150–300 active weekly posters at the beachhead campus within 8 weeks of launch.
- G4: Validate that AI query ("ask the map") layer is used organically, not just posting/browsing.

### 3.2 Non-goals (explicitly out of scope for v1)
- Multi-city or multi-campus support.
- Native mobile apps (iOS/Android) — PWA only.
- Full social graph (follows, DMs, profiles beyond minimal identity).
- Monetization / ads.
- B2B data product (tracked as a future workstream, not v1).

## 4. Success Metrics

| Metric | Definition | Target (Week 8) |
|---|---|---|
| WAU | Weekly active users at beachhead campus | 300+ |
| Day-7 retention | % of new signups posting/viewing again by day 7 | ≥25% |
| Posts/week | New location-pinned posts | 150+ |
| AI query usage | % of sessions using "ask the map" | ≥15% |
| GPS-verified post rate | % of posts with verified location (not manual pin) | ≥70% |
| Time-to-first-post | Median time from signup to first post | <5 min |

## 5. User Personas

1. **The Poster** — a student who sees something worth sharing (lost item, event, warning, recommendation) and wants it visible to people physically nearby, not the internet at large.
2. **The Lurker/Searcher** — a student who opens the app to answer a specific spatial question ("good food near hostel," "is this area safe at night") without posting anything themselves.
3. **The Ambassador** (growth role, not a persona to design for directly) — early power users seeded to bootstrap content density.

## 6. Core User Flows

### 6.1 Create a pinned post
1. User opens app → taps "+"
2. App requests GPS location (fallback: manual pin drop on map)
3. User writes short text (280 char cap v1), optionally attaches 1 image
4. User selects a category tag (Safety / Recommendation / Lost&Found / Event / General)
5. Post is geo-tagged, timestamped, and appears on map for nearby users within a visibility radius (default 2km, configurable)

### 6.2 Browse the map
1. User opens app → default view is map centered on their current location
2. Pins are clustered at zoomed-out levels, expand on zoom-in
3. Tapping a pin opens a card with post content, category, timestamp, upvote/relevance signal

### 6.3 Ask the map (AI query)
1. User taps search/ask bar
2. Types a natural-language question scoped implicitly to their current map viewport
3. Backend retrieves relevant posts via vector search (Qdrant) + recency/proximity re-ranking
4. Gemini Flash synthesizes a grounded answer citing the underlying posts (not hallucinated)
5. User can tap through to source posts

## 7. Functional Requirements

### 7.1 Posting
- FR1: Posts MUST be geo-tagged via device GPS by default; manual pin placement is a fallback, flagged differently (lower trust weight) from GPS-verified posts.
- FR2: Posts support text (280 char max v1) + optional single image (max 5MB, compressed client-side before upload).
- FR3: Posts MUST have a category from a fixed taxonomy (v1: Safety, Recommendation, Lost&Found, Event, General).
- FR4: Posts have a default expiry/decay: Event and Lost&Found posts auto-archive after 7 days; Safety and Recommendation persist indefinitely but decay in ranking over time.
- FR5: Users can report a post; 3+ reports auto-hides pending review.

### 7.2 Map & Discovery
- FR6: Default map view centers on user's current GPS location at a configurable default zoom.
- FR7: Pins cluster below a zoom threshold to avoid clutter; cluster count shown on tap.
- FR8: Visibility radius for new posts defaults to 2km, adjustable per user session (not per-post).

### 7.3 AI Knowledge Layer (v1 scope — intentionally minimal)
- FR9: v1 AI capability is limited to two functions only: **(a) semantic search over posts in current viewport**, and **(b) auto-tagging** of post category if user doesn't select one. No open-ended chat, no summarization across the whole city, no predictive features in v1 — this scope limit is intentional (see Section 10, Risks).
- FR10: AI answers must cite the specific posts used to generate them; no answer without at least one grounding source.

### 7.4 Identity & Trust
- FR11: Signup requires college email verification (.ac.in / university domain) for the beachhead campus to establish trust and prevent outside spam.
- FR12: Posts can be made under a persistent pseudonymous handle (not real name) by default — this is a deliberate safety/adoption lever, especially for Safety-category posts.
- FR13: GPS-verified posts are visually distinguished from manually-pinned posts in the UI (trust signal).

### 7.5 Seeding (cold start)
- FR14: Pre-launch, seed the map with location-taggable content scraped/adapted from relevant local subreddits to avoid an empty-map first impression. (Compliance note: must respect Reddit's API ToS and content licensing — legal review required before implementation, see open questions.)
- FR15: Recruit 10–15 "ambassador" users pre-launch to seed the first 2 weeks of organic content.

## 8. Non-Functional Requirements

- NFR1: **Performance** — map pin load for a given viewport must return in <500ms p95 at up to 5,000 pins in the region.
- NFR2: **Availability** — 99.5% uptime target for v1 (single-region, not mission-critical yet).
- NFR3: **Privacy** — precise GPS coordinates of a poster are never exposed to other users; only the pin's public location is shown, decoupled from any device-identifying data.
- NFR4: **Data residency** — India-first infra; hosting decisions (e.g., Hetzner) should keep latency low for the target region and be cost-efficient at pre-revenue stage.
- NFR5: **Offline/low-connectivity tolerance** — PWA should gracefully degrade (cached map tiles, queued posts) given variable campus wifi/mobile data.
- NFR6: **Accessibility** — minimum WCAG AA for core flows (posting, browsing, search).

## 9. System Architecture (proposed)

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

- **Why PostGIS over pure vector-only store:** geo-radius and bounding-box queries are relational/spatial operations PostGIS is purpose-built for; Qdrant is used specifically for semantic similarity, not as the primary source of truth.
- **Why PWA over native v1:** faster iteration, no app-store approval cycle, single codebase — appropriate given we're validating retention, not scaling yet.
- **Tile serving:** self-hosted PMTiles to control cost at low volume rather than paying per-load map SDK fees at an unvalidated stage.

## 10. Risks & Open Questions

| Risk | Mitigation / Note |
|---|---|
| Cold start — empty map kills first impression | Ambassador seeding + legally-reviewed content seeding pre-launch |
| Safety-category misuse (false reports, harassment) | Pseudonymous but verified-email identity; report/hide threshold; category-specific moderation review |
| Reddit content seeding — ToS/licensing risk | **Open question — needs legal review before FR14 is implemented as scraping vs. manual curation** |
| No moat vs. Google Maps adding a similar layer | Beachhead + community trust + eventual proprietary hyperlocal dataset is the differentiation bet, not technology alone |
| AI scope creep | FR9 deliberately caps v1 AI to two functions; resist adding open-ended chat until core loop (post → discover) proves retention |
| GPS spoofing / fake locations | v1 accepts this risk at small scale; flagged as a v2 hardening item (e.g., device attestation) if abuse observed |

## 11. Rollout Plan

1. **Weeks 1–2 (pre-launch):** Seed content, recruit ambassadors, legal review of seeding approach.
2. **Weeks 3–4:** Soft launch to a subset of campus (e.g., one hostel block / one department) for initial bug/UX feedback.
3. **Weeks 5–8:** Full campus launch, track Section 4 metrics weekly.
4. **Week 8 decision gate:** If Day-7 retention target is not met, do not expand — revisit core loop before considering a second campus.

## 12. Out of Scope / Explicitly Deferred

- B2B/data licensing product
- Monetization
- Multi-city expansion
- Native apps
- Open-ended AI chat / city-wide summarization
- Push notifications (evaluate post-launch based on engagement data, not assumed at v1)

---

*This PRD intentionally scopes v1 down to a single campus and a minimal AI feature set. The primary risk to this project historically has not been technical feasibility — it's scope creep and stalled execution. Every deferred item in Section 12 is deferred on purpose.*
