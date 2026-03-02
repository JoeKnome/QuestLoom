/**
 * Contextual progression: actionable entities and route edges.
 * Computes "what you can do next" from playthrough state, position, and reachability.
 */

import { EntityType } from '../../types/EntityType'
import { PathStatus } from '../../types/PathStatus'
import { QuestStatus } from '../../types/QuestStatus'
import { ItemStatus } from '../../types/ItemStatus'
import { InsightStatus } from '../../types/InsightStatus'
import type { GameId, PlaceId, PlaythroughId } from '../../types/ids'
import {
  checkEntityAvailability,
  checkEntityAvailabilityWithReachability,
  getObjectiveCompletability,
} from '../requirements'
import { getEntityLocationPlaceIds } from '../location'
import {
  insightRepository,
  itemRepository,
  pathRepository,
  placeRepository,
  questRepository,
  threadRepository,
} from '../repositories'
import { getEntityDisplayName } from '../../utils/getEntityDisplayName'
import { getEntityTypeFromId } from '../../utils/parseEntityId'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import type { Path } from '../../types/Path'

/** One actionable item for display (e.g. in Oracle). */
export interface ActionableEntity {
  /** Typed entity ID. */
  entityId: string

  /** Entity type. */
  entityType: EntityType

  /** Display name (quest title, item name, etc.). */
  label: string

  /** Short action label (e.g. "Start quest", "Acquire item"). */
  actionLabel: string

  /** Optional objective index for quest objectives; used for "Complete objective". */
  objectiveIndex?: number
}

/**
 * Builds a map of path IDs to their traversability status.
 * 
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID.
 * @param paths - All paths for the game.
 * @returns A map of path IDs to their traversability status.
 */
async function buildPathTraversabilityMap(
  gameId: GameId,
  playthroughId: PlaythroughId,
  paths: Path[]
): Promise<Map<string, boolean>> {
  // Get path progress for the playthrough.
  const progressList =
    await pathRepository.getAllProgressForPlaythrough(playthroughId)

  // Map path IDs to their progress status.
  const statusById = new Map<string, PathStatus>()
  for (const row of progressList as { pathId: string; status: PathStatus }[]) {
    statusById.set(row.pathId, row.status)
  }

  // Check availability of each path.
  const results = await Promise.all(
    paths.map(async (p) => {
      const r = await checkEntityAvailability(gameId, playthroughId, p.id)
      return { id: p.id, available: r.available }
    })
  )
  
  // Map path IDs to their availability status.
  const pathAvailabilityById = new Map<string, boolean>()
  for (const r of results) {
    pathAvailabilityById.set(r.id, r.available)
  }
  // Map path IDs to their traversability status.
  const traversableById = new Map<string, boolean>()
  for (const p of paths) {
    const status = statusById.get(p.id) ?? PathStatus.RESTRICTED
    if (status === PathStatus.BLOCKED) {
      traversableById.set(p.id, false)
    } else if (status === PathStatus.OPENED) {
      traversableById.set(p.id, true)
    } else {
      // If path is not blocked or opened, check if it is available.
      traversableById.set(p.id, pathAvailabilityById.get(p.id) ?? false)
    }
  }
  // Return the map of path IDs to their traversability status.
  return traversableById
}

/**
 * Builds traversable place graph with thread IDs for each step.
 * 
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID.
 * @param placeIds - All place IDs for the game.
 * @param traversableByPathId - A map of path IDs to their traversability status.
 * @returns A map of place IDs to their neighbors and thread IDs.
 */
async function buildTraversableGraphWithThreadIds(
  gameId: GameId,
  playthroughId: PlaythroughId,
  placeIds: Set<PlaceId>,
  traversableByPathId: Map<string, boolean>
): Promise<Map<PlaceId, Array<{ neighbor: PlaceId; threadIds: string[] }>>> {
  // Get all threads for the game.
  const threads = await threadRepository.getByGameId(gameId, playthroughId)

  // Map place IDs to their neighbors and thread IDs.
  const adjacency = new Map<
    PlaceId,
    Array<{ neighbor: PlaceId; threadIds: string[] }>
  >()

  // Initialize the adjacency map with empty arrays for each place ID.
  for (const id of placeIds) {
    adjacency.set(id, [])
  }

  // Path endpoints: pathId -> Set<PlaceId>, and for each (path, place) we need the thread id
  const pathToPlacesAndThreads = new Map<
    string,
    Array<{ placeId: PlaceId; threadId: string }>
  >()

  // Process each thread.
  for (const thread of threads) {
    const subtype = thread.subtype

    // If thread is a direct place link, add the source and target places to the adjacency map.
    if (subtype === ThreadSubtype.DIRECT_PLACE_LINK) {
      const sourceType = getEntityTypeFromId(thread.sourceId)
      const targetType = getEntityTypeFromId(thread.targetId)
      if (sourceType === EntityType.PLACE && targetType === EntityType.PLACE) {
        const sourceId = thread.sourceId as PlaceId
        const targetId = thread.targetId as PlaceId
        if (placeIds.has(sourceId) && placeIds.has(targetId)) {
          adjacency
            .get(sourceId)
            ?.push({ neighbor: targetId, threadIds: [thread.id] })
          adjacency
            .get(targetId)
            ?.push({ neighbor: sourceId, threadIds: [thread.id] })
        }
      }
      continue
    }

    // If thread connects a path, add the source and target places to the adjacency map.
    if (subtype === ThreadSubtype.CONNECTS_PATH) {
      // Get the source and target entity types.
      const sourceType = getEntityTypeFromId(thread.sourceId)
      const targetType = getEntityTypeFromId(thread.targetId)
      const isSourcePath = sourceType === EntityType.PATH
      const isTargetPath = targetType === EntityType.PATH
      if (!isSourcePath && !isTargetPath) continue

      // Get the path ID.
      const pathId = isSourcePath ? thread.sourceId : thread.targetId

      // Get the place ID.
      const placeId = (
        isSourcePath ? thread.targetId : thread.sourceId
      ) as PlaceId

      // If the place ID is not in the set of place IDs, continue.
      if (!placeIds.has(placeId)) continue

      // Get the list of places and threads for the path.
      let list = pathToPlacesAndThreads.get(pathId)

      // If the list is not found, create it.
      if (!list) {
        list = []
        pathToPlacesAndThreads.set(pathId, list)
      }

      // Add the place and thread ID to the list.
      list.push({ placeId, threadId: thread.id })
    }
  }

  // For each traversable path, connect all its endpoint places (bidirectional) with both thread IDs
  for (const [pathId, placesAndThreads] of pathToPlacesAndThreads.entries()) {
    if (!traversableByPathId.get(pathId)) continue

    // Get the thread IDs for the path.
    const threadIds = placesAndThreads.map((x) => x.threadId)
    
    // Get the places for the path.
    const places = placesAndThreads.map((x) => x.placeId)

    // Connect all the places with each other.
    for (let i = 0; i < places.length; i += 1) {
      for (let j = i + 1; j < places.length; j += 1) {
        const a = places[i]
        const b = places[j]
        adjacency.get(a)?.push({ neighbor: b, threadIds })
        adjacency.get(b)?.push({ neighbor: a, threadIds })
      }
    }
  }

  return adjacency
}

/**
 * BFS from startPlaceId; returns for each reachable place the set of thread IDs on one shortest path.
 * 
 * @param startPlaceId - The starting place ID.
 * @param adjacency - A map of place IDs to their neighbors and thread IDs.
 * @returns A map of place IDs to the set of thread IDs on one shortest path.
 */
function shortestPathThreadIds(
  startPlaceId: PlaceId,
  adjacency: Map<PlaceId, Array<{ neighbor: PlaceId; threadIds: string[] }>>
): Map<PlaceId, Set<string>> {
  const result = new Map<PlaceId, Set<string>>()
  result.set(startPlaceId, new Set())
  const queue: PlaceId[] = [startPlaceId]
  const visited = new Set<PlaceId>([startPlaceId])

  while (queue.length > 0) {
    const current = queue.shift() as PlaceId
    const currentThreadIds = result.get(current) ?? new Set()
    const neighbors = adjacency.get(current) ?? []
    for (const { neighbor, threadIds } of neighbors) {
      if (visited.has(neighbor)) continue
      visited.add(neighbor)
      const nextSet = new Set(currentThreadIds)
      for (const t of threadIds) nextSet.add(t)
      result.set(neighbor, nextSet)
      queue.push(neighbor)
    }
  }
  return result
}

/**
 * Returns actionable entities: available and in a "next step" state.
 *
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID.
 * @param reachablePlaceIds - Reachable place IDs from current position.
 * @returns List of actionable entities with labels.
 */
export async function getActionableEntities(
  gameId: GameId,
  playthroughId: PlaythroughId,
  reachablePlaceIds: Set<PlaceId>
): Promise<ActionableEntity[]> {
  // Get all quests, insights, items, and paths for the game.
  const [quests, insights, items, paths] = await Promise.all([
    questRepository.getByGameId(gameId),
    insightRepository.getByGameId(gameId),
    itemRepository.getByGameId(gameId),
    pathRepository.getByGameId(gameId),
  ])

  // Get all quest progress for the playthrough.
  const progressList =
    await questRepository.getAllProgressForPlaythrough(playthroughId)
  const questProgressById = new Map(progressList.map((p) => [p.questId, p]))

  // Get all insight progress for the playthrough.
  const insightProgressList =
    await insightRepository.getAllProgressForPlaythrough(playthroughId)
  const insightProgressById = new Map(
    insightProgressList.map((p) => [p.insightId, p])
  )

  // Get all item state for the playthrough.
  const itemStateList =
    await itemRepository.getAllStateForPlaythrough(playthroughId)
  const itemStateById = new Map(itemStateList.map((s) => [s.itemId, s]))

  // Get all path progress for the playthrough.
  const pathProgressList =
    await pathRepository.getAllProgressForPlaythrough(playthroughId)
  const pathProgressById = new Map(
    (pathProgressList as { pathId: string; status: PathStatus }[]).map((r) => [
      r.pathId,
      r.status,
    ])
  )

  // Create the output list.
  const out: ActionableEntity[] = []

  // Process each quest.
  for (const quest of quests) {
    // Check if the quest is available.
    const available = await checkEntityAvailabilityWithReachability(
      gameId,
      playthroughId,
      quest.id,
      reachablePlaceIds
    )
    if (!available) continue

    // Get the quest progress.
    const progress = questProgressById.get(quest.id)
    const status = progress?.status ?? QuestStatus.AVAILABLE

    // If the quest is available, add it to the output list.
    if (status === QuestStatus.AVAILABLE) {
      const label = await getEntityDisplayName(quest.id)
      out.push({
        entityId: quest.id,
        entityType: EntityType.QUEST,
        label,
        actionLabel: 'Start quest',
      })
      continue
    }

    // If the quest is active and has objectives, add the objectives to the output list.
    if (status === QuestStatus.ACTIVE && quest.objectives.length > 0) {
      // Get the completed objective indexes.
      const completedSet = new Set(progress?.completedObjectiveIndexes ?? [])

      // Process each objective.
      for (let i = 0; i < quest.objectives.length; i += 1) {
        // If the objective is completed, continue.
        if (completedSet.has(i)) continue

        // Check if the objective is completable.
        const completable = await getObjectiveCompletability(
          playthroughId,
          quest,
          i
        )

        // If the objective is not completable, continue.
        if (!completable) continue

        // Add the objective to the output list.
        const obj = quest.objectives[i]
        const objLabel = obj?.label ?? `Objective ${i + 1}`
        const label = await getEntityDisplayName(quest.id)
        out.push({
          entityId: quest.id,
          entityType: EntityType.QUEST,
          label,
          actionLabel: `Complete objective: ${objLabel}`,
          objectiveIndex: i,
        })
      }
    }
  }

  // Process each insight.
  for (const insight of insights) {
    // Check if the insight is available.
    const available = await checkEntityAvailabilityWithReachability(
      gameId,
      playthroughId,
      insight.id,
      reachablePlaceIds
    )

    // If the insight is not available, continue.
    if (!available) continue

    // Get the insight progress.
    const progress = insightProgressById.get(insight.id)
    const status = progress?.status ?? InsightStatus.UNKNOWN

    // If the insight is not unknown, continue.
    if (status !== InsightStatus.UNKNOWN) continue

    // Add the insight to the output list.
    const label = await getEntityDisplayName(insight.id)
    out.push({
      entityId: insight.id,
      entityType: EntityType.INSIGHT,
      label,
      actionLabel: 'Discover ',
    })
  }

  // Process each item.
  for (const item of items) {
    // Check if the item is available.
    const available = await checkEntityAvailabilityWithReachability(
      gameId,
      playthroughId,
      item.id,
      reachablePlaceIds
    )

    // If the item is not available, continue.
    if (!available) continue

    // Get the item state.
    const state = itemStateById.get(item.id)
    const status = state?.status ?? ItemStatus.NOT_ACQUIRED

    // If the item is not not acquired, continue.
    if (status !== ItemStatus.NOT_ACQUIRED) continue

    // Add the item to the output list.
    const label = await getEntityDisplayName(item.id)
    out.push({
      entityId: item.id,
      entityType: EntityType.ITEM,
      label,
      actionLabel: 'Acquire item',
    })
  }

  // Process each path.
  for (const path of paths) {
    // Check if the path is available.
    const available = await checkEntityAvailability(
      gameId,
      playthroughId,
      path.id
    )

    // If the path is not available, continue.
    if (!available.available) continue

    // Get the path progress.
    const status = pathProgressById.get(path.id) ?? PathStatus.RESTRICTED

    // If the path is not restricted, continue.
    if (status !== PathStatus.RESTRICTED) continue

    // Add the path to the output list.
    const label = await getEntityDisplayName(path.id)
    out.push({
      entityId: path.id,
      entityType: EntityType.PATH,
      label,
      actionLabel: 'Open path',
    })
  }

  return out
}

/**
 * Returns the set of thread IDs that lie on shortest traversable paths from
 * current position to each actionable entity's target place(s).
 *
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID.
 * @param currentPositionPlaceId - Current position (start for routes).
 * @param reachablePlaceIds - Precomputed reachable place IDs (for place set).
 * @param actionableEntityIds - Set of actionable entity IDs (to resolve target places).
 * @returns Set of thread IDs to highlight as actionable routes in the Loom.
 */
export async function getActionableRouteEdgeIds(
  gameId: GameId,
  playthroughId: PlaythroughId,
  currentPositionPlaceId: PlaceId | null,
  _reachablePlaceIds: Set<PlaceId>,
  actionableEntityIds: Set<string>
): Promise<Set<string>> {
  // If there is no current position or no actionable entities, return an empty set.
  if (!currentPositionPlaceId || actionableEntityIds.size === 0) {
    return new Set<string>()
  }

  // Get all places for the game.
  const places = await placeRepository.getByGameId(gameId)
  const placeIds = new Set<PlaceId>(places.map((p) => p.id as PlaceId))
  if (!placeIds.has(currentPositionPlaceId)) return new Set<string>()

  // Get all paths for the game.
  const paths = await pathRepository.getByGameId(gameId)
  const traversableByPathId = await buildPathTraversabilityMap(
    gameId,
    playthroughId,
    paths
  )

  // Build the traversable graph with thread IDs.
  const adjacency = await buildTraversableGraphWithThreadIds(
    gameId,
    playthroughId,
    placeIds,
    traversableByPathId
  )

  // Get the thread IDs for the path.
  const pathThreadIdsByPlace = shortestPathThreadIds(
    currentPositionPlaceId,
    adjacency
  )

  // Get the target place IDs.
  const targetPlaceIds = new Set<PlaceId>()
  for (const entityId of actionableEntityIds) {
    const type = getEntityTypeFromId(entityId)
    if (type === EntityType.PLACE) {
      if (placeIds.has(entityId as PlaceId))
        targetPlaceIds.add(entityId as PlaceId)
    } else {
      const locs = await getEntityLocationPlaceIds(gameId, entityId)
      for (const id of locs) targetPlaceIds.add(id)
    }
  }

  // Get the thread IDs for the target places.
  const allThreadIds = new Set<string>()
  for (const placeId of targetPlaceIds) {
    const threadIds = pathThreadIdsByPlace.get(placeId)
    if (threadIds) {
      for (const t of threadIds) allThreadIds.add(t)
    }
  }
  return allThreadIds
}
