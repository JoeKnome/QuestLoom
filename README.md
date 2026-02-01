# QuestLoom

A companion web app for mystery and adventure games. Track quests, insights, items, maps, and **threads** between people and places—then follow those threads in a loom (network) view to visualize relationships and progress.

## One-Line Pitch

A companion app for mystery and adventure games that lets users track quests, insights, items, maps, and threads between people and places.

## Differentiators

- **Thread-oriented** — Clear visualization of relationships and pathways; set a target and follow a thread to reach it. The loom surfaces a followable network, not a flat map of everything.
- **Contextual progression** — Surface threads you can follow based on current items and insights; highlight what is actionable now.
- **Spoiler-friendly** — Hide information until you have the required progression to uncover it.
- **User-driven logging** — You drive progression, notes, and your own solutions; not a fixed checklist to search and check off.

## Core Entities

| Entity  | Description                                                                   |
| ------- | ----------------------------------------------------------------------------- |
| Quest   | Objectives, goals, and progress tracking                                      |
| Insight | Key information, lore, and understanding that helps solve or advance          |
| Item    | Inventory and key objects                                                     |
| Map     | Spatial context and location tracking                                         |
| Person  | Characters and NPCs                                                           |
| Place   | Locations and rooms                                                           |
| Thread  | Links between entities (e.g., Person ↔ Place); the **loom** is the graph view |

## Documentation

Design and specification docs live in `docs/`:

| Doc                                  | Description                                               |
| ------------------------------------ | --------------------------------------------------------- |
| [Design Spec](docs/design-spec.md)   | Vision, differentiators, principles, scope, core entities |
| [Features](docs/features.md)         | Feature list and user stories                             |
| [Data Models](docs/data-models.md)   | Entity schemas and relationships                          |
| [Architecture](docs/architecture.md) | Tech stack and project structure                          |

## Project Structure (Proposed)

```text
QuestLoom/
├── docs/                 # Design and spec
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

## Getting Started

_Setup and run instructions will be added once the app is implemented. Tech stack: TypeScript, web-first, responsive; local-first persistence preferred for v1._

## License

TBD.
