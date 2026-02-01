# QuestLoom Data Models

Data models must support the product differentiators: **thread-oriented** (threads and targets), **contextual progression** (what the user can follow based on current items/insights), **spoiler-friendly** (visibility gated by progression), and **user-driven logging** (user-owned content).

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

| Field       | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| id          | string   | Unique identifier                    |
| name        | string   | Item name                            |
| location    | id       | The place where the item is acquired |
| description | string   | Optional description                 |
| status      | enum     | possessed \| used \| lost \| other   |
| notes       | string   | Optional notes                       |
| createdAt   | datetime | Creation timestamp                   |
| updatedAt   | datetime | Last update timestamp                |

### Person

| Field     | Type     | Description           |
| --------- | -------- | --------------------- |
| id        | string   | Unique identifier     |
| name      | string   | Character name        |
| notes     | string   | Optional notes        |
| createdAt | datetime | Creation timestamp    |
| updatedAt | datetime | Last update timestamp |

### Place

| Field     | Type     | Description           |
| --------- | -------- | --------------------- |
| id        | string   | Unique identifier     |
| name      | string   | Location name         |
| notes     | string   | Optional notes        |
| map       | id       | Optional link to Map  |
| createdAt | datetime | Creation timestamp    |
| updatedAt | datetime | Last update timestamp |

### Map

| Field     | Type     | Description                        |
| --------- | -------- | ---------------------------------- |
| id        | string   | Unique identifier                  |
| name      | string   | Map label                          |
| imageUrl  | string   | URL or blob reference to map image |
| markers   | array    | Markers (placeId, position, label) |
| createdAt | datetime | Creation timestamp                 |
| updatedAt | datetime | Last update timestamp              |

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

Threads link entities. When viewed as a network or graph, this view is called the **loom**; users follow threads using the loom to visualize relationships.

- **Quest ↔ Insight** — Insights can support or relate to quests (key info, lore, understanding)
- **Quest ↔ Item** — Items may be required for or obtained during quests
- **Insight ↔ Item** — Insights may reference items
- **Person ↔ Place** — "Person was at Place" or "Person is from Place"
- **Person ↔ Person** — Optional: relationships between characters
- **Place ↔ Place** — Optional: adjacency or containment
- **Item ↔ Place** — Items may be found at places
- **Map ↔ Place** — Places can have map positions (markers or regions)

## Session / Game Container (Optional)

For multiple game support:

| Field     | Type     | Description           |
| --------- | -------- | --------------------- |
| id        | string   | Unique identifier     |
| name      | string   | Game/session name     |
| createdAt | datetime | Creation timestamp    |
| updatedAt | datetime | Last update timestamp |

All entities can optionally reference a `sessionId` to group them.
