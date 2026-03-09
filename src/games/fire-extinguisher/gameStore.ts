/**
 * 连连看 - 游戏状态（规则：开始页 / 进行中 / 结束页）
 */
import { makeAutoObservable } from 'mobx'
import { TYPES, PAIRS_PER_TYPE } from './types'
import type { SelectCellResult, HintPair } from './types'
import { computeGridSize, canConnect } from './utils'

/** 游戏界面：开始 | 进行中 | 结束（规则 2.1） */
export type GameScreen = 'start' | 'play' | 'end'

/** 当前选中的格子坐标（规则 4：选择第一个格子） */
export interface SelectedCell {
  r: number
  c: number
}

export const gameStore = makeAutoObservable({
  screen: 'start' as GameScreen,
  /** 网格数据：-1 表示已消除（规则 3.1） */
  grid: [] as number[][],
  rows: 6,
  cols: 8,
  selected: null as SelectedCell | null,
  pairsDone: 0,
  totalPairs: TYPES.length * PAIRS_PER_TYPE,

  get pairsTotal(): number {
    return this.totalPairs
  },

  /** 初始化网格：响应式行列、48 格随机打乱（规则 2.6） */
  initGrid(): void {
    const { cols, rows } = computeGridSize()
    this.rows = rows
    this.cols = cols
    const flat: number[] = []
    for (let t = 0; t < TYPES.length; t++) {
      for (let i = 0; i < PAIRS_PER_TYPE; i++) {
        flat.push(t, t)
      }
    }
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[flat[i], flat[j]] = [flat[j]!, flat[i]!]
    }
    this.grid = []
    let idx = 0
    for (let r = 0; r < rows; r++) {
      this.grid[r] = []
      for (let c = 0; c < cols; c++) {
        this.grid[r]![c] = flat[idx++]!
      }
    }
    this.pairsDone = 0
    this.selected = null
    this.screen = 'play'
  },

  /**
   * 选择格子（规则 4）：点击第一格选中，点击第二格若可连线则返回可消除结果。
   * 不立即清空格子，由组件画线、播消除动画后再调用 commitClear。
   */
  selectCell(r: number, c: number): SelectCellResult {
    if (this.grid[r]?.[c] === undefined || this.grid[r]![c]! === -1) {
      return { connected: false }
    }
    if (this.selected) {
      const { r: r0, c: c0 } = this.selected
      if (r0 === r && c0 === c) {
        this.selected = null
        return { connected: false }
      }
      const connected = canConnect(
        this.grid,
        this.rows,
        this.cols,
        r0,
        c0,
        r,
        c
      )
      if (connected) {
        const typeId = this.grid[r]![c]!
        this.selected = null
        return { connected: true, typeId, r1: r0, c1: c0, r2: r, c2: c }
      }
      this.selected = { r, c }
      return { connected: false }
    }
    this.selected = { r, c }
    return { connected: false }
  },

  /** 画线与消除动画结束后提交消除（规则 4.1 第 4 步）；越界不写，避免异常 */
  commitClear(r1: number, c1: number, r2: number, c2: number): void {
    if (
      r1 < 0 || r1 >= this.rows || c1 < 0 || c1 >= this.cols ||
      r2 < 0 || r2 >= this.rows || c2 < 0 || c2 >= this.cols
    ) return
    this.grid[r1]![c1]! = -1
    this.grid[r2]![c2]! = -1
    this.pairsDone++
    if (this.pairsDone >= this.totalPairs) this.screen = 'end'
  },

  /** 当前局面是否至少有一对可消除（无解检测，规则 4 重排/提示） */
  hasSolution(): boolean {
    return this.findHint() !== null
  },

  /** 返回一对可消除的格子坐标，供提示高亮用；无解返回 null */
  findHint(): HintPair | null {
    for (let r1 = 0; r1 < this.rows; r1++) {
      for (let c1 = 0; c1 < this.cols; c1++) {
        if (this.grid[r1]![c1]! === -1) continue
        for (let r2 = 0; r2 < this.rows; r2++) {
          for (let c2 = 0; c2 < this.cols; c2++) {
            if (
              (r1 === r2 && c1 === c2) ||
              this.grid[r2]![c2]! === -1
            )
              continue
            if (
              canConnect(
                this.grid,
                this.rows,
                this.cols,
                r1,
                c1,
                r2,
                c2
              )
            ) {
              return { r1, c1, r2, c2 }
            }
          }
        }
      }
    }
    return null
  },

  /** 重排：清空选中，打乱当前剩余格子顺序（规则 4；规则 2.7 抖动由组件控制） */
  shuffle(): void {
    this.selected = null
    const flat: number[] = []
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r]![c]! !== -1) flat.push(this.grid[r]![c]!)
      }
    }
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[flat[i], flat[j]] = [flat[j]!, flat[i]!]
    }
    let idx = 0
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r]![c]! !== -1) this.grid[r]![c]! = flat[idx++]!
      }
    }
  },

  /** 开始游戏：初始化网格并进入进行中（规则 2.3） */
  startGame(): void {
    this.initGrid()
  },

  /** 再玩一局：回到开始页，用户点击「开始游戏」后由 startGame 初始化（规则 2.5） */
  restart(): void {
    this.screen = 'start'
  },
})
