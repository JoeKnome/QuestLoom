# Reachability debug logging removal (Phase 5.5)

## Context

During Phase 5.5, temporary debug logic was added to validate reachability from the playthrough’s current position. This logic lives in `GameView` and is intended only for development verification; it should be removed once reachability is fully integrated into user-visible UI (e.g. contextual progression, Loom highlighting, or place availability).

## Current behavior

When the user updates the current position via the selector in `GameView`:

- `handleSaveCurrentPosition` saves `currentPositionPlaceId` on the active `Playthrough`.
- After saving, it calls `computeReachablePlaces` with:
  - `gameId = currentGameId`
  - `playthroughId = currentPlaythroughId`
  - `startPlaceId = positionDraftPlaceId`
- It builds a row for each place with:
  - `placeId`
  - `name` (from `placeNamesById` or the ID fallback)
  - `reachable` (true when the place is in `reachablePlaceIds`)
- It logs the result to the browser console via `console.table(rows, ['placeId', 'name', 'reachable'])` and logs any errors with `console.error(...)`.

The debug block is explicitly marked with:

- A JSDoc-style comment referencing **Phase 5.5** and indicating it is **temporary**.
- A note `REMOVE in a later phase when reachability is fully integrated into the UI`.

## Why this should be removed

- Console logging is not part of the product experience and adds noise in normal use.
- Once reachability is surfaced in the UI (e.g. phase 5.7 contextual progression, 5.6 availability, or Loom highlighting), this debug output becomes redundant.
- Leaving ad-hoc debug code in production paths increases maintenance overhead and may hide other logs.

## Proposed removal plan

1. **Identify a permanent UI surface** that consumes reachability:
   - For example, contextual progression hints, Loom node highlighting, or reachability-based filtering of entities.
2. **Wire `useReachablePlaces` or `computeReachablePlaces`** into that UI, replacing the need for console-based inspection.
3. **Remove the debug block** from `GameView`:
   - Delete the `console.table` and `console.error` calls.
   - Remove the surrounding `DEBUG (Phase 5.5)` comment, keeping only the persistence of `currentPositionPlaceId`.
4. **Update docs**:
   - Remove or revise the Phase 5.5 bullet that references debug logging in `docs/implementation-plan.md`.
   - Close this issue.

## Acceptance criteria

- No console logging remains in `handleSaveCurrentPosition` related to reachability.
- Reachability is verifiable through UI behavior (or dedicated dev tooling) rather than console logs.
- Documentation no longer references the temporary debug behavior.

