# QuestLoom Design Specification

## Vision

QuestLoom is a companion web app for mystery and adventure games. It helps players track progress, organize information, and discover threads between entities, reducing cognitive load so they can focus on the game rather than remembering details.

## One-Line Pitch

A companion app for mystery and adventure games that lets users track quests, insights, items, maps, and threads between people and places.

## Differentiators (Killer Features)

**These differentiators are core to every product and design decision.** They define why users choose QuestLoom over other mapping or companion apps.

1. **Thread-oriented** — Clear visualization of relationships and pathways to navigate complex mysteries and spaces. Users can set a target and follow a thread to reach it. The **loom** (network/graph view) surfaces connections other apps ignore; competitors typically show all information on a map at once with no concept of a followable network.

2. **Contextual progression** — Automatically surface threads the user can follow based on the items and insights they currently have. Drives forward progress by highlighting what is actionable now, rather than a flat list of everything.

3. **Spoiler-friendly** — Information is hidden until the user has the required progression to uncover it. No accidental spoilers from seeing everything at once.

4. **User-driven logging** — The user drives the logging of progression, notes, and their own solutions for their playthrough. QuestLoom is not a fixed body of information to search and check off; it is a personal workspace for tracking and solving.

**Contrast with typical mapping apps** — Many surface all information on the map simultaneously, have no network of connections to follow, no spoiler-friendly hiding, and lack tools for personal progression, notes, and solving things for oneself. QuestLoom is built around threads, context, spoiler safety, and user-driven content.

## Core Principles

1. **Game-first** — Designed to sit alongside a game session, not replace it. Quick capture, minimal friction.
2. **Flexible** — Adapts to different game types: escape rooms, mystery boxes, tabletop RPGs, video game playthroughs.
3. **Persistent** — User data persists across sessions. Save and resume at any time.

## Scope

### In Scope

- **Quests** — Objectives, goals, and progress tracking
- **Insights** — Key information, lore you discover, and understanding that helps solve unknowns or advance objectives; optional linking to other entities
- **Items** — Inventory and key objects
- **Maps** — Spatial context and location tracking: image-based maps with zoom/pan, optional markers linked to entities (quests, insights, items, people, places), and a dedicated map view with context-menu-driven add/move/delete of markers.
- **Threads** — Relationships between people and places, and between any entities

### Out of Scope

- Real-time multi-user access
- Social features
- Game-specific integrations (e.g., direct API links to specific games)
- AI-assisted deduction or hints
- Mobile native apps (web-first; responsive design)

## Data Separation (Game vs Playthrough)

**Critical for architecture.** Data falls into two tiers; persistence and storage must respect this.

- **Game data (intrinsic)** — Data that defines the game world: the same across users and playthroughs (e.g. quest definitions, places, people, map structure, threads as world connections, insight/item definitions). Persisted with the game. When a user clears progress to start a new playthrough, this data **remains**; it is not tied to a single playthrough.

- **Playthrough data (user)** — Data that tracks a specific user’s progress and input for one playthrough: quest progress, inventory state, personal notes, and running investigations. Constrained to that playthrough and that user. **Never** persisted across playthroughs; when the user starts a new playthrough, this data is cleared or replaced. It must not leak between playthroughs.

Architectural decisions (storage, APIs, schemas) must separate game-level and playthrough-level data and ensure playthrough data is never shared or retained across playthroughs.

## Core Entities

| Entity  | Description                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------- |
| Quest   | An objective or goal with status and optional steps                                               |
| Insight | Key information, discovered lore, or understanding that helps solve unknowns or advance the story |
| Item    | A physical or logical object (inventory, key item)                                                |
| Map     | Spatial representation of locations                                                               |
| Person  | A character or NPC                                                                                |
| Place   | A location or room                                                                                |
| Thread  | A link between two entities (e.g., Person ↔ Place)                                                |

**Loom** — The network or graph view of threads. Users **follow a thread** using the loom to visualize relationships, progress quests, track down items, and make sense of lore and unknowns.

## User Flows (High Level)

1. **Capture** — Add a quest, insight, item, person, or place in a few taps
2. **Thread** — Link entities to create threads (e.g., "Suspect A was at Location B")
3. **Explore** — View maps, use the **loom** to follow threads and visualize relationships, track quest progress
4. **Resume** — Return to a saved session and pick up where you left off

---

_This document is the canonical product specification for QuestLoom. Implementations should align with this vision, scope, and differentiators._
