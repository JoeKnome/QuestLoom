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

### 0.1 Create Vite + React + TypeScript app

- In repo root: `npm create vite@latest . -- --template react-ts` (use `.` to create in current directory; accept overwrite for existing files if prompted, or create in a temp dir and merge).
- Install dependencies: `npm install`.
- Verify: `npm run dev` — default Vite React page loads.

### 0.2 Add tooling and styling

- **Tailwind CSS**: `npm install -D tailwindcss postcss autoprefixer` then `npx tailwindcss init -p`; configure `tailwind.config.js` content for `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`; add Tailwind directives to `src/index.css`.
- **ESLint + Prettier**: Extend ESLint for TypeScript and React (e.g. `@typescript-eslint`, `eslint-plugin-react`); add Prettier and avoid conflicts (e.g. `eslint-config-prettier`).
- **Zustand**: `npm install zustand`.
- **Dexie**: `npm install dexie` (and `dexie-react-hooks` if you want reactive queries in React).

### 0.3 Project structure

- Create folders under `src/`: `components/`, `features/`, `hooks/`, `stores/`, `types/`, `utils/`, and optionally `lib/` (for shared data layer).
- Replace the default Vite page with a minimal **app shell**: one layout with a simple header/title (e.g. "QuestLoom") and a placeholder main area. No routing yet if you prefer a single view; add a simple router (e.g. React Router) when you add multiple views.

### 0.4 Definition of done (Phase 0)

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

### 1.4 Wrap up ✅ Complete

- [x] Types and Dexie schema in place; game and playthrough separation is clear in the schema.
- [x] At least one repository (games) implemented and **used by the UI**; no direct Dexie calls in components/stores. *(Repository and store exist; UI in 1.3 consumes them.)*
- [x] User can create a game and see it in a list; selection persists in memory and in localStorage. *(1.3 Minimal UI complete.)*
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

### 2.5 Wrap up ✅ Complete

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

## Phase 3: Threads and Loom View

**Goal:** Users can create and view threads between entities; a loom (graph) view shows the network and supports "follow a thread" exploration.

### 3.1 Thread creation and listing ✅ Complete

- [x] **Generalized thread representation** — Threads are the primary representation of entity connections. The UI creates a representative thread when you link entities (quest giver, item location, place map) and keeps the existing entity field in sync (dual-write). Reserved thread labels: `giver`, `location`, `map`.
- [x] **Thread repository** — `getThreadsFromEntity(gameId, entityId, playthroughId?)` and `deleteThreadsInvolvingEntity(gameId, entityId)` added. Deleting any entity (quest, insight, item, person, place, map) cascades to remove threads involving that entity.
- [x] **UI** — `EntityConnections` component shows threads from an entity; each list screen (Quests, Insights, Items, People, Places) has an expandable row with a "Connections" button that reveals threads for that entity.

### 3.2 Loom (graph) view

- [ ] **Loom View** — Threads tab in game view is replaced with Loom tab, opening the Loom view. This is the primary view in which threads will be visualized. Connections section remains as part of the detail view for entities.
- [ ] **React Flow** — Integrate to fulfill Loom view; nodes = entities (quest, insight, item, person, place), edges = threads. Load current game’s entities and threads via repositories; map to nodes/edges. Custom node component(s) to show entity type and key info.
- [ ] **Interactions** — "Follow a thread": e.g. select a node and highlight its edges, select a source and target node to highlight a path between them, or click an edge to focus source/target. Layout: auto-layout (e.g. React Flow layout lib or simple force-directed) so the graph is readable.

### 3.3 Definition of done (Phase 3)

- [x] Threads are created and stored; thread list and per-entity thread views work (Phase 3.1).
- [ ] Loom view renders the graph for the current game; user can explore by following threads.
- [ ] Still local-only; repositories unchanged for future redirect.

---

## Phase 4: Contextual Progression and Spoiler Safety

**Goal:** Surface "what you can do next" from current items/insights; hide information until the user has the right progression (spoiler-friendly).

### 4.1 Contextual progression

- **Logic** — Implement in `utils/` or `lib/`: given current playthrough state (items possessed, insights resolved, quest progress), compute "actionable" threads or next steps. Consume from a hook or store; display in a dedicated section or in the loom (e.g. highlight actionable edges).

### 4.2 Spoiler visibility

- **Rules** — Define which entities/insights/threads are visible only after certain conditions (e.g. insight resolved, item acquired). Store visibility rules with game data; evaluate against playthrough state. Use for filtering in lists and in the loom (hide or grey out not-yet-visible nodes/edges).

### 4.3 Definition of done (Phase 4)

- [ ] "What I can do next" (or similar) is visible and driven by current items/insights.
- [ ] Spoiler gating hides or softens content until progression conditions are met.
- [ ] Data and logic remain local; repository interface unchanged.

---

## Phase 5: Polish and Redirectability Checklist

**Goal:** App is stable for daily use; codebase is ready to plug in a hosted backend when needed.

- **Maps** — Upload/store map images (e.g. as blobs or base64 in IndexedDB; or file references); markers linked to places; optional full-screen map view.
- **Responsive and a11y** — Touch-friendly controls, basic keyboard navigation, and semantic markup so the app works on tablet/phone during play.
- **Redirectability** — Document repository interfaces; add a thin "data source" abstraction if helpful (e.g. `createLocalDataSource()` vs future `createRemoteDataSource(baseUrl)` that return the same repository interface). No backend code required yet; just a clear boundary so adding API clients later is a contained change.
