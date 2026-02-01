# QuestLoom Code Standards

This document defines the code standards and conventions for the QuestLoom codebase. All contributors and AI-assisted code generation must adhere to these standards.

---

## 1. Linting and Formatting

### Prettier

All code **must** pass Prettier formatting. The project uses the following configuration (`.prettierrc`):

| Option          | Value   |
| --------------- | ------- |
| `semi`          | `false` |
| `singleQuote`   | `true`  |
| `tabWidth`      | `2`     |
| `trailingComma` | `es5`   |

- No semicolons at end of statements
- Single quotes for strings
- 2 spaces for indentation
- Trailing commas where valid in ES5

**Enforcement:** Run `npm run format` (or equivalent) before committing. Configure your editor to format on save.

### ESLint

All code **must** pass ESLint with no errors. The project uses:

- TypeScript ESLint (recommended rules)
- React Hooks (recommended rules)
- React Refresh (warn on invalid exports)
- `eslint-config-prettier` (disables conflicting style rules)

**Enforcement:** Run `npm run lint` before committing. Fix all errors; treat warnings seriously.

---

## 2. Documentation Comments

All code **must** have full documentation comments. This applies to:

- **Exported functions** — JSDoc with `@param`, `@returns`, and `@throws` where applicable
- **Exported classes** — JSDoc describing purpose; every property and method must have documentation
- **Exported interfaces/types** — JSDoc describing purpose; every property and method must have documentation
- **Exported components** — JSDoc describing props and behavior
- **Exported constants** — Brief JSDoc describing meaning and usage

**Example — Function:**

```ts
/**
 * Converts a thread ID to a display-friendly label.
 *
 * @param threadId - The unique identifier of the thread
 * @param fallback - Optional fallback when the thread is not found
 * @returns The display label or fallback
 */
export function getThreadLabel(threadId: string, fallback?: string): string {
  // ...
}
```

**Example — Component:**

```tsx
/**
 * Renders a single quest card with status, title, and actions.
 *
 * @param props.title - The quest title
 * @param props.status - Current completion status
 * @param props.onStatusChange - Callback when status changes
 */
export function QuestCard({
  title,
  status,
  onStatusChange,
}: QuestCardProps): JSX.Element {
  // ...
}
```

**Example — Type/Interface:**

```ts
/**
 * Represents a link between two entities in the loom graph.
 *
 * @property from - ID of the source entity
 * @property to - ID of the target entity
 * @property type - The kind of relationship
 */
export interface Thread {
  from: string
  to: string
  type: ThreadType
}
```

---

## 3. File and Entity Organization

**One entity per file.** Do not place multiple top-level interfaces, classes, or components in the same file unless one exists solely to support the other (e.g., a small helper type used only by the main export).

**Rules:**

- One primary export per file (the main interface, class, component, or function)
- Supporting types/helpers may live in the same file **only if** they are:
  - Used exclusively by the primary export
  - Not intended for reuse elsewhere
- When in doubt, create a separate file

**Naming:**

- Filenames match the primary export: `QuestCard.tsx` exports `QuestCard`
- Use PascalCase for components and classes; camelCase for utilities and hooks

**Directory structure (as per architecture):**

- `src/components/` — Reusable UI components
- `src/features/` — Feature-specific modules
- `src/hooks/` — Custom hooks
- `src/lib/` — Third-party config and core libraries
- `src/stores/` — State management
- `src/types/` — Shared types and interfaces
- `src/utils/` — Pure utility functions

---

## 4. General Software Engineering Practices

### Naming

- Use descriptive, domain-aligned names (Quest, Insight, Thread, etc.)
- Avoid abbreviations except widely understood ones (e.g., `id`, `max`, `min`)
- Boolean variables: `is*`, `has*`, `should*`, `can*`

### Types

- Prefer TypeScript strict mode; avoid `any` unless explicitly justified
- Use interfaces for object shapes; use type aliases for unions/intersections
- Export types from `src/types/` when used across features

### Components

- Prefer function components and hooks
- Keep components focused; split when they grow beyond ~150–200 lines
- Colocate styles or use shared design tokens; avoid ad-hoc magic values

### State and Data

- Respect the **data separation** principle: game (intrinsic) vs playthrough data
- Keep state close to where it’s used; lift only when necessary
- Prefer explicit, predictable data flow over deep prop drilling

### Error Handling

- Handle errors at boundaries; avoid swallowing exceptions
- Provide user-facing feedback for recoverable errors
- Log unexpected errors for debugging

### Testing (when applicable)

- Write tests for critical paths and business logic
- Keep tests readable and maintainable
- Use consistent naming (e.g., `describe`/`it` or `test`)

### Performance

- Avoid unnecessary re-renders (memo, useMemo, useCallback where justified)
- Lazy-load routes or heavy features when appropriate
- Prefer composition over inheritance

### Security and Privacy

- Never commit secrets or API keys
- Validate and sanitize user input
- Follow least-privilege for data access

---

## 5. Project-Specific Considerations

- **Thread-oriented design:** Code should support following threads and visualizing relationships.
- **Contextual progression:** Surface actionable threads based on current state.
- **Spoiler-friendly:** Hide information until the user has the required progression.
- **User-driven logging:** Design for user-initiated updates, not fixed checklists.

Refer to `docs/design-spec.md`, `docs/features.md`, and `docs/data-models.md` for domain and feature details.
