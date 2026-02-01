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
- **Graph / Loom view**: Use a library for the network canvas; implement loom semantics on top.
  - **Primary option: React Flow** — React-native, actively maintained, good for node–edge graphs and custom nodes; fits “follow a thread” and entity nodes. Well documented.
  - **Alternative: Cytoscape.js** (via `react-cytoscapejs`) — Strong for graph theory and layout algorithms; steeper integration with React state.
- **State**: **Zustand** — Minimal boilerplate, scales from a few stores to many; easy to split by domain (e.g. `gameStore`, `playthroughStore`) and enforce game vs playthrough in one place. Add **TanStack Query** when a backend exists (caching, sync, optimistic updates).

### Data & Persistence

- **Local-first (v1)**: **Dexie.js** (IndexedDB wrapper) — Simple API, TypeScript-friendly, indexes for querying threads and entities by `gameId` / `playthroughId`. Schema and store design must explicitly separate game tables (intrinsic) from playthrough tables (user); Dexie makes this straightforward.
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

## Structure (Proposed)

```text
QuestLoom/
├── docs/                 # Design and spec (this folder)
├── src/
│   ├── components/       # UI components
│   ├── features/         # Feature modules (quests, insights, items, etc.)
│   ├── hooks/            # Shared hooks
│   ├── stores/           # State management
│   ├── types/            # TypeScript types / data models
│   ├── utils/            # Utilities
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

| Decision           | Status    | Notes                                                                 |
| ------------------ | --------- | --------------------------------------------------------------------- |
| Language           | Proposed  | TypeScript for frontend and backend                                   |
| Framework          | Proposed  | React 18+ with Vite                                                   |
| Styling            | Proposed  | Tailwind CSS; consider shadcn/ui for components                       |
| Loom / graph       | Proposed  | React Flow as primary; Cytoscape.js as alternative                    |
| State              | Proposed  | Zustand; TanStack Query when backend exists                           |
| Data (v1)          | Proposed  | Dexie (IndexedDB), schema enforces game vs playthrough separation     |
| Backend            | Proposed  | Node + TypeScript, Hono or Fastify, PostgreSQL when needed            |
| Auth               | Proposed  | Not in v1; add Clerk, Supabase Auth, or Lucia for commercialization   |
| Hosting (v1)       | Proposed  | Static deploy (Vercel, Netlify, or similar)                           |

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
