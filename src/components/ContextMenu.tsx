import { useEffect, useRef } from 'react'

/**
 * Single context menu item.
 */
export interface ContextMenuItem {
  /** Label shown in the menu. */
  label: string
  /** Called when the item is activated. */
  onClick: () => void
}

/**
 * Props for the ContextMenu component.
 */
export interface ContextMenuProps {
  /** Position in client coordinates (e.g. from event.clientX/clientY). */
  position: { x: number; y: number }
  /** Menu items. */
  items: ContextMenuItem[]
  /** Called when the menu should close (outside click, Escape, or after action). */
  onClose: () => void
  /** Optional aria-label for the menu. */
  'aria-label'?: string
}

/**
 * Simple positioned context menu. Renders with position: fixed at the given
 * client coordinates. Closes on outside click or Escape. Does not clamp position
 * to viewport; caller may adjust if needed.
 *
 * @param props.position - Client x, y for menu anchor.
 * @param props.items - Label and onClick for each item.
 * @param props.onClose - Close callback.
 * @param props.aria-label - Optional accessible name.
 * @returns A JSX element representing the context menu.
 */
export function ContextMenu({
  position,
  items,
  onClose,
  'aria-label': ariaLabel = 'Context menu',
}: ContextMenuProps): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handlePointerDown = (e: PointerEvent) => {
      const el = menuRef.current
      if (el && !el.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={ariaLabel}
      className="fixed z-50 min-w-[10rem] rounded border border-slate-200 bg-white py-1 shadow-lg"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          role="menuitem"
          className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100"
          onClick={() => {
            item.onClick()
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
