import type { Item } from '../../types/Item'
import type { ItemState } from '../../types/ItemState'
import type { GameId, ItemId, PlaythroughId } from '../../types/ids'
import type { CreateItemInput } from './CreateItemInput'

/**
 * Contract for item and item state data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IItemRepository {
  /** 
   * Returns all items for a game.
   * 
   * @param gameId - The game ID.
   * @returns All items for the game.
   */
  getByGameId(gameId: GameId): Promise<Item[]>

  /** 
   * Returns an item by ID.
   * 
   * @param id - The ID of the item.
   * @returns The item, or undefined if not found.
   */
  getById(id: ItemId): Promise<Item | undefined>

  /** 
   * Creates an item; ID and timestamps are set by the repository.
   * 
   * @param input - The input to create the item.
   * @returns The created item.
   */
  create(input: CreateItemInput): Promise<Item>

  /** 
   * Updates an existing item; updatedAt is set by the repository.
   * 
   * @param item - The item to update.
   */
  update(item: Item): Promise<void>

  /** 
   * Deletes an item by ID.
   * 
   * @param id - The ID of the item to delete.
   */
  delete(id: ItemId): Promise<void>

  /** 
   * Deletes all items for a game (cascade when deleting game).
   * 
   * @param gameId - The ID of the game to delete.
   */
  deleteByGameId(gameId: GameId): Promise<void>

  /** 
   * Returns state for a single item in a playthrough, or undefined.
   * 
   * @param playthroughId - The playthrough ID.
   * @param itemId - The ID of the item.
   * @returns The state for the item, or undefined if not found.
   */
  getState(
    playthroughId: PlaythroughId,
    itemId: ItemId
  ): Promise<ItemState | undefined>

  /** 
   * Returns all item state for a playthrough.
   * 
   * @param playthroughId - The playthrough ID.
   * @returns All item state for the playthrough.
   */
  getAllStateForPlaythrough(playthroughId: PlaythroughId): Promise<ItemState[]>

  /** 
   * Inserts or updates item state; id is generated if missing.
   * 
   * @param state - The item state to upsert.
   */
  upsertState(state: ItemState): Promise<void>

  /** 
   * Deletes all item state for a playthrough (cascade when deleting playthrough).
   * 
   * @param playthroughId - The playthrough ID.
   */
  deleteStateByPlaythroughId(playthroughId: PlaythroughId): Promise<void>
}
