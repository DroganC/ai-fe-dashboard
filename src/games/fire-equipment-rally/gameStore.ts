/**
 * 消防器材总动员 - 游戏状态（大家来找茬）
 * 规则对齐：见 docs/消防找茬.md。死亡规则 = 误点达上限即本关失败；超时规则 = 限时内未找齐即本关超时。
 */
import { makeAutoObservable } from 'mobx'
import { SPOT_LEVELS, type SpotDifferenceLevel } from './types'
import { MAX_WRONG_CLICKS_PER_LEVEL, LEVEL_DURATION_SEC } from './constants'

/** 游戏当前所在屏幕 */
export type GameScreen = 'start' | 'play' | 'end'

export const gameStore = makeAutoObservable({
  screen: 'start' as GameScreen,
  /** 当前关卡下标（0 起） */
  currentLevelIndex: 0,
  /** 当前关已找到的差异 id 列表（顺序即找到顺序，用于小知识展示最近一次） */
  foundIds: [] as number[],
  /** 当前关错误点击次数；死亡规则：达到 MAX_WRONG_CLICKS_PER_LEVEL 即本关失败 */
  wrongClicks: 0,
  /** 所有关累计找到的差异总数，用于结束页统计 */
  totalFoundCount: 0,
  /** 当前关剩余秒数；-1=未启用限时，0=已超时（超时规则） */
  levelTimeRemaining: -1,

  /** 当前关卡数据，无则 null */
  get currentLevel(): SpotDifferenceLevel | null {
    return SPOT_LEVELS[this.currentLevelIndex] ?? null
  },

  /** 是否还有下一关 */
  get hasNextLevel(): boolean {
    return this.currentLevelIndex + 1 < SPOT_LEVELS.length
  },

  /** 死亡规则：本关误点次数已达上限 */
  isLevelFailed(): boolean {
    return MAX_WRONG_CLICKS_PER_LEVEL > 0 && this.wrongClicks >= MAX_WRONG_CLICKS_PER_LEVEL
  },

  /** 超时规则：已启用限时且剩余时间为 0 */
  get isLevelTimedOut(): boolean {
    return LEVEL_DURATION_SEC > 0 && this.levelTimeRemaining === 0
  },

  /** 本关已结束（过关、死亡或超时任一成立） */
  isLevelEnded(): boolean {
    return this.isLevelComplete() || this.isLevelFailed() || this.isLevelTimedOut
  },

  /** 开始游戏：进入第 1 关，重置所有计数与倒计时 */
  start(): void {
    this.screen = 'play'
    this.currentLevelIndex = 0
    this.foundIds = []
    this.wrongClicks = 0
    this.totalFoundCount = 0
    this.levelTimeRemaining = LEVEL_DURATION_SEC > 0 ? LEVEL_DURATION_SEC : -1
  },

  /** 指定 id 的差异是否已被找到 */
  isFound(differenceId: number): boolean {
    return this.foundIds.includes(differenceId)
  },

  /** 本关是否已找齐全部差异（过关） */
  isLevelComplete(): boolean {
    const level = this.currentLevel
    if (!level) return false
    return level.differences.every((d) => this.foundIds.includes(d.id))
  },

  /** 标记某差异为已找到（仅未找到时写入，避免重复计数） */
  markFound(differenceId: number): void {
    if (this.foundIds.includes(differenceId)) return
    this.foundIds = [...this.foundIds, differenceId]
    this.totalFoundCount += 1
  },

  /** 记录一次错误点击（未命中任何未找到的差异时由 Game 调用） */
  recordWrongClick(): void {
    this.wrongClicks += 1
  },

  /** 倒计时步进：每秒由 Game 的 setInterval 调用一次 */
  tick(): void {
    if (this.levelTimeRemaining > 0) {
      this.levelTimeRemaining -= 1
    }
  },

  /** 进入下一关；若已无下一关则进入结束页。重试/下一关均重置误点与倒计时（规则要求） */
  nextLevel(): void {
    this.currentLevelIndex += 1
    this.foundIds = []
    this.wrongClicks = 0
    this.levelTimeRemaining = LEVEL_DURATION_SEC > 0 ? LEVEL_DURATION_SEC : -1
    if (this.currentLevelIndex >= SPOT_LEVELS.length) {
      this.screen = 'end'
    }
  },

  /** 重试本关：清空已找与误点，重置倒计时（规则要求） */
  retryLevel(): void {
    this.foundIds = []
    this.wrongClicks = 0
    this.levelTimeRemaining = LEVEL_DURATION_SEC > 0 ? LEVEL_DURATION_SEC : -1
  },

  /** 直接进入结束页 */
  finish(): void {
    this.screen = 'end'
  },

  /** 返回开始页并重置全部状态 */
  restart(): void {
    this.screen = 'start'
    this.currentLevelIndex = 0
    this.foundIds = []
    this.wrongClicks = 0
    this.totalFoundCount = 0
    this.levelTimeRemaining = -1
  },
})
