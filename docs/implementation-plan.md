# QuestLoom Implementation Plan

## Goals

1. **Fully operational locally** — App runs and persists data with no backend; usable as a personal tool during development.
2. **Local functionality as soon as possible** — Bootstrap the app and core flows first; iterate on polish and advanced features.
3. **Redirectable to hosted** — Data access is behind an abstraction so the same app can later use a hosted API without rewriting feature code.

## Redirectability: Data Access Layer

To keep the early local solution redirectable:

- **Repositories / services** — Feature code (components, stores) calls repository functions (e.g. `questRepository.getAllByGame(gameId)`), not Dexie directly.
- **Single implementation for now** — Repositories use Dexie (IndexedDB) as the only backend. Same interfaces can later be implemented by API clients (e.g. `questRepository = createQuestApiClient(baseUrl)`).
- **Shared types** — Entity and DTO types live in `src/types/` and are used by both local and (future) remote implementations.

No backend, auth, or sync in the initial implementation; add them when moving toward commercialization.

---

## Phase 0: Project Bootstrap ✅ Complete

**Goal:** Run the app locally with a minimal shell; establish tooling and structure.

**Status:** Validation steps succeeded; node/npm are available for subsequent phases.

### 0.1 Create Vite + React + TypeScript app ✅ Complete

- In repo root: `npm create vite@latest . -- --template react-ts` (use `.` to create in current directory; accept overwrite for existing files if prompted, or create in a temp dir and merge).
- Install dependencies: `npm install`.
- Verify: `npm run dev` — default Vite React page loads.

### 0.2 Add tooling and styling ✅ Complete

- **Tailwind CSS**: `npm install -D tailwindcss postcss autoprefixer` then `npx tailwindcss init -p`; configure `tailwind.config.js` content for `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`; add Tailwind directives to `src/index.css`.
- **ESLint + Prettier**: Extend ESLint for TypeScript and React (e.g. `@typescript-eslint`, `eslint-plugin-react`); add Prettier and avoid conflicts (e.g. `eslint-config-prettier`).
- **Zustand**: `npm install zustand`.
- **Dexie**: `npm install dexie` (and `dexie-react-hooks` if you want reactive queries in React).

### 0.3 Project structure ✅ Complete

- Create folders under `src/`: `components/`, `features/`, `hooks/`, `stores/`, `types/`, `utils/`, and optionally `lib/` (for shared data layer).
- Replace the default Vite page with a minimal **app shell**: one layout with a simple header/title (e.g. "QuestLoom") and a placeholder main area. No routing yet if you prefer a single view; add a simple router (e.g. React Router) when you add multiple views.

### 0.4 Definition of done (Phase 0) ✅ Complete

- [x] `npm run dev` runs and shows a QuestLoom shell (header + main area).
- [x] `npm run build` succeeds.
- [x] Tailwind is applied; one styled element confirms it.
- [x] ESLint and Prettier run (e.g. via `npm run lint` / format script).

**Validate Phase 0** (run in project root when node/npm are available):

```bash
npm install
npm run dev    # Open http://localhost:5173 — should see QuestLoom header and main area
npm run build  # Should complete without errors
npm run lint   # Should pass
npm run format # Optional: format code
```

**Immediate next steps (in order):**

1. Scaffold Vite + React + TS in the repo (or merge from a temp `vite` run).
2. Install Tailwind, configure it, add a minimal global layout in `App.tsx`.
3. Install Zustand and Dexie; add `src/types/` and `src/lib/` (or `src/data/`) for future repositories.
4. Add ESLint + Prettier and a single script to run lint.

---

## Phase 1: Local Data Foundation ✅ Complete

**Goal:** Persist one entity type in IndexedDB with a clear game/playthrough boundary; app reads and writes via a repository, not Dexie directly.

### 1.1 Types and Dexie schema ✅ Complete

- Add **TypeScript types** for entities from `docs/data-models.md`: `Game`, `Playthrough`, `Quest`, `Insight`, `Item`, `Person`, `Place`, `Map`, `Thread`. Use a one file per entity and shared types for IDs and enums.
- Define **Dexie database**: one `Dexie` instance with tables that mirror entities. Every table that is playthrough-scoped has `playthroughId` (and usually `gameId`); game-scoped tables have `gameId` only. Index `gameId` and `playthroughId` for queries.
- **Game vs playthrough tables** (conceptual):
  - **Game-scoped (intrinsic):** `games`, `quests`, `insights`, `items`, `persons`, `places`, `maps`, `threads` — each row has `gameId`; survives "clear progress."
  - **Playthrough-scoped (user):** e.g. `playthroughs`, `questProgress`, `itemState`, `notes`, or similar — each row has `playthroughId`; cleared or replaced on new playthrough. (Exact table split can follow a first cut: e.g. store "progress" and "notes" in playthrough tables; entity definitions in game tables.)

### 1.2 Repository layer (redirectable) ✅ Complete

- Implement **one repository** first (e.g. `GameRepository`): `getAll()`, `getById(id)`, `create(game)`, `update(game)`, `delete(id)`. Implementation uses Dexie; interface lives in `src/lib/repositories/` or `src/data/` so a future `GameApiClient` can implement the same interface.
- **Current game / current playthrough** — Use Zustand (e.g. `useAppStore`) to hold `currentGameId` and `currentPlaythroughId`; optional persistence of "last selected" in `localStorage` for convenience. No auth; single user on this device.

**Definition of done (Phase 1.2):**

- [x] `IGameRepository` is defined and implemented by a Dexie-based implementation; `getAll`, `getById`, `create`, `update`, `delete` work against `db.games`.
- [x] Singleton `gameRepository` is exported from `src/lib/repositories` and is the only way feature code should access game data.
- [x] Zustand app store (`useAppStore`) holds `currentGameId` and `currentPlaythroughId` with setters; last selected is persisted in `localStorage` (keys: `questloom-current-game-id`, `questloom-current-playthrough-id`).
- [x] Reusable ID util (`src/utils/generateId.ts`) exists and is used by the game repository for `create`.
- [x] No direct Dexie usage outside `src/lib/`; `npm run lint` and `npm run build` pass.

**Remaining for Phase 1:** Proceed to **1.3 Minimal UI** (game list / create game screen using `gameRepository` and `useAppStore`). Then validate **1.4** (repository used by UI, user can create and see games, selection persists).

### 1.3 Minimal UI ✅ Complete

- **Game list / create game** — Single screen: list existing games (from Dexie via repository); button "New game" that creates a game and optionally a default playthrough, then sets it as current. Data flows: UI → repository → Dexie; UI reads from repository (or from a Zustand store that the repository updates).
- Implemented: `GameListScreen`, `CreateGameForm`, minimal `PlaythroughRepository`; selecting a game sets it (and first playthrough) as current; selection persists in localStorage.

### 1.4 Definition of done (Phase 1) ✅ Complete

- [x] Types and Dexie schema in place; game and playthrough separation is clear in the schema.
- [x] At least one repository (games) implemented and **used by the UI**; no direct Dexie calls in components/stores. _(Repository and store exist; UI in 1.3 consumes them.)_
- [x] User can create a game and see it in a list; selection persists in memory and in localStorage. _(1.3 Minimal UI complete.)_
- [x] User can delete a game. App prompts for confirmation before delete, then deletes the game and all associated playthroughs.
- [x] Debug utility exists to purge the local database.
- [x] Debug utility exists to purge this app's local storage values.
- [x] App runs fully locally; no network required.
- [x] All files in docs are updated with the changes made in this phase.

---

## Phase 2: Core Entities and CRUD ✅ Complete

**Goal:** All core entities (Quest, Insight, Item, Person, Place, Map, Thread) can be created, read, updated, and deleted in the app; data is scoped by game or playthrough as per data-models.

### 2.1 Game View ✅ Complete

- [x] When a game is set to current, rather than remaining on the game list with a "Current" badge shown, instead swap to the view for that game. In 2.1 it will only show the name of the current game and the current playthrough.
- [x] Clicking the app logo will navigate back to the game list, unsetting the current game and playthrough.
- [x] Update docs as needed to reflect this functionality.

View switching is state-based: when `currentGameId` is set, the app renders the game view (game name + playthrough name); when null, it renders the game list. No URL routing yet.

### 2.2 Playthrough Management ✅ Complete

- [x] While in the game view, the user is able to open a panel to manage their playthroughs.
- [x] The user can select a different available playthrough to swap to it as current.
- [x] The user can change the name of each playthrough.
- [x] The user can create a new playthrough, giving it a name and automatically swapping to it.
- [x] The user can delete a playthrough, with a confirmation dialog for safety. If this was the current playthrough, the user will automatically be swapped to the next available playthrough. If this was the last playthrough, a new playthrough will be automatically created and set as current.
- [x] Update docs as needed to reflect this functionality.

Implemented: Game view shows a button (current playthrough name) that opens a slide-out **PlaythroughPanel**. The panel lists playthroughs (with "Current" indicator), supports select (and closes panel), inline rename, create (form with name), and delete (ConfirmDialog). Delete of current swaps to first remaining or creates a "Default" playthrough if none remain; delete of non-current leaves selection unchanged. Playthrough repository extended with `getById`, `update`, and `delete(id)`.

### 2.3 Repositories and Scoping ✅ Complete

- [x] Add repositories for: **Quest**, **Insight**, **Item**, **Person**, **Place**, **Map**, **Thread**. Each method is scoped by `gameId` (and `playthroughId` where the entity is playthrough-scoped). Follow the same interface pattern as Phase 1 so swapping to an API later only replaces the implementation.
- [x] **Playthrough-scoped data** — Decide which fields are "progress" (e.g. quest status, item status, notes) and store them in playthrough tables or in columns keyed by `playthroughId`; game tables hold only intrinsic definitions.
- [x] Update docs as needed to reflect this functionality.

Implemented: All seven entity repositories in `src/lib/repositories/` with getByGameId, getById, create, update, delete, deleteByGameId. Quest/Insight/Item also expose progress/state get/upsert/deleteByPlaythroughId; EntityDiscoveryRepository for discovery. Thread supports optional playthroughId (game- vs playthrough-scoped). Game delete cascades to all game-scoped entities; playthrough delete cascades to questProgress, insightProgress, itemState, entityDiscovery, and playthrough-scoped threads.

### 2.4 Feature Modules and UI ✅ Complete

- [x] **One feature per entity**: `features/quests/`, `features/insights/`, `features/items/`, `features/people/`, `features/places/`, `features/maps/`, `features/threads/`. Each feature uses repositories and shared components.
- [x] **Simple CRUD UI** — Within the game view, list + create/edit/delete forms for each entity, scoped to the current game (and playthrough where relevant). Navigation: sidebar to switch between Quests, Insights, Items, People, Places, Maps, Threads (seven sections). No loom yet; focus on data entry and list/detail views.
- [x] Update docs as needed to reflect this functionality.

Implemented: GameView includes a sidebar (responsive: horizontal scroll on small screens, vertical on md+) and content area. Each section renders a list screen (QuestListScreen, InsightListScreen, ItemListScreen, PersonListScreen, PlaceListScreen, MapListScreen, ThreadListScreen) with create/edit forms and delete (ConfirmDialog). Shared components: PlacePicker, MapPicker, EntityPicker; getEntityDisplayName for thread labels. Quest/Insight/Item lists show and edit playthrough progress/state (status dropdown) when a playthrough is selected.

### 2.5 Definition of done (Phase 2) ✅ Complete

- [x] All entity types have repository APIs and Dexie persistence; game vs playthrough scoping is enforced.
- [x] User can select, create, edit, and delete playthroughs.
- [x] User can view, create, edit, and delete quests, insights, items, people, places, maps, and threads for the current game.
- [x] "New playthrough" clears only playthrough data; game data remains.
- [x] App remains fully local and redirectable (repositories are the only data access).
- [x] All documentation pages are updated reflecting the latest state of the app.
- [x] All items left to do are documented for future action.
- [x] All affected code passes code standards, style, and lint.

**Phase 2.5 validation:** Repositories (Game, Playthrough, Quest, Insight, Item, Person, Place, Map, Thread, EntityDiscovery) live in `src/lib/repositories/`; Dexie is used only inside `src/lib/`. Playthrough delete cascades to quest progress, insight progress, item state, entity discovery, and playthrough-scoped threads; game data is unchanged. Creating a new playthrough adds a playthrough row only; game-scoped entities remain. Lint and format pass.

**Items left for future action** (see `docs/issues/`):

- [item-unpossessed-status.md](issues/item-unpossessed-status.md) — Default "unpossessed" item status.
- [status-labels-reusability.md](issues/status-labels-reusability.md) — Elevate status labels for reuse across list/detail views.
- [repetitive-prop-definitions.md](issues/repetitive-prop-definitions.md) — Generic Create/Edit props for entity forms.

---

## Phase 3: Threads and Loom View ✅ Complete

**Goal:** Users can create and view threads between entities; a loom (graph) view shows the network and supports "follow a thread" exploration.

### 3.1 Thread creation and listing ✅ Complete

- [x] **Generalized thread representation** — Threads are the primary representation of entity connections. The UI creates a representative thread when you link entities (quest giver, item location, place map) and keeps the existing entity field in sync (dual-write). Reserved thread labels: `giver`, `location`, `map`.
- [x] **Thread repository** — `getThreadsFromEntity(gameId, entityId, playthroughId?)` and `deleteThreadsInvolvingEntity(gameId, entityId)` added. Deleting any entity (quest, insight, item, person, place, map) cascades to remove threads involving that entity.
- [x] **UI** — `EntityConnections` component shows threads from an entity; each list screen (Quests, Insights, Items, People, Places) has an expandable row with a "Connections" button that reveals threads for that entity.

### 3.2 Loom (graph) view ✅ Complete

- [x] **Loom View** — Threads tab in game view is replaced with Loom tab, opening the Loom view. This is the primary view in which threads will be visualized. Connections section remains as part of the detail view for entities.
- [x] **React Flow** — Integrate to fulfill Loom view; nodes = entities (quest, insight, item, person, place, map), edges = threads. Load current game’s entities and threads via repositories; map to nodes/edges. Custom node component (EntityNode) shows entity type and key info.
- [x] **Layout** — Force-directed layout via **d3-force** (threads are relationship-focused, not hierarchical). Auto-layout on load.
- [x] **Interactions** — Select a node to highlight its edges; click an edge to focus/select source and target. Fit view control in the Loom. (Path highlight between two nodes can be a follow-up.)

### 3.3 Definition of done (Phase 3) ✅ Complete

- [x] Threads are created and stored; thread list and per-entity thread views work (Phase 3.1).
- [x] Loom view renders the graph for the current game; user can explore by following threads (Phase 3.2).
- [x] Still local-only; repositories unchanged for future redirect.
- [x] All documentation pages are updated reflecting the latest state of the app.
- [x] All items left to do are documented for future action.
- [x] All affected code passes code standards, style, and lint.

**Items left for future action** (see `docs/issues/`):

- [loom-path-highlighting.md](issues/loom-path-highlighting.md) — Highlight paths between two entities in the Loom view.

---

## Phase 4: Map View

**Goal:** Give maps a dedicated experience: browse maps as a grid of previews, set map images via URL or upload, and view a selected map in a zoomable, pannable map view with intuitive sidebar tab behavior.

### 4.1 Map tab and map selection grid ✅ Complete

- [x] **Map tab behavior** — Ensure the existing Maps sidebar tab (from Phase 2) can represent two modes: **selection** (grid of maps) and **map view** (single map). Track map UI state in a store (e.g. `useGameViewStore`) with fields like `mapUiMode: 'selection' | 'view'` and `lastViewedMapId`.
- [x] **Tab interaction rules** — Implement logic so that:
  - When the user is on a **different** sidebar tab, clicking **Maps** opens the **last viewed map view** if `lastViewedMapId` is set; otherwise it opens **map selection**.
  - When the user is already in the **map view**, clicking the **Maps** tab switches back to **map selection**.
  - When the user is in **map selection** and chooses a map, the UI switches to **map view** and updates `lastViewedMapId`.
- [x] **Selection grid** — Replace the existing list-style maps screen with a responsive **grid of tiles**. Each tile shows the map name, a small preview of the map image (or a placeholder if none is set), and a subtle hover/focus state. Use Tailwind utilities and existing card components for visual consistency.
- [x] **Selection actions** — Clicking a tile opens the map view for that map. Keep create/edit/delete controls available from this grid (e.g. a toolbar button for "New map" and contextual actions per tile).

Implemented: Added a `useGameViewStore` to track `mapUiMode` and `lastViewedMapId`, updated `GameView` so the Maps sidebar tab toggles between the selection grid and the last viewed map according to the rules above, and refactored the maps feature into a responsive grid of map tiles with image previews, a toolbar “New map” button, and per-tile Edit/Delete actions; clicking a tile opens the corresponding map view and records it as last viewed.

### 4.2 Map create/edit: image sources ✅ Complete

- [x] **Map image fields** — Extend the `Map` entity and repository to support an image reference that can come from either a URL or an uploaded asset (e.g. `imageSourceType: 'url' | 'upload'`, `imageUrl?: string`, `imageBlobId?: string`). Keep storage details encapsulated in the repository layer.
- [x] **URL input** — In the map create/edit form, add an "Image URL" option with validation (basic URL format, test fetch for preview). Selecting this option stores `imageSourceType = 'url'` and the provided URL; show a live preview thumbnail in the form.
- [x] **Upload from disk** — Add a file input control for image uploads (PNG/JPEG/WebP). When a file is chosen, read and store it via the repository (e.g. as a blob or file reference managed by Dexie), setting `imageSourceType = 'upload'`. Show upload progress where appropriate and render a preview once stored or buffered.
- [x] **Drag and drop** — Add a drag-and-drop zone on the create/edit form that accepts image files and routes them through the same upload pipeline as the file input. Highlight the drop zone on drag-over; reject non-image files with a user-friendly message.
- [x] **Editing behavior** — When editing an existing map, pre-populate the current image source, allow switching between URL and upload, and ensure the repository cleans up any orphaned uploaded blobs when the source changes or a map is deleted.

Implemented: Extended `Map` and `CreateMapInput` with optional `imageSourceType`, `imageUrl`, and `imageBlobId`; added Dexie `mapImages` table for uploaded blobs (schema v3). Map repository now exposes `setImageFromUrl`, `setImageFromUpload`, and `clearImage`, and deletes blob rows on map delete or source change. MapForm offers image source radios (None, URL, Upload), URL validation (http/https) with live preview, file input (PNG/JPEG/WebP, max 10 MB) with object-URL preview and "Remove image," and a drag-and-drop zone that routes the first valid image through the same pipeline. Create/edit flows persist and switch between sources; edit mode pre-populates current source and shows "Using uploaded image" when an upload is present. MapListScreen shows "Uploaded image" in the grid for maps with uploads; full blob display in MapView is deferred to 4.3.

### 4.3 Map view: render, zoom, and pan ✅ Complete

- [x] **Map view screen** — Introduce a dedicated `MapView` screen/component that takes a `mapId`, loads the map via the repository, and renders the map image in the main content area of the Maps tab.
- [x] **Image rendering** — Resolve the correct image source (URL vs uploaded blob) and display it at a suitable base zoom level. Handle loading and error states (e.g. failed URL fetch, missing image).
- [x] **Zoom and pan** — Implement client-side zoom and pan (e.g. via CSS transforms and pointer/mouse wheel handlers, or a lightweight pan/zoom helper library). Support mouse wheel and pinch zoom, click-and-drag (or touch drag) pan, and a "reset view" control to fit the map to the viewport.
- [x] **Integration with tab behavior** — Ensure that entering map view from the grid sets `mapUiMode = 'view'` and `lastViewedMapId`, and that the sidebar tab interactions defined in 4.1 correctly switch between selection and view modes without losing the current zoom/pan state when returning to the same map.
- [x] **Accessibility and responsiveness** — Make zoom/pan controls keyboard-accessible where practical, keep the map view usable on smaller screens, and ensure the map grid and map view share consistent styling with other feature tabs.

Implemented: Added `getMapImageDisplayUrl(mapId)` to `IMapRepository` and `MapRepository` to return a displayable URL for URL or uploaded blob (with optional revoke for object URLs). MapView loads the map and image via the repository, revokes object URLs on unmount or when switching maps, and shows loading / "No image set" / "Failed to load image" states. Zoom and pan use React state and CSS transform (scale, translate); wheel zooms toward cursor; pointer down/move/up with setPointerCapture for pan. Toolbar has Reset view, Zoom in, and Zoom out (keyboard-focusable, aria-labels). `gameViewStore` holds `mapViewTransform` per map and `setMapViewTransform`; MapView restores stored transform when re-entering a map and persists on pan end and zoom. Styling aligned with other feature tabs; pan/zoom area uses min-h-0 and flex-1 for responsiveness.

### 4.4 Map entity and loom integration

- [ ] **Map as view-only entity** — Clarify in `docs/data-models.md` and repository docs that the `Map` entity exists primarily to back the map view experience and should **not** appear as a node in the Loom or be directly connectable via threads.
- [ ] **Place as map representative** — Establish `Place` as the entity type used in threads and the Loom to represent locations and maps. Ensure UI copy and tooltips reinforce that threads connect places (and other entities), not maps.
- [ ] **Top-level place per map** — Extend map creation logic so that creating a map automatically creates a corresponding top-level `Place` (e.g. "Map: Tavern District") associated with that map. Store the association in the map and/or place records so it can be resolved efficiently.
- [ ] **Loom node adjustments** — Update the Loom view configuration so that nodes of type `MAP` are no longer rendered; instead, the associated top-level `Place` is used to represent that map in the Loom.
- [ ] **Cascade on map delete** — When a map is deleted, automatically delete its associated top-level `Place` and any child places that are scoped specifically to that map, reusing existing cascading delete patterns. Ensure that thread and discovery repositories clean up any connections involving those places, as in Phase 3.
- [ ] **Name synchronization** — Implement two-way name syncing such that renaming a map also renames its associated top-level place, and renaming that place updates the map name. Log this coupling in docs to avoid accidental divergence.

### 4.5 Map markers: data and display

- [ ] **Marker model** — Introduce a `MapMarker` data model and repository keyed by game (and optionally playthrough) that links a `mapId` and an entity endpoint (`entityId`) with a persistent position stored relative to the map (e.g. normalized `x`/`y` between 0 and 1).
- [ ] **Eligible entities** — Ensure that all entities except maps and threads can have markers (**same set as `THREAD_ENDPOINT_ENTITY_TYPES` from `EntityType.ts`**). Add guardrails in the marker creation UI to restrict selection to this set.
- [ ] **Initial marker rendering** — In `MapView`, load markers for the current map and render them on top of the image at their relative positions, transforming them alongside zoom and pan so they remain correctly aligned.
- [ ] **Basic marker styling** — Implement simple, readable marker visuals for this phase: small circular or pill-shaped badges where the **marker color is tied to the entity type** and the **first letter of the entity’s name** is displayed inside.
- [ ] **Tooltips** — On hover or focus, show a minimal tooltip near the marker with the full entity name. Follow existing tooltip patterns/components where available.

### 4.6 Map markers: interaction and context menu

- [ ] **Pan vs move safeguards** — Default interactions prioritize safe panning: click-and-drag on the map pans, clicking a marker selects it. Moving a marker requires an explicit action (e.g. "Move marker" from a context menu) so markers are not accidentally dragged while panning. Middle mouse button always pans, with no selection behavior.
- [ ] **Map context menu** — Implement a right-click (or long-press on touch) context menu on the map background that anchors at the clicked location and lists actions relevant to that point.
- [ ] **Add marker here (existing entity)** — From the context menu, allow the user to "Add marker here" for an existing entity by opening a lightweight picker limited to eligible entity types. On selection, create a `MapMarker` at that location for the chosen entity.
- [ ] **Add marker here (new entity)** — Support creating a new entity (e.g. place, item, person, quest, insight) and placing its marker in a single flow (modal or side panel). After creation via the appropriate repository, automatically create a `MapMarker` at the context menu location.
- [ ] **Marker context menu** — When right-clicking on an existing marker (or long-press on touch), show a marker-specific context menu with actions including **Move marker** and **Delete marker** (with variations below).
- [ ] **Move marker flow** — Choosing "Move marker" enters a move mode where the marker visually attaches to the cursor; panning is restricted to the middle mouse button. On the next click (mouse up or tap), the marker’s position is updated to the new location and move mode ends; ESC cancels and restores the original position.
- [ ] **Delete marker only** — Provide an option to delete only the marker while leaving the underlying entity intact. This removes the `MapMarker` record but does not touch the entity or its threads.
- [ ] **Delete marker and entity** — Provide an option to delete both the marker and the associated entity, with clear confirmation text describing cascading consequences. Reuse existing entity delete flows so all associated threads and discovery data are removed consistently.

### 4.7 Definition of done (Phase 4)

- [ ] The Maps sidebar tab supports both a selection grid and a map view, with tab clicks behaving as specified (toggle selection/view; return to last viewed map when coming from other tabs).
- [ ] The map selection experience is a grid of tiles showing map names and image previews, with create/edit/delete actions available.
- [ ] Creating or editing a map allows setting the image via URL, file upload, or drag-and-drop, and the image is persisted via the map repository.
- [ ] The map view renders the selected map image and supports smooth zoom and pan interactions.
- [ ] Maps are represented in the Loom via associated top-level places; maps themselves do not appear as Loom nodes or thread endpoints.
- [ ] Each map has a top-level place that is created, renamed, and deleted in lockstep with the map, with Loom and thread data updating accordingly.
- [ ] Map markers are stored as persistent data linked to maps and non-map/thread entities, rendered on the map with simple type-colored visuals and tooltips.
- [ ] Users can add, move, and delete markers via deliberate interactions and a context menu, including flows that create new entities at a location or delete entities with full cascading behavior.
- [ ] All documentation pages are updated reflecting the latest state of the app.
- [ ] All items left to do are documented for future action.
- [ ] All affected code passes code standards, style, and lint.

---

## Phase 5: Contextual Progression and Spoiler Safety

**Goal:** Surface "what you can do next" from current items/insights; hide information until the user has the right progression (spoiler-friendly).

### 5.1 Contextual progression

- **Logic** — Implement in `utils/` or `lib/`: given current playthrough state (items possessed, insights resolved, quest progress), compute "actionable" threads or next steps. Consume from a hook or store; display in a dedicated section or in the loom (e.g. highlight actionable edges).

### 5.2 Spoiler visibility

- **Rules** — Define which entities/insights/threads are visible only after certain conditions (e.g. insight resolved, item acquired). Store visibility rules with game data; evaluate against playthrough state. Use for filtering in lists and in the loom (hide or grey out not-yet-visible nodes/edges).

### 5.3 Definition of done (Phase 5)

- [ ] "What I can do next" (or similar) is visible and driven by current items/insights.
- [ ] Spoiler gating hides or softens content until progression conditions are met.
- [ ] Data and logic remain local; repository interface unchanged.
- [ ] All documentation pages are updated reflecting the latest state of the app.
- [ ] All items left to do are documented for future action.
- [ ] All affected code passes code standards, style, and lint.

---

## Phase 6: Polish and Redirectability Checklist

**Goal:** App is stable for daily use; codebase is ready to plug in a hosted backend when needed.

- **Maps** — Optional full-screen map view and visual/interaction polish for the map markers and map view introduced in Phase 4 (e.g. refined marker design, animations, advanced filtering, or layering), plus any additional map-related polish not covered earlier.
- **Responsive and a11y** — Touch-friendly controls, basic keyboard navigation, and semantic markup so the app works on tablet/phone during play.
- **Redirectability** — Document repository interfaces; add a thin "data source" abstraction if helpful (e.g. `createLocalDataSource()` vs future `createRemoteDataSource(baseUrl)` that return the same repository interface). No backend code required yet; just a clear boundary so adding API clients later is a contained change.

### 6.1 Definition of done (Phase 6)

- [ ] All documentation pages are updated reflecting the latest state of the app.
- [ ] All items left to do are documented for future action.
- [ ] All affected code passes code standards, style, and lint.
