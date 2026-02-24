import { EntityType } from '../types/EntityType'
import { InsightStatus } from '../types/InsightStatus'
import { ItemStatus } from '../types/ItemStatus'
import { PersonStatus } from '../types/PersonStatus'
import { QuestStatus } from '../types/QuestStatus'

const QUEST_OPTIONS: Record<number, string> = {
  [QuestStatus.AVAILABLE]: 'Available',
  [QuestStatus.ACTIVE]: 'Active',
  [QuestStatus.COMPLETED]: 'Completed',
  [QuestStatus.ABANDONED]: 'Abandoned',
}

const INSIGHT_OPTIONS: Record<number, string> = {
  [InsightStatus.UNKNOWN]: 'Unknown',
  [InsightStatus.KNOWN]: 'Known',
  [InsightStatus.IRRELEVANT]: 'Irrelevant',
}

const ITEM_OPTIONS: Record<number, string> = {
  [ItemStatus.NOT_ACQUIRED]: 'Not acquired',
  [ItemStatus.ACQUIRED]: 'Acquired',
  [ItemStatus.USED]: 'Used',
  [ItemStatus.LOST]: 'Lost',
}

const PERSON_OPTIONS: Record<number, string> = {
  [PersonStatus.ALIVE]: 'Alive',
  [PersonStatus.DEAD]: 'Dead',
  [PersonStatus.UNKNOWN]: 'Unknown',
}

/** Status options for each entity type. */
export const STATUS_OPTIONS: Record<EntityType, Record<number, string>> = {
  [EntityType.QUEST]: QUEST_OPTIONS,
  [EntityType.INSIGHT]: INSIGHT_OPTIONS,
  [EntityType.ITEM]: ITEM_OPTIONS,
  [EntityType.PERSON]: PERSON_OPTIONS,
  [EntityType.PLACE]: {},
  [EntityType.MAP]: {},
  [EntityType.THREAD]: {},
}