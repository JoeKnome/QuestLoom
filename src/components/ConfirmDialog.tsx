/**
 * In-app confirmation dialog. Use instead of window.confirm() so confirmations
 * work in embedded browsers (e.g. Cursor) where native dialogs may not appear.
 */

/**
 * Props for the ConfirmDialog component.
 */
export interface ConfirmDialogProps {
  /** When true, the dialog is visible. */
  isOpen: boolean
  /** Main message shown in the dialog. */
  message: string
  /** Label for the confirm (destructive) button. */
  confirmLabel?: string
  /** Label for the cancel button. */
  cancelLabel?: string
  /** Called when the user confirms. */
  onConfirm: () => void
  /** Called when the user cancels or clicks the overlay. */
  onCancel: () => void
  /** Optional title above the message. */
  title?: string
  /** When 'danger', the confirm button uses destructive styling. */
  variant?: 'default' | 'danger'
}

/**
 * Modal confirmation dialog with message, cancel and confirm buttons.
 * Renders nothing when open is false. Accessible (role="dialog", aria-modal).
 *
 * @param props - See ConfirmDialogProps
 */
export function ConfirmDialog({
  isOpen,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  title,
  variant = 'default',
}: ConfirmDialogProps): JSX.Element | null {
  if (!isOpen) return null

  const confirmClass =
    variant === 'danger'
      ? 'rounded border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
      : 'rounded border border-slate-300 bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'confirm-dialog-title' : undefined}
      aria-describedby="confirm-dialog-description"
      onClick={onCancel}
    >
      <div
        className="max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h2
            id="confirm-dialog-title"
            className="mb-2 text-lg font-semibold text-slate-900"
          >
            {title}
          </h2>
        ) : null}
        <p id="confirm-dialog-description" className="mb-4 text-slate-700">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className={confirmClass}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
