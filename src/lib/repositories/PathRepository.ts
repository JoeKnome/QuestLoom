/**
 * Singleton path repository for the app.
 * Use this instead of Dexie directly; implements IPathRepository against IndexedDB.
 */

import type { Path } from '../../types/Path'
import type { PathProgress } from '../../types/PathProgress'
import { EntityType } from '../../types/EntityType'
import type { GameId, PathId, PlaythroughId } from '../../types/ids'
import { generateEntityId, generateId } from '../../utils/generateId'
import { db, type PathProgressRow } from '../db'
import { deleteThreadsForEntity } from './cascadeDeleteThreads'
import { mapMarkerRepository } from './MapMarkerRepository'
import type { CreatePathInput } from './CreatePathInput'
import type { IPathRepository } from './IPathRepository'

/**
 * Dexie-backed implementation of IPathRepository.
 */
class PathRepositoryImpl implements IPathRepository {
  async getByGameId(gameId: GameId): Promise<Path[]> {
    return db.paths.where('gameId').equals(gameId).toArray()
  }

  async getById(id: PathId): Promise<Path | undefined> {
    return db.paths.get(id)
  }

  async create(input: CreatePathInput): Promise<Path> {
    const now = new Date().toISOString()
    const path: Path = {
      id: generateEntityId(EntityType.PATH) as PathId,
      gameId: input.gameId,
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    }
    await db.paths.add(path)
    return path
  }

  async update(path: Path): Promise<void> {
    const updated: Path = {
      ...path,
      updatedAt: new Date().toISOString(),
    }
    await db.paths.put(updated)
  }

  async delete(id: PathId): Promise<void> {
    const path = await db.paths.get(id)
    if (path) {
      await deleteThreadsForEntity(path.gameId, id)
      await mapMarkerRepository.deleteByEntity(path.gameId, EntityType.PATH, id)
    }
    await db.paths.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    const paths = await db.paths.where('gameId').equals(gameId).toArray()
    await Promise.all(
      paths.map(async (path) => {
        await deleteThreadsForEntity(gameId, path.id)
        await mapMarkerRepository.deleteByEntity(
          gameId,
          EntityType.PATH,
          path.id
        )
      })
    )
    await db.paths.where('gameId').equals(gameId).delete()
  }

  async getProgress(
    playthroughId: PlaythroughId,
    pathId: PathId
  ): Promise<PathProgress | undefined> {
    const row = await db.pathProgress
      .where('[playthroughId+pathId]')
      .equals([playthroughId, pathId])
      .first()
    return row ? toPathProgress(row) : undefined
  }

  async getAllProgressForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<PathProgress[]> {
    const rows = await db.pathProgress
      .where('playthroughId')
      .equals(playthroughId)
      .toArray()
    return rows.map(toPathProgress)
  }

  async upsertProgress(progress: PathProgress): Promise<void> {
    let id = progress.id
    if (id === undefined) {
      const existing = await db.pathProgress
        .where('[playthroughId+pathId]')
        .equals([progress.playthroughId, progress.pathId])
        .first()
      id = existing?.id ?? generateId()
    }
    const row: PathProgressRow = {
      id,
      playthroughId: progress.playthroughId,
      pathId: progress.pathId,
      status: progress.status,
    }
    await db.pathProgress.put(row)
  }

  async deleteProgressByPlaythroughId(
    playthroughId: PlaythroughId
  ): Promise<void> {
    await db.pathProgress.where('playthroughId').equals(playthroughId).delete()
  }
}

/**
 * Convert a PathProgressRow to a PathProgress.
 *
 * @param row - The PathProgressRow to convert.
 * @returns The PathProgress.
 */
function toPathProgress(row: PathProgressRow): PathProgress {
  return {
    id: row.id,
    playthroughId: row.playthroughId,
    pathId: row.pathId,
    status: row.status,
  }
}

/** Single path repository instance. */
export const pathRepository: IPathRepository = new PathRepositoryImpl()
