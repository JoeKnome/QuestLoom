import { QuestStatus } from '../types/QuestStatus';
import { ItemStatus } from '../types/ItemStatus';
import { InsightStatus } from '../types/InsightStatus';
import { PersonStatus } from '../types/PersonStatus';
import type { PlaythroughId } from '../types/ids';
import {
  insightRepository,
  itemRepository,
  personRepository,
  questRepository,
} from './repositories';

/**
 * Returns the set of entity IDs that should be treated as "completed" or
 * resolved for visual purposes in a given playthrough.
 *
 * This centralizes the mapping from playthrough-scoped statuses to the
 * completed-like visual state used by Loom nodes and map markers:
 *
 * - Quests: COMPLETED, ABANDONED
 * - Insights: KNOWN, IRRELEVANT
 * - Items: ACQUIRED, USED, LOST
 * - People: DEAD
 *
 * @param playthroughId - The playthrough whose completion state to summarize.
 * @returns A Promise resolving to a Set of entity IDs that are visually completed.
 */
export async function getCompletedEntityIdsForPlaythrough(
  playthroughId: PlaythroughId
): Promise<Set<string>> {
  // Get all progress, state, and completion records for the playthrough
  const [questProgress, insightProgress, itemState, personProgress] =
    await Promise.all([
      questRepository.getAllProgressForPlaythrough(playthroughId),
      insightRepository.getAllProgressForPlaythrough(playthroughId),
      itemRepository.getAllStateForPlaythrough(playthroughId),
      personRepository.getAllProgressForPlaythrough(playthroughId),
    ]);

  const completedIds = new Set<string>();

  // Add completed quest IDs
  (questProgress as { questId: string; status: QuestStatus }[]).forEach(
    (row) => {
      if (
        row.status === QuestStatus.COMPLETED ||
        row.status === QuestStatus.ABANDONED
      ) {
        completedIds.add(row.questId);
      }
    }
  );

  // Add completed insight IDs
  (insightProgress as { insightId: string; status: InsightStatus }[]).forEach(
    (row) => {
      if (
        row.status === InsightStatus.KNOWN ||
        row.status === InsightStatus.IRRELEVANT
      ) {
        completedIds.add(row.insightId);
      }
    }
  );

  // Add completed item IDs
  (itemState as { itemId: string; status: ItemStatus }[]).forEach((row) => {
    if (row.status === ItemStatus.USED || row.status === ItemStatus.LOST) {
      completedIds.add(row.itemId);
    }
  });

  // Add completed person IDs
  (personProgress as { personId: string; status: PersonStatus }[]).forEach(
    (row) => {
      if (row.status === PersonStatus.DEAD) {
        completedIds.add(row.personId);
      }
    }
  );

  return completedIds;
}
