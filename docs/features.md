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
- Link insights and required items to quests (entity-level "requires" threads; configurable allowed status set per type)
- Quest objectives can link to an entity: completability is derived when that entity is in an allowed status set; completion remains manual (checkbox). Objective dependencies appear in the Loom as "Objective" edges.
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

- **Map selection and view** — Maps sidebar tab shows a grid of map tiles (name + image preview). Clicking a tile opens the map view for that map; clicking the Maps tab when already in map view returns to the grid. Last viewed map is remembered when switching from other tabs.
- **Map image** — Create or edit a map with an image from: URL (with validation and preview), file upload (PNG/JPEG/WebP), or drag-and-drop. Image is persisted via the map repository; uploaded blobs are stored and cleaned up on map delete or source change.
- **Map view** — Zoom (wheel, pinch, toolbar) and pan (click-and-drag; middle mouse always pans). Reset view fits the map to the viewport. Zoom/pan state is preserved per map when switching tabs.
- **Top-level place per map** — Each map has exactly one associated top-level place (e.g. "Map: Tavern District") created and renamed in lockstep with the map. Maps do not appear as Loom nodes or thread endpoints; places (including each map’s top-level place) represent locations in the Loom and in threads.
- **Map markers** — Markers link a map location (logical x,y) to an entity (quest, insight, item, person, or place). Markers show a type-colored badge with the entity’s first letter and a tooltip with the entity name (and optional label).
- **Marker interactions** — Right-click (or long-press) on the map opens a context menu: add a marker for an existing entity (picker) or create a new entity and place its marker. Right-click on a marker: move marker (cursor-follow then click to place; ESC cancels), delete marker only, or delete marker and entity (with confirmation and full cascade). Pan is default; moving a marker requires the explicit "Move marker" action.
- Multiple maps per game.

### People & Places

- Add people (characters, NPCs) with name and notes
- Add places (locations, rooms) with name and notes
- Create threads between people and places
- Add required items or insights to transitions between places (e.g. keys required for locked doors)
- View the loom (thread network) or thread list

### Threads

- Create bidirectional or directional links (threads) between entities
- Reserved labels: "Requires" (entity-level requirement; source unavailable until target is in allowed status set), "Objective requirement" (quest objective dependency). Both appear in the Loom with distinct labels/styling.
- **Entity-level requirements** are created and edited from each entity's detail view: expand a quest, insight, item, person, or place in its list and use the Requirements block (Add requirement, Edit, Delete). The Loom tab shows the graph; there is no separate Thread list for creating requirements.
- Thread types: Person ↔ Place, Insight → Quest, Item → Insight, etc.
- View entities by thread (e.g., "all people at this place")
- **Loom** — View threads as a network/graph; set a target and follow a thread to reach it; clear visualization of relationships and pathways
- **Paths and connectivity** — Paths appear in the Loom as nodes that connect places; direct Place–Place links and Place–Path connections are styled based on traversability (opened vs blocked/restricted), using Path status and requirement evaluation so the graph reflects where the player can currently move.
- **Current position and reachability** — Per playthrough, the player has a current position (a Place). From that position, a reachability engine follows direct Place–Place links and traversable Paths (status + requirements) to derive which places are reachable; later features use this to drive availability and progression.
- **Contextual progression** — Surface only threads the user can currently follow (based on items/insights they have and where they can currently reach) to drive actionable progress
- **Spoiler-friendly** — Hide entities, insights, or thread details until the user has the required progression to uncover them
- **User-driven** — All progression information is created and owned by the user for their playthrough

### Session & Persistence

- Save all data locally (or to backend)
- Resume previous sessions
- **Game vs playthrough:** Game (intrinsic) data is persisted with the game and remains when the user clears progress. Playthrough data (progress, inventory, notes, investigations) is scoped to that playthrough only and is cleared or replaced when the user starts a new playthrough; it must never persist across playthroughs.
- User can delete a game (with confirmation); all associated playthroughs are removed.
- Debug utilities: purge local database; purge app localStorage (current game/playthrough selection).

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
