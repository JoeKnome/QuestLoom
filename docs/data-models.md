# QuestLoom Data Models

Data models must support the product differentiators: **thread-oriented** (threads and targets), **contextual progression** (what the user can follow based on current items/insights), **spoiler-friendly** (visibility gated by progression), and **user-driven logging** (user-owned content).

## Data Separation: Game vs Playthrough

**Architecture must separate two tiers of data.** Persistence and APIs must reflect this; playthrough data must never be persisted or shared across playthroughs.

| Tier                        | Description                                                                                                                                                                                           | Persistence                                | On "Clear progress / New playthrough"                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **Game data (intrinsic)**   | Data that defines the game world: same across users and playthroughs. Quest definitions, places, people, map structure, threads (world connections), insight/item definitions — the authored "world." | Persisted with the game.                   | **Remains.** Not tied to a single playthrough.                |
| **Playthrough data (user)** | Data that tracks one user’s progress and input for one playthrough: quest progress (status, completed steps), inventory state (possessed, used), personal notes, running investigations.              | Scoped to a specific playthrough and user. | **Cleared or replaced.** Never persisted across playthroughs. |

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

| Field      | Type     | Description                                 |
| ---------- | -------- | ------------------------------------------- |
| id         | string   | Unique identifier                           |
| title      | string   | Quest name                                  |
| status     | enum     | active \| completed \| blocked              |
| giver      | id       | Reference to the source that gave the quest |
| objectives | array    | Optional sub-objectives with completion     |
| notes      | string   | Optional free-form notes                    |
| createdAt  | datetime | Creation timestamp                          |
| updatedAt  | datetime | Last update timestamp                       |

**Note:** In the implementation, status and notes are playthrough-scoped (stored in `QuestProgress`). Objective completion is currently on the quest definition; for strict data separation it could later move to QuestProgress (e.g. `completedObjectives: boolean[]`). The giver link is also represented by a thread (Quest → Person|Place) with reserved label `giver`; the UI dual-writes so the field and thread stay in sync.

### Insight

| Field     | Type     | Description                                        |
| --------- | -------- | -------------------------------------------------- |
| id        | string   | Unique identifier                                  |
| title     | string   | Short label                                        |
| content   | string   | Full insight text (key info, lore, or description) |
| status    | enum     | active \| resolved \| irrelevant                   |
| notes     | string   | Optional notes                                     |
| createdAt | datetime | Creation timestamp                                 |
| updatedAt | datetime | Last update timestamp                              |

### Item

| Field       | Type     | Description                                                                                            |
| ----------- | -------- | ------------------------------------------------------------------------------------------------------ |
| id          | string   | Unique identifier                                                                                      |
| name        | string   | Item name                                                                                              |
| location    | id       | The place where the item is acquired (also represented by a thread Item → Place with label `location`) |
| description | string   | Optional description                                                                                   |
| status      | enum     | possessed \| used \| lost \| other                                                                     |
| notes       | string   | Optional notes                                                                                         |
| createdAt   | datetime | Creation timestamp                                                                                     |
| updatedAt   | datetime | Last update timestamp                                                                                  |

### Person

| Field     | Type     | Description           |
| --------- | -------- | --------------------- |
| id        | string   | Unique identifier     |
| name      | string   | Character name        |
| notes     | string   | Optional notes        |
| createdAt | datetime | Creation timestamp    |
| updatedAt | datetime | Last update timestamp |

### Place

| Field     | Type     | Description                                                  |
| --------- | -------- | ------------------------------------------------------------ |
| id        | string   | Unique identifier                                            |
| name      | string   | Location name                                                |
| notes     | string   | Optional notes                                               |
| map       | id       | Optional link to the map this place belongs to (for markers) |
| createdAt | datetime | Creation timestamp                                           |
| updatedAt | datetime | Last update timestamp                                        |

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
| entityType    | enum     | Entity type the marker represents: quest \| insight \| item \| person \| place                              |
| entityId      | string   | ID of the entity this marker represents (must correspond to entityType)                                     |
| label         | string   | Optional short description to distinguish multiple markers for the same entity (e.g. specific rooms/events) |
| position      | object   | Logical coordinates in map space, e.g. `{ x: number, y: number }`; finite numbers not clamped to image size |
| createdAt     | datetime | Creation timestamp                                                                                          |
| updatedAt     | datetime | Last update timestamp                                                                                       |

### Thread

| Field      | Type     | Description                                 |
| ---------- | -------- | ------------------------------------------- |
| id         | string   | Unique identifier                           |
| sourceId   | id       | ID of source entity                         |
| sourceType | enum     | quest \| insight \| item \| person \| place |
| targetId   | id       | ID of target entity                         |
| targetType | enum     | quest \| insight \| item \| person \| place |
| label      | string   | Optional relationship label                 |
| createdAt  | datetime | Creation timestamp                          |

## Relationships (Threads)

Threads link entities. When viewed as a network or graph, this view is called the **loom**; users follow threads using the loom to visualize relationships. The thread repository exposes `getThreadsFromEntity(gameId, entityId, playthroughId?)` (threads where the entity is source or target) and `deleteThreadsInvolvingEntity(gameId, entityId)` (used when an entity is deleted so threads are not orphaned).

- **Quest ↔ Insight** — Insights can support or relate to quests (key info, lore, understanding)
- **Quest ↔ Item** — Items may be required for or obtained during quests
- **Insight ↔ Item** — Insights may reference items
- **Person ↔ Place** — "Person was at Place" or "Person is from Place"
- **Person ↔ Person** — Optional: relationships between characters
- **Place ↔ Place** — Optional: adjacency or containment
- **Item ↔ Place** — Items may be found at places
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
