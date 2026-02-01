# QuestLoom Architecture

## Overview

This document captures technical architecture decisions for QuestLoom. It will evolve as the project takes shape.

## Tech Stack (To Be Decided)

- **Languages**: TypeScript, TBD
- **Frontend**: TBD (e.g., React, Vue, Svelte)
- **Styling**: TBD
- **State / Data**: TBD (local storage, IndexedDB, backend API)
- **Build**: TBD (Vite, Next.js, etc.)
- **Deployment**: TBD (static host, Vercel, etc.)

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

## Key Decisions (Placeholder)

| Decision         | Status  | Notes                                       |
| ---------------- | ------- | ------------------------------------------- |
| Framework        | Pending | React suggested                             |
| Data persistence | Pending | Local-first initially                       |
| Auth             | Pending | Not needed for v1, mandatory for target use |
| Hosting          | Pending | Static deploy possible                      |

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
