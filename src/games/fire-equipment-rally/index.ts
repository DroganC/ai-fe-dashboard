/**
 * 消防器材总动员（大家来找茬）游戏模块
 * 规则与说明见本目录下 docs/消防找茬.md
 */
export { default as FireEquipmentRallyGame } from './Game'
export { gameStore } from './gameStore'
export { EQUIPMENT, SPOT_LEVELS } from './types'
export type { FireEquipmentItem, DifferenceRegion, SpotDifferenceLevel, CircleRegion } from './types'
