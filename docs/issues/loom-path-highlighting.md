# Loom Path Highlighting

- The Loom view currently supports selecting a node to highlight its edges and clicking an edge to focus its source and target. As noted in the implementation plan, highlighting the **path between two selected nodes** is a follow-up item.
- Implement a way to select a start and end entity in the Loom and visually highlight one or more connecting paths between them (e.g., shortest path or all simple paths), so users can **follow a thread** across multiple hops.
- Ensure path highlighting remains performant for larger graphs and works well with existing interactions (node/edge selection, fit view, zoom/pan).
