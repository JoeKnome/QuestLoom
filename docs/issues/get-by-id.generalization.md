# Get By ID Generalization

- Currently getting an entity by ID requires knowing what entity type it is so that the correct repository can be targeted, or else guessing and checking until the entity is found. This is an issue in cases where multiple entity types are possible to link by ID, and should ideally be improved so that entities of any type can be easily found.
  - For example, in getEntityDisplayName.ts, the specialized function getGiverDisplayName should not be necessary. It's repetitive and suboptimal logic that will quickly get out of hand as more links between entities are created.
  - This could be solved either by having another data store that stores a mapping of entity IDs to their types, or by adding a type identifier into the ID string so that it has more semantic meaning, or another suitable solution as deemed appropriate.
