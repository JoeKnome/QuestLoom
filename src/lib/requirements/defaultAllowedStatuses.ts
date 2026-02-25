import { EntityType } from '../../types/EntityType'
import { InsightStatus } from '../../types/InsightStatus'
import { ItemStatus } from '../../types/ItemStatus'
import { PersonStatus } from '../../types/PersonStatus'
import { QuestStatus } from '../../types/QuestStatus'

/**
 * Default allowed status sets per entity type when a requirement or objective
 * does not specify requirementAllowedStatuses / allowedStatuses.
 * Used for both entity-level requirements (thread subtype Requires) and
 * quest objective completability (thread subtype ObjectiveRequires).
 *
 * - Item: [ACQUIRED]
 * - Insight: [KNOWN]
 * - Quest: [COMPLETED]
 * - Person: [ALIVE]
 * - Place: not used for requirement targets in Phase 5.2 (reachability is Phase 5.5).
 */
export const DEFAULT_ALLOWED_STATUSES: Record<EntityType, number[]> = {
  [EntityType.QUEST]: [QuestStatus.COMPLETED],
  [EntityType.INSIGHT]: [InsightStatus.KNOWN],
  [EntityType.ITEM]: [ItemStatus.ACQUIRED],
  [EntityType.PERSON]: [PersonStatus.ALIVE],
  [EntityType.PLACE]: [],
  [EntityType.MAP]: [],
  [EntityType.THREAD]: [],
  [EntityType.PATH]: [],
}
