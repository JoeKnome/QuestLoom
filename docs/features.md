# QuestLoom Feature Specification

## Differentiators (Core to Every Decision)

- **Thread-oriented** — Clear visualization of relationships and pathways; set a target and follow a thread to reach it. Loom surfaces a followable network, not a flat map of everything.
- **Contextual progression** — Surface threads the user can follow based on current items and insights; drive progress by highlighting what is actionable now.
- **Spoiler-friendly** — Hide information until the user has the required progression to uncover it.
- **User-driven logging** — User drives progression, notes, and their own solutions; not a fixed checklist to search and check off.

## Feature List

### Quest Tracking

- Create and name quests
- Add steps or sub-objectives to a quest
- Link insights and required items to quests
- Mark quests or steps as complete

### Insight Management

- Track key information, lore, and understanding that helps solve unknowns or advance objectives
- Add insights with title and description
- Associate insights with quests
- Link insights to people, places, or other insights
- Mark insights as unresolved, resolved, or irrelevant
- Optional categorization or tagging

### Item / Inventory

- Add items with name and optional description
- Track item status (in possession, used, lost, etc.)
- Link items to quests or insights

### Maps

- Create or upload maps (image-based initially)
- Add markers for places, items, or points of interest
- Link map locations to Place entities
- Multiple maps per game

### People & Places

- Add people (characters, NPCs) with name and notes
- Add places (locations, rooms) with name and notes
- Create threads between people and places
- Add required items or insights to transitions between places (e.g. keys required for locked doors)
- View the loom (thread network) or thread list

### Threads

- Create bidirectional or directional links (threads) between entities
- Thread types: Person ↔ Place, Insight → Quest, Item → Insight, etc.
- View entities by thread (e.g., "all people at this place")
- **Loom** — View threads as a network/graph; set a target and follow a thread to reach it; clear visualization of relationships and pathways
- **Contextual progression** — Surface only threads the user can currently follow (based on items/insights they have) to drive actionable progress
- **Spoiler-friendly** — Hide entities, insights, or thread details until the user has the required progression to uncover them
- **User-driven** — All progression information is created and owned by the user for their playthrough

### Session & Persistence

- Save all data locally (or to backend)
- Resume previous sessions
- **Game vs playthrough:** Game (intrinsic) data is persisted with the game and remains when the user clears progress. Playthrough data (progress, inventory, notes, investigations) is scoped to that playthrough only and is cleared or replaced when the user starts a new playthrough; it must never persist across playthroughs.

---

## User Stories

### As a player, I want to

1. **Quickly add an insight** so I don't forget important information, lore, or understanding mid-game.
2. **Link a person to a place** so I can track who was where.
3. **See my active quests** so I know what I'm working toward.
4. **Mark a quest step complete** so I can track progress.
5. **View a map with markers** so I understand spatial relationships.
6. **Connect an insight to a quest** so I remember which insights matter for which objectives.
7. **Return to my session later** so I can pick up the game another day.
8. **See threads for an entity** (or use the loom to follow a thread) so I can explore relationships (e.g., "What do I know about this person?").
9. **See things I'm able to do next** so I can see options for how to progress.

---

## Acceptance Criteria Template

For each feature, acceptance criteria should specify:

- [ ] User can perform the core action (create, edit, delete, link)
- [ ] Data persists correctly
- [ ] UI is clear and sufficiently usable
- [ ] Edge cases (empty state, long text) are handled
