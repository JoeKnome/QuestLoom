import { EntityType } from '../../types/EntityType'
import { PathStatus } from '../../types/PathStatus'
import type { GameId, PathId, PlaceId, PlaythroughId } from '../../types/ids'
import {
  pathRepository,
  placeRepository,
  threadRepository,
} from '../repositories'
import { checkEntityAvailability } from '../requirements'
import { getEntityTypeFromId } from '../../utils/parseEntityId'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import type { Path } from '../../types/Path'

/**
 * Result of computing reachability for places.
 */
export interface ReachabilityResult {
  /** Set of place IDs reachable from the start place. */
  reachablePlaceIds: Set<PlaceId>
}

/**
 * Builds a map of path ID to traversable flag for the given playthrough.
 *
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID.
 * @param paths - All paths for the current game.
 * @param pathIdsToEvaluate - IDs of the paths to evaluate (subset of `paths`).
 * @returns Map of path ID to traversable boolean.
 */
async function buildPathTraversabilityMap(
  gameId: GameId,
  playthroughId: PlaythroughId,
  paths: Path[],
  pathIdsToEvaluate: PathId[]
): Promise<Map<PathId, boolean>> {
  // Load progress rows once for the playthrough and index by path ID.
  const progressList =
    await pathRepository.getAllProgressForPlaythrough(playthroughId)
  const statusById = new Map<PathId, PathStatus>()
  for (const row of progressList as { pathId: PathId; status: PathStatus }[]) {
    statusById.set(row.pathId, row.status)
  }

  // Precompute availability for all paths, mirroring Loom path logic so
  // reachability and Loom styling stay in sync.
  const pathAvailabilityById = new Map<PathId, boolean>()
  const availabilityResults = await Promise.all(
    paths.map(async (p) => {
      const availability = await checkEntityAvailability(
        gameId,
        playthroughId,
        p.id
      )
      return { id: p.id as PathId, available: availability.available }
    })
  )
  for (const r of availabilityResults) {
    pathAvailabilityById.set(r.id, r.available)
  }

  const traversableById = new Map<PathId, boolean>()

  for (const pathId of pathIdsToEvaluate) {
    const status = statusById.get(pathId) ?? PathStatus.RESTRICTED

    if (status === PathStatus.BLOCKED) {
      traversableById.set(pathId, false)
      continue
    }

    if (status === PathStatus.OPENED) {
      traversableById.set(pathId, true)
      continue
    }

    // RESTRICTED: requires requirements to be satisfied.
    traversableById.set(pathId, pathAvailabilityById.get(pathId) ?? false)
  }

  return traversableById
}

/**
 * Computes the set of reachable places from a start place, following
 * direct Place–Place links and traversable Paths.
 *
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID.
 * @param startPlaceId - Typed ID of the start place for reachability.
 * @returns Reachability result with all reachable place IDs.
 */
export async function computeReachablePlaces(
  gameId: GameId,
  playthroughId: PlaythroughId,
  startPlaceId: PlaceId | null
): Promise<ReachabilityResult> {
  // If required identifiers are missing, treat as empty reachable set.
  if (!gameId || !playthroughId || !startPlaceId) {
    return { reachablePlaceIds: new Set<PlaceId>() }
  }

  // Fetch places, paths, and threads for the game and playthrough.
  const [places, paths, threads] = await Promise.all([
    placeRepository.getByGameId(gameId),
    pathRepository.getByGameId(gameId),
    threadRepository.getByGameId(gameId, playthroughId),
  ])

  // If no places are found, treat as empty reachable set.
  if (places.length === 0) {
    return { reachablePlaceIds: new Set<PlaceId>() }
  }

  // If the start place is not found, treat as empty reachable set.
  const placeIds = new Set<PlaceId>(places.map((p) => p.id as PlaceId))
  if (!placeIds.has(startPlaceId)) {
    return { reachablePlaceIds: new Set<PlaceId>() }
  }

  // Initialize adjacency and path endpoints maps.
  const adjacency = new Map<PlaceId, Set<PlaceId>>()
  const pathEndpoints = new Map<PathId, Set<PlaceId>>()

  // Initialize adjacency with empty sets so every place is present.
  for (const id of placeIds) {
    adjacency.set(id, new Set<PlaceId>())
  }

  // Initialize set of path IDs for evaluation.
  const pathIdsForEvaluation = new Set<PathId>()

  // Iterate over all threads to collect path endpoints and path IDs for evaluation.
  for (const thread of threads) {
    const subtype = thread.subtype

    // Direct Place–Place links: always traversable, bidirectional.
    if (subtype === ThreadSubtype.DIRECT_PLACE_LINK) {
      const sourceType = getEntityTypeFromId(thread.sourceId)
      const targetType = getEntityTypeFromId(thread.targetId)
      if (sourceType === EntityType.PLACE && targetType === EntityType.PLACE) {
        const sourceId = thread.sourceId as PlaceId
        const targetId = thread.targetId as PlaceId
        if (placeIds.has(sourceId) && placeIds.has(targetId)) {
          adjacency.get(sourceId)?.add(targetId)
          adjacency.get(targetId)?.add(sourceId)
        }
      }
      continue
    }

    // Place–Path connectivity: collect endpoints for later traversal.
    if (subtype === ThreadSubtype.CONNECTS_PATH) {
      const sourceType = getEntityTypeFromId(thread.sourceId)
      const targetType = getEntityTypeFromId(thread.targetId)

      const isSourcePath = sourceType === EntityType.PATH
      const isTargetPath = targetType === EntityType.PATH
      if (!isSourcePath && !isTargetPath) {
        continue
      }

      const pathId = (
        isSourcePath ? thread.sourceId : thread.targetId
      ) as PathId
      const placeId = (
        isSourcePath ? thread.targetId : thread.sourceId
      ) as PlaceId

      if (!placeIds.has(placeId)) {
        continue
      }

      let endpoints = pathEndpoints.get(pathId)
      if (!endpoints) {
        endpoints = new Set<PlaceId>()
        pathEndpoints.set(pathId, endpoints)
      }
      endpoints.add(placeId)
      pathIdsForEvaluation.add(pathId)
    }
  }

  // Evaluate which paths are traversable for this playthrough.
  const traversableByPathId = await buildPathTraversabilityMap(
    gameId,
    playthroughId,
    paths,
    Array.from(pathIdsForEvaluation)
  )

  // For each traversable path, connect all of its place endpoints bidirectionally.
  for (const [pathId, endpointPlaces] of pathEndpoints.entries()) {
    if (!traversableByPathId.get(pathId)) continue
    const endpoints = Array.from(endpointPlaces)
    for (let i = 0; i < endpoints.length; i += 1) {
      for (let j = i + 1; j < endpoints.length; j += 1) {
        const a = endpoints[i]
        const b = endpoints[j]
        adjacency.get(a)?.add(b)
        adjacency.get(b)?.add(a)
      }
    }
  }

  // Traverse the graph from the start place.
  const visited = new Set<PlaceId>()
  const queue: PlaceId[] = []

  visited.add(startPlaceId)
  queue.push(startPlaceId)

  while (queue.length > 0) {
    const current = queue.shift() as PlaceId
    const neighbors = adjacency.get(current)
    if (!neighbors) continue
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
      }
    }
  }

  return { reachablePlaceIds: visited }
}
