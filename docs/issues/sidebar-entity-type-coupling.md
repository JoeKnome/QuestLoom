# Sidebar Entity Type Coupling

- Within GameViewSidebar.tsx, the hard coupling of the sidebar tabs to EntityType is not ideal, requiring an override to include the critical Loom view, and preventing extension for any tabs not tied to entities. This should be decoupled such that any given view could be linked from the sidebar.
