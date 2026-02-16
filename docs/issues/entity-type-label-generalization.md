# Entity Type Label Generalization

- In GameViewSection.ts, GAME_VIEW_SECTION_LABELS is much better used as a generalized mapping of the entity type to the human-readable string, for all purposes where this is displayed. This should be keyed off an enum which has all requisite entity types, rather than a different string.
- In ThreadForm.tsx, EntityPicker.tsx, the entity labels sould reuse the above mapping instead.
