# SKILLS.md — Reusable Procedures

Step-by-step playbooks for recurring tasks on this project. Check here before improvising a process from scratch — consistency across sessions matters more than any single session's cleverness. If you do a task that doesn't have a skill entry and you expect to repeat it, add one at the end of the session.

---

## Skill: Add a new spatial API endpoint

1. Confirm the query pattern belongs in PostGIS, not application code (per `DESIGN.md` rule 1 — geo math lives in the DB layer).
2. Write the endpoint in `/server` following existing FastAPI route conventions.
3. Validate lat/lng bounds server-side before querying (reject out-of-range input, don't trust the client).
4. Add a happy-path test and an invalid-geo-input test (per `AGENTS.md` testing requirements) — this is non-negotiable, not a "nice to have."
5. If the endpoint returns poster location data, verify precise GPS is never included in the response — only the public pin (NFR3 in the PRD).
6. Log the decision in `MEMORY.md` if the endpoint involved any non-obvious tradeoff (e.g., radius default, clustering threshold).

## Skill: Add a new post category

1. Check `USE-CASES.md` — confirm this is an actual product need, not a nice-to-have slipping in scope.
2. Update the category enum in the PostGIS schema (migration required — never hand-edit the enum in prod).
3. Update auto-tagging logic (Gemini Flash prompt/config) so the new category is a valid classification target.
4. Update client-side category picker UI.
5. Decide and document expiry/decay behavior for the new category (does it auto-archive like Event/Lost&Found, or persist with rank decay like Safety/Recommendation?) — this must be explicit, not left to default behavior by accident.

## Skill: Build or modify a grounded AI feature

1. Re-read PRD FR9/FR10 and `DESIGN.md`'s AI section before starting — the AI scope cap (semantic search + auto-tagging only) is deliberate, not a placeholder.
2. Any new AI-generated output shown to a user must cite the specific source post(s) it's grounded in.
3. Write a test asserting citation presence — an answer with zero citations must fail the test, not just log a warning.
4. If the feature request would expand AI scope beyond the two capped functions, stop and flag this as a scope decision for the user rather than implementing it.

## Skill: Write a spatial test

1. Do not mock PostGIS for radius/bounding-box/clustering logic — test against a real (test) PostGIS instance.
2. Cover: a point inside the radius, a point just outside the radius (boundary case), and an invalid/out-of-range coordinate.
3. For clustering, test both a zoomed-out view (expect clusters) and zoomed-in view (expect individual pins).

## Skill: Handle a moderation/report-related change

1. Check current report-threshold logic (3+ reports auto-hides, per PRD FR5) before changing it — don't silently alter the threshold.
2. Any change to moderation logic affects Safety-category posts most — consider that category specifically when testing, since false hides there have the highest user-trust cost.
3. Log the change and rationale in `MEMORY.md` — moderation logic is exactly the kind of thing a future session shouldn't have to reverse-engineer from a diff.

## Skill: Evaluate a scope-expanding request

Use this whenever a request looks like it might cross a documented boundary (multi-campus, native app, monetization, open-ended AI chat, etc.):

1. Check `USE-CASES.md` Section "Explicit AI Scope Boundary" and the PRD's Section 12 ("Out of Scope / Explicitly Deferred").
2. If the request matches something explicitly deferred, name that plainly to the user before proceeding — don't implement it silently and don't refuse it silently either. State the conflict, then follow the user's explicit call.
3. If the user confirms they want to proceed anyway, that's a real product decision — log it in `MEMORY.md` as a scope change, not just a feature addition.

## Skill: Pre-deploy checklist

1. Full test suite passes (not partial).
2. No secrets in the diff (`.env`, API keys) — check before committing, not after.
3. Any new dependency is listed in `TOOLS.md` with purpose and cost note.
4. `MEMORY.md` updated with this session's decisions before considering the work "done."
