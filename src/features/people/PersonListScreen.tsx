import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EntityConnections } from '../../components/EntityConnections'
import { personRepository } from '../../lib/repositories'
import type { GameId, PersonId } from '../../types/ids'
import type { Person } from '../../types/Person'
import { PersonForm } from './PersonForm'

/**
 * Props for the PersonListScreen component.
 */
export interface PersonListScreenProps {
  /** Current game ID. */
  gameId: GameId
  /** Current playthrough ID (unused for people; kept for consistent GameViewContent interface). */
  playthroughId: string | null
}

/**
 * List and CRUD screen for people (characters) in the current game.
 * Shows a list of persons with create, edit, and delete. Uses personRepository only.
 *
 * @param props.gameId - Game to scope the list
 * @param props.playthroughId - Unused; people are game-scoped
 * @returns A JSX element representing the PersonListScreen component.
 */
export function PersonListScreen({
  gameId,
  playthroughId,
}: PersonListScreenProps): JSX.Element {
  const [persons, setPersons] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; person: Person } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<PersonId | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  /**
   * Loads the people for the current game.
   */
  const loadPersons = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await personRepository.getByGameId(gameId)
      setPersons(list)
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    loadPersons()
  }, [loadPersons])

  /**
   * Handles the confirmation of deleting a person.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    await personRepository.delete(deleteTarget)
    setDeleteTarget(null)
    loadPersons()
  }, [deleteTarget, loadPersons])

  if (isLoading) {
    return <p className="text-slate-500">Loading people…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-slate-800">People</h3>
        <button
          type="button"
          onClick={() => setFormState({ type: 'create' })}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New person
        </button>
      </div>

      {formState !== null ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {formState.type === 'create' ? (
            <PersonForm
              mode="create"
              gameId={gameId}
              onSaved={() => {
                setFormState(null)
                loadPersons()
              }}
              onCancel={() => setFormState(null)}
            />
          ) : (
            <PersonForm
              mode="edit"
              person={formState.person}
              onSaved={() => {
                setFormState(null)
                loadPersons()
              }}
              onCancel={() => setFormState(null)}
            />
          )}
        </div>
      ) : null}

      {persons.length === 0 && formState === null ? (
        <p className="text-slate-500">No people yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {persons.map((person) => {
            const isExpanded = expandedId === person.id
            return (
              <li
                key={person.id}
                className="rounded border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{person.name}</p>
                    {person.notes ? (
                      <p className="truncate text-sm text-slate-600">
                        {person.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="ml-2 flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : person.id)
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                      aria-expanded={isExpanded}
                    >
                      Connections
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState({ type: 'edit', person })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(person.id)}
                      className="rounded border border-red-300 bg-white px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="mt-2">
                    <EntityConnections
                      gameId={gameId}
                      entityId={person.id}
                      playthroughId={playthroughId}
                      entityDisplayName={person.name}
                    />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete person"
        message="Are you sure you want to delete this person? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
