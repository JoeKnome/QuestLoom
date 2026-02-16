/**
 * Singleton item repository for the app.
 * Use this instead of Dexie directly; implements IItemRepository against IndexedDB.
 */

import type { Item } from '../../types/Item'
import type { ItemState } from '../../types/ItemState'
import { EntityType } from '../../types/EntityType'
import type { GameId, ItemId, PlaythroughId } from '../../types/ids'
import { generateId, generateEntityId } from '../../utils/generateId'
import { db, type ItemStateRow } from '../db'
import { deleteThreadsForEntity } from './cascadeDeleteThreads'
import type { CreateItemInput } from './CreateItemInput'
import type { IItemRepository } from './IItemRepository'

/**
 * Dexie-backed implementation of IItemRepository.
 */
class ItemRepositoryImpl implements IItemRepository {
  async getByGameId(gameId: GameId): Promise<Item[]> {
    return db.items.where('gameId').equals(gameId).toArray()
  }

  async getById(id: ItemId): Promise<Item | undefined> {
    return db.items.get(id)
  }

  async create(input: CreateItemInput): Promise<Item> {
    const now = new Date().toISOString()
    const item: Item = {
      id: generateEntityId(EntityType.ITEM) as ItemId,
      gameId: input.gameId,
      name: input.name,
      location: input.location,
      description: input.description ?? '',
      createdAt: now,
      updatedAt: now,
    }
    await db.items.add(item)
    return item
  }

  async update(item: Item): Promise<void> {
    const updated: Item = {
      ...item,
      updatedAt: new Date().toISOString(),
    }
    await db.items.put(updated)
  }

  async delete(id: ItemId): Promise<void> {
    const item = await db.items.get(id)
    if (item) {
      await deleteThreadsForEntity(item.gameId, id)
    }
    await db.items.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.items.where('gameId').equals(gameId).delete()
  }

  async getState(
    playthroughId: PlaythroughId,
    itemId: ItemId
  ): Promise<ItemState | undefined> {
    const row = await db.itemState
      .where('[playthroughId+itemId]')
      .equals([playthroughId, itemId])
      .first()
    return row ? toItemState(row) : undefined
  }

  async getAllStateForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<ItemState[]> {
    const rows = await db.itemState
      .where('playthroughId')
      .equals(playthroughId)
      .toArray()
    return rows.map(toItemState)
  }

  async upsertState(state: ItemState): Promise<void> {
    const row: ItemStateRow = {
      id: state.id ?? generateId(),
      playthroughId: state.playthroughId,
      itemId: state.itemId,
      status: state.status,
      notes: state.notes,
    }
    await db.itemState.put(row)
  }

  async deleteStateByPlaythroughId(
    playthroughId: PlaythroughId
  ): Promise<void> {
    await db.itemState.where('playthroughId').equals(playthroughId).delete()
  }
}

/**
 * Convert a ItemStateRow to an ItemState.
 *
 * @param row - The ItemStateRow to convert.
 * @returns The ItemState.
 */
function toItemState(row: ItemStateRow): ItemState {
  return {
    id: row.id,
    playthroughId: row.playthroughId,
    itemId: row.itemId,
    status: row.status,
    notes: row.notes,
  }
}

/** Single item repository instance. */
export const itemRepository: IItemRepository = new ItemRepositoryImpl()
