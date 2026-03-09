import type { Point } from './types'
import { TOTAL_CELLS, GRID_FACTORS } from './types'

/** 根据屏幕宽度计算列数，最多 6 列；行数 = 48/列数 */
export function computeGridSize(): { cols: number; rows: number } {
  const minCell = 44
  const gap = 8
  const padding = 24
  const availW = typeof window !== 'undefined' ? window.innerWidth - padding : 400
  const maxCols = Math.floor(availW / (minCell + gap))
  const valid = GRID_FACTORS.filter(
    (f) => TOTAL_CELLS % f === 0 && f <= Math.min(6, Math.max(4, maxCols))
  )
  const cols = valid.length ? valid[valid.length - 1]! : 6
  const rows = TOTAL_CELLS / cols
  return { cols, rows }
}

/**
 * 格子边界上一点，使得从该点到 toward 的连线为严格水平或竖直（优先满足 90° 路径）。
 * 取「朝向 toward 的那条边」与通过 toward 的水平线 y=toward.y 或竖直线 x=toward.x 的交点。
 */
export function getBoundaryPointAxisAligned(
  getRect: (r: number, c: number) => DOMRect | null,
  r: number,
  c: number,
  toward: Point
): Point {
  const rect = getRect(r, c)
  if (!rect) return toward
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const { x: tx, y: ty } = toward

  // 水平线段：P.y = toward.y，且 P 在矩形左/右边上
  if (rect.top <= ty && ty <= rect.bottom) {
    if (tx > cx) return { x: rect.right, y: ty }
    if (tx < cx) return { x: rect.left, y: ty }
  }
  // 垂直线段：P.x = toward.x，且 P 在矩形上/下边上
  if (rect.left <= tx && tx <= rect.right) {
    if (ty > cy) return { x: tx, y: rect.bottom }
    if (ty < cy) return { x: tx, y: rect.top }
  }
  // toward 在矩形外时，取朝向 toward 的边与矩形交点的轴对齐投影（仍保证该边上的点）
  if (tx > cx) return { x: rect.right, y: ty <= rect.top ? rect.top : ty >= rect.bottom ? rect.bottom : cy }
  if (tx < cx) return { x: rect.left, y: ty <= rect.top ? rect.top : ty >= rect.bottom ? rect.bottom : cy }
  if (ty > cy) return { x: tx <= rect.left ? rect.left : tx >= rect.right ? rect.right : cx, y: rect.bottom }
  if (ty < cy) return { x: tx <= rect.left ? rect.left : tx >= rect.right ? rect.right : cx, y: rect.top }
  return { x: cx, y: cy }
}

/** 能否用直线或 L 形连接（无 Z 形） */
export function canConnect(
  grid: number[][],
  rows: number,
  cols: number,
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  if (r1 === r2 && c1 === c2) return false
  const t1 = getType(grid, rows, cols, r1, c1)
  const t2 = getType(grid, rows, cols, r2, c2)
  if (t1 !== t2 || t1 === -1) return false

  const isEmpty = (r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return true
    return grid[r]![c]! === -1
  }
  const clearH = (r: number, cFrom: number, cTo: number) => {
    const [cA, cB] = cFrom <= cTo ? [cFrom, cTo] : [cTo, cFrom]
    for (let c = cA; c <= cB; c++)
      if (
        !isEmpty(r, c) &&
        !(r === r1 && c === c1) &&
        !(r === r2 && c === c2)
      )
        return false
    return true
  }
  const clearV = (c: number, rFrom: number, rTo: number) => {
    const [rA, rB] = rFrom <= rTo ? [rFrom, rTo] : [rTo, rFrom]
    for (let r = rA; r <= rB; r++)
      if (
        !isEmpty(r, c) &&
        !(r === r1 && c === c1) &&
        !(r === r2 && c === c2)
      )
        return false
    return true
  }

  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) return true
  if (r1 === r2 && clearH(r1, c1, c2)) return true
  if (c1 === c2 && clearV(c1, r1, r2)) return true
  if (clearH(r1, c1, c2) && clearV(c2, r1, r2)) return true
  if (clearV(c1, r1, r2) && clearH(r2, c1, c2)) return true
  return false
}

function getType(
  grid: number[][],
  rows: number,
  cols: number,
  r: number,
  c: number
): number {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return -1
  return grid[r]![c]!
}

/**
 * 单次路径计算内缓存 getRect 结果，避免重复 getBoundingClientRect
 */
function createCachedGetRect(
  getRect: (r: number, c: number) => DOMRect | null
): (r: number, c: number) => DOMRect | null {
  const cache = new Map<string, DOMRect | null>()
  return (r: number, c: number) => {
    const key = `${r}-${c}`
    if (!cache.has(key)) cache.set(key, getRect(r, c))
    return cache.get(key)!
  }
}

/**
 * 计算折线路径（直线或 L 形）。
 * 起止点优先满足 90°：取格子边界与「通过下一路径点的水平/竖直线」的交点，保证每段严格水平或竖直。
 */
export function getPath(
  grid: number[][],
  rows: number,
  cols: number,
  getRect: (r: number, c: number) => DOMRect | null,
  r1: number,
  c1: number,
  r2: number,
  c2: number
): Point[] {
  const cachedGetRect = createCachedGetRect(getRect)
  const isEmpty = (r: number, c: number) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return true
    return grid[r]![c]! === -1
  }
  const clearH = (r: number, cFrom: number, cTo: number) => {
    const [cA, cB] = cFrom <= cTo ? [cFrom, cTo] : [cTo, cFrom]
    for (let c = cA; c <= cB; c++)
      if (
        !isEmpty(r, c) &&
        !(r === r1 && c === c1) &&
        !(r === r2 && c === c2)
      )
        return false
    return true
  }
  const clearV = (c: number, rFrom: number, rTo: number) => {
    const [rA, rB] = rFrom <= rTo ? [rFrom, rTo] : [rTo, rFrom]
    for (let r = rA; r <= rB; r++)
      if (
        !isEmpty(r, c) &&
        !(r === r1 && c === c1) &&
        !(r === r2 && c === c2)
      )
        return false
    return true
  }
  const toPx = (r: number, c: number): Point => {
    const rect = cachedGetRect(r, c)
    if (!rect) return { x: 0, y: 0 }
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }

  const center1 = toPx(r1, c1)
  const center2 = toPx(r2, c2)
  let path: Point[]
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
    path = [center1, center2]
  } else if (r1 === r2 && clearH(r1, c1, c2)) {
    path = [center1, center2]
  } else if (c1 === c2 && clearV(c1, r1, r2)) {
    path = [center1, center2]
  } else if (clearH(r1, c1, c2) && clearV(c2, r1, r2)) {
    path = [center1, toPx(r1, c2), center2]
  } else if (clearV(c1, r1, r2) && clearH(r2, c1, c2)) {
    path = [center1, toPx(r2, c1), center2]
  } else {
    path = [center1, center2]
  }

  // 起点：格子1边界上一点，使 起点→下一路径点 为水平或竖直（90°）
  const nextFromStart = path.length >= 2 ? path[1]! : center2
  path[0] = getBoundaryPointAxisAligned(cachedGetRect, r1, c1, nextFromStart)
  // 终点：格子2边界上一点，使 上一路径点→终点 为水平或竖直（90°）
  const prevToEnd = path.length >= 2 ? path[path.length - 2]! : center1
  path[path.length - 1] = getBoundaryPointAxisAligned(cachedGetRect, r2, c2, prevToEnd)
  return path
}
