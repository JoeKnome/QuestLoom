# QuestLoom Data Models

Data models must support the product differentiators: **thread-oriented** (threads and targets), **contextual progression** (what the user can follow based on current items/insights), **spoiler-friendly** (visibility gated by progression), and **user-driven logging** (user-owned content).

## Data Separation: Game vs Playthrough

**Architecture must separate two tiers of data.** Persistence and APIs must reflect this; playthrough data must never be persisted or shared across playthroughs.

| Tier                        | Description                                                                                                                                                                                                                                    | Persistence                                | On "Clear progress / New playthrough"                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **Game data (intrinsic)**   | Data that defines the game world: same across users and playthroughs. Quest definitions, places, people, map structure, threads (world connections), insight/item definitions — the authored "world."                                          | Persisted with the game.                   | **Remains.** Not tied to a single playthrough.                |
| **Playthrough data (user)** | Data that tracks one user’s progress and input for one playthrough: quest progress (status, completed steps), inventory state (not acquired/acquired/used/lost), insight and person progress (status), personal notes, running investigations. | Scoped to a specific playthrough and user. | **Cleared or replaced.** Never persisted across playthroughs. |

- **Game data** survives when a user clears progress to start a new playthrough; it is the shared definition of the game.
- **Playthrough data** is constrained to that playthrough only; it must never leak between playthroughs or be retained when the user starts over.

Entity and schema design must distinguish which fields (or which entities) belong to game level vs playthrough level so storage and APIs can enforce this separation.

## Entity Overview

```text
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Quest   │     │ Insight  │     │  Item    │
└────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │
     │         ┌──────┴──────┐         │
     └────────►│   Thread    │◄────────┘
               └──────┬──────┘
     ┌────────────────┼────────────────┐
     │                │                │
┌────┴─────┐    ┌─────┴────┐    ┌──────┴─────┐
│  Person  │    │  Place   │    │    Map     │
└──────────┘    └──────────┘    └────────────┘
```

## Core Entities

### Quest

| Field      | Type     | Description                                   |
| ---------- | -------- | --------------------------------------------- |
| id         | string   | Unique identifier                             |
| title      | string   | Quest name                                    |
| status     | enum     | available \| active \| completed \| abandoned |
| giver      | id       | Reference to the source that gave the quest   |
| objectives | array    | Optional sub-objectives (labels and links)    |
| notes      | string   | Optional free-form notes                      |
| createdAt  | datetime | Creation timestamp                            |
| updatedAt  | datetime | Last update timestamp                         |

**Note:** In the implementation, status, objective completion, and notes are playthrough-scoped (stored in `QuestProgress`). Objectives can optionally reference an entity (`entityId`) and allowed statuses (`allowedStatuses`): **completability** is then derived (objective is completable when that entity is in the allowed set); **completion** remains manual (user checks the box) and is tracked per playthrough via `completedObjectiveIndexes` in `QuestProgress`, not on the quest definition itself. Objective dependencies are dual-written to threads (label `objective_requires`) so they appear in the Loom. The giver link is also represented by a thread (Quest → Person|Place) with reserved label `giver`; the UI dual-writes so the field and thread stay in sync.

### Insight

| Field     | Type     | Description                                                            |
| --------- | -------- | ---------------------------------------------------------------------- |
| id        | string   | Unique identifier                                                      |
| title     | string   | Short label                                                            |
| content   | string   | Full insight text (key info, lore, or description)                     |
| status    | enum     | unknown \| known \| irrelevant (playthrough-scoped in InsightProgress) |
| notes     | string   | Optional notes                                                         |
| createdAt | datetime | Creation timestamp                                                     |
| updatedAt | datetime | Last update timestamp                                                  |

### Item

| Field       | Type     | Description                                                                                            |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------ |
| id          | string   | Unique identifier                                                                                      |
| name        | string   | Item name                                                                                              |
| description | string   | Optional description                                                                                   |
| status      | enum     | not acquired \| acquired \| used \| lost (playthrough-scoped in ItemState)                             |
| notes       | string   | Optional notes                                                                                         |
| createdAt   | datetime | Creation timestamp                                                                                     |
| updatedAt   | datetime | Last update timestamp                                                                                  |

**Note:** Location is **thread-only** for all entities. Item (and Quest, Insight, Person) can be "located at" one or more Places via threads with subtype **LOCATION** (entity → Place). Multiple places per entity are allowed. Use `getEntityLocationPlaceIds(gameId, entityId)` to resolve locations.

### Person

| Field     | Type     | Description           |
| --------- | -------- | --------------------- |
| id        | string   | Unique identifier     |
| name      | string   | Character name        |
| notes     | string   | Optional notes        |
| createdAt | datetime | Creation timestamp    |
| updatedAt | datetime | Last update timestamp |

**Note:** Person status (alive \| dead \| unknown) is playthrough-scoped and stored in `PersonProgress`; see Playthrough data below.

### Place

| Field     | Type     | Description                                                  |
| --------- | -------- | ------------------------------------------------------------ |
| id        | string   | Unique identifier                                            |
| name      | string   | Location name                                                |
| notes     | string   | Optional notes                                               |
| map       | id       | Optional link to the map this place belongs to (for markers) |
| createdAt | datetime | Creation timestamp                                           |
| updatedAt | datetime | Last update timestamp                                        |

### Path

| Field       | Type     | Description                                |
| ----------- | -------- | ------------------------------------------ |
| id          | string   | Unique identifier                          |
| gameId      | string   | ID of the game this path belongs to        |
| name        | string   | Path name (e.g. "North corridor", "Ledge") |
| description | string   | Optional description                       |
| createdAt   | datetime | Creation timestamp                         |
| updatedAt   | datetime | Last update timestamp                      |

**Scope:** Game-scoped (intrinsic world structure). Paths connect **only** to Places. Connectivity is expressed as Place ↔ Thread ↔ Path ↔ Thread ↔ Place. A Path can be connected to **two or more** Places via multiple threads (subtype `connects_path`). Path **status** (restricted | opened | blocked) is playthrough-scoped and stored in PathProgress; it controls traversability for reachability (Phase 5.5). Paths can connect top-level map places to other top-level map places, acting as map-to-map transitions. Paths are eligible for map markers (same mechanism as other marker-eligible entities).

**Path status (PathProgress):** **Restricted** — untraversable unless requirements are met (e.g. locked door). **Opened** — traversable regardless of requirements (e.g. door unlocked). **Blocked** — untraversable regardless of requirements (e.g. bridge collapsed). Per-connection traversal: each Place–Path thread can carry optional traversal conditions (e.g. `requirementAllowedStatuses`); evaluation is directional (source→target). In Phase 5.5, path status and requirements together drive **reachability** from the playthrough’s current position.

### Map

| Field           | Type     | Description                                                     |
| --------------- | -------- | --------------------------------------------------------------- |
| id              | string   | Unique identifier                                               |
| name            | string   | Map label                                                       |
| imageSourceType | enum     | How the image is provided: url \| upload                        |
| imageUrl        | string   | HTTP(S) URL for the map image (when imageSourceType === url)    |
| imageBlobId     | string   | ID of uploaded image blob (when imageSourceType === upload)     |
| topLevelPlaceId | string   | ID of the top-level place representing this map in threads/loom |
| createdAt       | datetime | Creation timestamp                                              |
| updatedAt       | datetime | Last update timestamp                                           |

### MapMarker

| Field         | Type     | Description                                                                                                 |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| id            | string   | Unique identifier                                                                                           |
| gameId        | string   | ID of the game this marker belongs to                                                                       |
| mapId         | string   | ID of the map this marker is placed on                                                                      |
| playthroughId | string   | Optional playthrough ID; when set, the marker is scoped to a specific playthrough, otherwise game-shared    |
| entityType    | enum     | Entity type the marker represents: quest \| insight \| item \| person \| place \| path                      |
| entityId      | string   | ID of the entity this marker represents (must correspond to entityType)                                     |
| label         | string   | Optional short description to distinguish multiple markers for the same entity (e.g. specific rooms/events) |
| position      | object   | Logical coordinates in map space, e.g. `{ x: number, y: number }`; finite numbers not clamped to image size |
| createdAt     | datetime | Creation timestamp                                                                                          |
| updatedAt     | datetime | Last update timestamp                                                                                       |

**Rendering:** In the map view, `position.x` and `position.y` are interpreted as fractions of the map image’s intrinsic width and height (e.g. 0.5, 0.5 = center). Values may be outside 0–1 for periphery markers. The map image and markers are non-selectable (`user-select: none`).

### Thread

| Field                      | Type     | Description                                                                                                                                |
| -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| id                         | string   | Unique identifier                                                                                                                          |
| sourceId                   | id       | ID of source entity                                                                                                                        |
| sourceType                 | enum     | quest \| insight \| item \| person \| place                                                                                                |
| targetId                   | id       | ID of target entity                                                                                                                        |
| targetType                 | enum     | quest \| insight \| item \| person \| place                                                                                                |
| label                      | string   | Optional relationship label                                                                                                                |
| requirementAllowedStatuses | number[] | For labels `requires` and `objective_requires`: set of status enum values (target type) that satisfy the requirement. Omit = type default. |
| objectiveIndex             | number   | For label `objective_requires`: 0-based index of the quest objective this dependency belongs to.                                           |
| createdAt                  | datetime | Creation timestamp                                                                                                                         |

**Reserved thread subtypes/labels:** `giver` (Quest → Person|Place), `location` (Item → Place), `map` (Place → Map), **`requires`** (entity-level requirement), **`objective_requires`** (quest objective dependency), **`connects_path`** (Place–Path or Path–Place; path connectivity; cardinality 2+ places; optional per-connection traversal via requirementAllowedStatuses), **`direct_place_link`** (Place–Place with no Path; unimpeded movement, no requirements). Requirement/dependency threads are game-scoped. Default allowed sets per type: Item → [acquired], Insight → [known], Quest → [completed], Person → [alive].

## Relationships (Threads)

Threads link entities. When viewed as a network or graph, this view is called the **loom**; users follow threads using the loom to visualize relationships. The thread repository exposes `getThreadsFromEntity(gameId, entityId, playthroughId?)` (threads where the entity is source or target) and `deleteThreadsInvolvingEntity(gameId, entityId)` (used when an entity is deleted so threads are not orphaned).

- **Quest ↔ Insight** — Insights can support or relate to quests (key info, lore, understanding)
- **Quest ↔ Item** — Items may be required for or obtained during quests
- **Insight ↔ Item** — Insights may reference items
- **Person ↔ Place** — "Person was at Place" or "Person is from Place"
- **Person ↔ Person** — Optional: relationships between characters
- **Place ↔ Place** — Optional: adjacency or containment; **direct Place–Place** threads (subtype `direct_place_link`) represent unimpeded movement with no requirements. To introduce requirements between places, use a Path (Place–Path–Place) with status and requirement semantics instead.
- **Place ↔ Path** — Paths connect only to Places (subtype `connects_path`). A Path can have two or more Places; each link is a thread (Place–Path or Path–Place). Per-connection traversal requirements are optional on each thread (e.g. directional: key required one way, free the other). Paths can connect top-level map places for map-to-map transitions.
- **Item ↔ Place** — Items may be found at places. **Location rule:** Other entities (items, quests, insights, people) can only be **located at** a **Place**, not at a Path.
- **Map and Place** — Maps are view-only containers for images and markers; Places (including the map's top-level place) are the entities that appear in threads and the loom.

## Session / Game Container

For multiple games and playthroughs:

- **Game** — The intrinsic game world (definitions, places, people, map, threads). Persisted with the game; survives "clear progress."
- **Playthrough** — One user’s run of a game. Holds playthrough-only data (progress, inventory state, notes, investigations). Scoped to that playthrough; cleared or replaced when the user starts a new playthrough. Never persisted across playthroughs.

| Field     | Type     | Description           |
| --------- | -------- | --------------------- |
| id        | string   | Unique identifier     |
| name      | string   | Game/session name     |
| createdAt | datetime | Creation timestamp    |
| updatedAt | datetime | Last update timestamp |

Entities must be scoped to either the game (intrinsic) or a playthrough (user). Design schemas and references (e.g. `gameId`, `playthroughId`) so storage can enforce the separation.

## Playthrough-scoped progress

Status, objective completion, and notes for quests, and status/notes for insights, items, and persons are stored in playthrough-scoped tables (cleared when the playthrough is deleted or the user starts a new playthrough):

- **QuestProgress** — `playthroughId`, `questId`, `status` (available \| active \| completed \| abandoned), `completedObjectiveIndexes` (number[] of completed objective indexes), `notes`
- **InsightProgress** — `playthroughId`, `insightId`, `status` (unknown \| known \| irrelevant), `notes`
- **ItemState** — `playthroughId`, `itemId`, `status` (not acquired \| acquired \| used \| lost), `notes`
- **PersonProgress** — `playthroughId`, `personId`, `status` (alive \| dead \| unknown), `notes`
- **PathProgress** — `playthroughId`, `pathId`, `status` (restricted \| opened \| blocked). Default for new playthrough: treat missing row as restricted. Used by reachability logic (Phase 5.5) together with requirement threads to determine which paths are traversable from the current position.

Requirement and objective-completability checks use a **configurable allowed status set** per type (defaults: Item → [acquired], Insight → [known], Quest → [completed], Person → [alive]). Unavailability is derived from requirement threads (label `requires`), not stored. Quest "blocked" is replaced by derived unavailability (Phase 5.2).
