# QuestLoom Architecture

## Overview

This document captures technical architecture decisions for QuestLoom. It will evolve as the project takes shape.

## Tech Stack (Proposed)

Choices are aimed at: commercialization readiness, modern standards, strong support and documentation, solo-developer suitability (no enterprise-heavy tooling), and alignment with design requirements (thread-oriented loom, game vs playthrough separation, offline-capable, responsive).

### Languages

- **TypeScript** — Single language for frontend and backend; type safety for entities, threads, and game vs playthrough boundaries; industry standard with excellent tooling.

### Frontend

- **React 18+** — Largest ecosystem for graph/visualization libraries, hiring pool, and documentation; fits the loom (graph) and complex UI needs. No framework lock-in; can deploy as SPA.
- **Vite** — Fast dev server and builds; standard for modern React apps; simple config and great DX for a solo dev.
- **Styling**: **Tailwind CSS** — Utility-first, rapid UI iteration, consistent design; works well with component libraries. Consider **shadcn/ui** (copy-paste React components on Radix + Tailwind) for accessible primitives without a heavy dependency; you own the code and can customize for commercialization.
- **Graph / Loom view**: The Loom uses **React Flow** (`@xyflow/react`) for the canvas (nodes = entities, edges = threads) and **d3-force** for automatic layout. Threads are relationship-focused rather than hierarchical, so force-directed layout is used. Custom node components show entity type and name; interactions include selecting a node to highlight its edges and clicking an edge to focus source/target.

- **State**: **Zustand** — Minimal boilerplate, scales from a few stores to many; easy to split by domain (e.g. `gameStore`, `playthroughStore`) and enforce game vs playthrough in one place. Add **TanStack Query** when a backend exists (caching, sync, optimistic updates).

### Data & Persistence

- **Local-first (v1)**: **Dexie.js** (IndexedDB wrapper) — Simple API, TypeScript-friendly, indexes for querying threads and entities by `gameId` / `playthroughId`. Schema and store design must explicitly separate game tables (intrinsic) from playthrough tables (user); Dexie makes this straightforward.
- **Redirectable to hosted**: Feature code must not call Dexie directly. Use a **repository layer** (e.g. `src/lib/repositories/` or `src/data/`): components and stores call repository methods (e.g. `questRepository.getByGameId(gameId)`). The current implementation uses Dexie; a future implementation can use an API client with the same interface. See [Implementation Plan](implementation-plan.md#redirectability-data-access-layer).

### Repositories

All data access goes through repository interfaces in `src/lib/repositories/`. Scoping:

- **Game-scoped** — `gameRepository`, `questRepository`, `insightRepository`, `itemRepository`, `personRepository`, `placeRepository`, `mapRepository`, `threadRepository`. Methods are keyed by `gameId`; create/update/delete operate on entities for that game. Thread can optionally be playthrough-scoped (`playthroughId` on create).
- **Playthrough-scoped** — Progress/state/discovery: `questRepository` / `insightRepository` / `itemRepository` expose get/upsert/delete for quest progress, insight progress, and item state per playthrough; `entityDiscoveryRepository` for person/place/map discovery. `playthroughRepository` and `threadRepository.deleteByPlaythroughId` complete playthrough-scoped access. Deleting a game cascades to all game-scoped entity tables; deleting a playthrough cascades to progress, state, discovery, and playthrough-scoped threads.
- **Debug helpers**: `src/lib/debug.ts` provides development-only utilities to purge the local database (clear all tables) and purge app localStorage (current game/playthrough selection).
- **Backend (commercialization)**: Add when needed for auth, sync, or multi-device.
  - **Runtime**: **Node.js** with **TypeScript**; same language as frontend.
  - **API**: **Hono** or **Fastify** — Lightweight, fast, great TypeScript support; suitable for a small team or solo dev (avoid enterprise-oriented frameworks).
  - **Database**: **PostgreSQL** — Relational model fits entities and threads; mature, cloud-friendly (e.g. Neon, Supabase, Railway).
  - **Auth**: **Clerk**, **Supabase Auth**, or **Lucia** — Clerk/Supabase have generous free tiers and docs; Lucia is minimal and self-hosted. Choose based on whether you prefer a BaaS or full control.
  - **Hosting**: **Vercel** (frontend + serverless API), **Railway**, **Fly.io**, or **Supabase** (DB + Auth + optional Realtime) — All work for a solo dev and scale toward commercialization.

### Build & Tooling

- **Build**: **Vite** — Single tool for dev and production bundles; supports React, TypeScript, and env handling.
- **Testing**: **Vitest** — Same config and mental model as Vite; unit and integration tests.
- **Linting / Formatting**: **ESLint** + **Prettier** — Standard; use TypeScript-aware rules and optional React-specific presets.
- **Deployment (v1)**: Static export (e.g. Vite `build`) to **Vercel**, **Netlify**, or **Cloudflare Pages** — No backend required initially. Add API and DB when you add auth/sync.

### Rationale (solo dev, commercialization)

- **React over Vue/Svelte**: Largest ecosystem for graph UIs and hiring; design needs (loom, complex state) benefit from mature libraries and docs.
- **Vite over Next.js**: QuestLoom is an app, not a content site; Vite gives a simple SPA with fast builds and no framework lock-in. Next.js can be added later if you need SSR or hybrid routing.
- **Zustand over Redux**: Less boilerplate and sufficient for domain stores and game/playthrough separation; Redux is more than you need for one developer.
- **Dexie over raw IndexedDB**: Typed, queryable, and easy to structure tables by game vs playthrough; sync and backend can be added later without rewriting the model.
- **Hono/Fastify over Express**: Modern, TypeScript-first, and lightweight; avoid enterprise-oriented stacks (Nest, etc.) for a one-person project.
- **PostgreSQL when backend exists**: Relational model fits entities and threads; cloud Postgres (Neon, Supabase, Railway) is affordable and scales.

## Structure

```text
QuestLoom/
├── docs/                 # Design and spec (this folder)
├── src/
│   ├── components/       # Shared UI (ConfirmDialog, PlacePicker, MapPicker, EntityPicker)
│   ├── features/         # Feature modules
│   │   ├── games/        # Game list, GameView, PlaythroughPanel, sidebar
│   │   ├── quests/       # Quest list and CRUD
│   │   ├── insights/     # Insight list and CRUD
│   │   ├── items/        # Item list and CRUD
│   │   ├── people/       # Person list and CRUD
│   │   ├── places/       # Place list and CRUD
│   │   ├── maps/         # Map list and CRUD
│   │   ├── threads/      # Thread list and CRUD
│   │   └── loom/         # Loom graph view (LoomView, EntityNode, useLoomGraph, loomLayout)
│   ├── hooks/            # Shared hooks
│   ├── lib/              # Repositories, db, debug
│   ├── stores/           # State management (appStore)
│   ├── types/            # TypeScript types / data models
│   ├── utils/            # Utilities (generateId, getEntityDisplayName)
│   └── App.tsx           # Root component
├── public/
└── [config files]
```

## Bespoke (Application-Specific)

These elements have no off-the-shelf equivalent and must be implemented for QuestLoom:

1. **Game vs playthrough data model and persistence** — Schema, store/table design, and API boundaries that separate intrinsic game data from playthrough-scoped data; playthrough data must never persist across “clear progress” or leak between playthroughs. Implement on top of Dexie (and later PostgreSQL) with clear `gameId` / `playthroughId` scoping and validation.
2. **Loom semantics** — Using React Flow (or similar) as the canvas: mapping entities to nodes, threads to edges, “follow a thread” navigation, and any custom layout or filtering. The library provides the graph; QuestLoom defines the behavior and UX.
3. **Contextual progression** — Logic that determines “what the user can follow now” from current items and insights (and optionally other progression). Implement as queries/derived state over entities and threads, not a generic engine.
4. **Spoiler visibility** — Rules that gate visibility of entities, insights, or thread details by progression. Implement as a visibility layer (filters, masking, or conditional rendering) driven by playthrough state.
5. **App shell and feature modules** — Navigation, routing, and feature boundaries (quests, insights, items, maps, people/places, threads, loom). Structure is standard; the actual screens and flows are bespoke.

## Key Decisions

| Decision     | Status   | Notes                                                               |
| ------------ | -------- | ------------------------------------------------------------------- |
| Language     | Adopted  | TypeScript for frontend (and future backend)                        |
| Framework    | Adopted  | React 18+ with Vite                                                 |
| Styling      | Adopted  | Tailwind CSS                                                        |
| Loom / graph | Adopted  | React Flow (@xyflow/react) + d3-force for layout (Phase 3.2)       |
| State        | Adopted  | Zustand; TanStack Query when backend exists                         |
| Data (v1)    | Adopted  | Dexie (IndexedDB), schema enforces game vs playthrough separation   |
| Backend      | Proposed | Node + TypeScript, Hono or Fastify, PostgreSQL when needed          |
| Auth         | Proposed | Not in v1; add Clerk, Supabase Auth, or Lucia for commercialization |
| Hosting (v1) | Proposed | Static deploy (Vercel, Netlify, or similar)                         |

**Phase 2 complete:** All core entities (Quest, Insight, Item, Person, Place, Map, Thread) have repositories and CRUD UI; game vs playthrough scoping is enforced. Data access is repository-only (redirectable).

**Phase 3 complete:** Threads and the Loom view are implemented using React Flow and d3-force; users can explore the current game's entities and threads as a graph and follow connections via the Loom.

## Data Separation (Game vs Playthrough)

Persistence and storage **must** separate two tiers:

- **Game data (intrinsic)** — Same across users and playthroughs; persisted with the game. Survives when a user clears progress to start a new playthrough. Store and version with the game; do not key by playthrough.
- **Playthrough data (user)** — Quest progress, inventory state, personal notes, running investigations. Scoped to a specific playthrough and user. **Never** persisted across playthroughs; cleared or replaced on "start new playthrough." Storage and APIs must not allow playthrough data to leak between playthroughs.

Schema design, storage keys, and any APIs must distinguish game-level vs playthrough-level data and enforce that playthrough data is constrained to a single playthrough.

## Constraints

- Web-first; must work in modern browsers
- Responsive design for tablet/phone use during gameplay
- Offline-capable preferred (local storage or IndexedDB)
- No backend required for initial version (local-only acceptable)

---

_Update this document as architecture decisions are made._
