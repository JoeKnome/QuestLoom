import { useCallback, useState } from 'react'
import { LocationPlacesEditor } from '../../components/LocationPlacesEditor'
import { syncLocationThreads } from '../../lib/location'
import { insightRepository } from '../../lib/repositories'
import type { GameId, PlaceId } from '../../types/ids'
import type { Insight } from '../../types/Insight'

/**
 * Props for InsightForm when creating a new insight.
 */
export interface InsightFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'
  /** Game ID the insight belongs to. */
  gameId: GameId
  /** Called after successful create. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for InsightForm when editing an existing insight.
 */
export interface InsightFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'
  /** The insight to edit. */
  insight: Insight
  /** Called after successful update. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for InsightForm.
 */
export type InsightFormProps = InsightFormCreateProps | InsightFormEditProps

/**
 * Form to create or edit an insight. Uses insightRepository only.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel.
 * @returns A JSX element representing the InsightForm component.
 */
export function InsightForm(props: InsightFormProps): JSX.Element {
  const [title, setTitle] = useState(
    props.mode === 'edit' ? props.insight.title : ''
  )
  const [content, setContent] = useState(
    props.mode === 'edit' ? props.insight.content : ''
  )
  const [locationPlaceIds, setLocationPlaceIds] = useState<PlaceId[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gameId = props.mode === 'create' ? props.gameId : props.insight.gameId

  /**
   * Handles the submission of the insight form.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedTitle = title.trim()
      if (!trimmedTitle) {
        setError('Enter a title.')
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        if (props.mode === 'create') {
          const insight = await insightRepository.create({
            gameId: props.gameId,
            title: trimmedTitle,
            content: content.trim(),
          })
          await syncLocationThreads(props.gameId, insight.id, locationPlaceIds)
        } else {
          await insightRepository.update({
            ...props.insight,
            title: trimmedTitle,
            content: content.trim(),
          })
          await syncLocationThreads(
            props.insight.gameId,
            props.insight.id,
            locationPlaceIds
          )
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save insight.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [title, content, locationPlaceIds, props]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="insight-title"
          className="block text-sm font-medium text-slate-700"
        >
          Title
        </label>
        <input
          id="insight-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short label"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
          aria-describedby={error ? 'insight-form-error' : undefined}
        />
      </div>
      <div>
        <label
          htmlFor="insight-content"
          className="block text-sm font-medium text-slate-700"
        >
          Content
        </label>
        <textarea
          id="insight-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Key info, lore, or description"
          rows={4}
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>
      <LocationPlacesEditor
        gameId={gameId}
        entityId={props.mode === 'edit' ? props.insight.id : undefined}
        value={locationPlaceIds}
        onChange={setLocationPlaceIds}
        disabled={isSubmitting}
      />
      {error && (
        <p
          id="insight-form-error"
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Saving…'
            : props.mode === 'create'
              ? 'Create'
              : 'Save'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={isSubmitting}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
