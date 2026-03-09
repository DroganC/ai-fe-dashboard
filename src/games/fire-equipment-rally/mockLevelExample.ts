/**
 * Mock 示例：如何根据设计图尺寸填写 cx、cy、r
 * 假设设计图尺寸为 400×300（宽×高）；换算公式 cx = px/400, cy = py/300；r 建议 0.05～0.08。
 */
import type { DifferenceRegion } from './types'

const DESIGN_WIDTH = 400
const DESIGN_HEIGHT = 300

/** 从设计图像素 (px, py) 得到相对比例 (cx, cy)，用于写入 DifferenceRegion.left/right */
function toRelative(px: number, py: number): { cx: number; cy: number } {
  return {
    cx: px / DESIGN_WIDTH,
    cy: py / DESIGN_HEIGHT,
  }
}

/** 示例：5 处差异在设计图上的像素中心及对应小知识 */
const MOCK_DIFFERENCES_BY_PIXEL: Array<{
  id: number
  leftPx: [number, number]
  rightPx: [number, number]
  tip: string
}> = [
  { id: 0, leftPx: [88, 84], rightPx: [88, 84], tip: '消防通道内不得堆放杂物，保持畅通才能在火灾时快速疏散。' },
  { id: 1, leftPx: [220, 105], rightPx: [220, 105], tip: '灭火器应放在明显、便于取用的位置，且不得遮挡或上锁。' },
  { id: 2, leftPx: [312, 156], rightPx: [312, 156], tip: '安全出口指示牌应保持常亮，断电时应急灯自动点亮。' },
  { id: 3, leftPx: [140, 204], rightPx: [140, 204], tip: '消火栓前方严禁遮挡，周围 1.5 米内不得放置物品。' },
  { id: 4, leftPx: [288, 246], rightPx: [288, 246], tip: '锂电池起火时优先用灭火毯覆盖或大量水冷却，慎用干粉。' },
]

/** 根据上面像素生成的、可直接用于 SPOT_LEVELS 的 differences 数组（含 r 与 tip） */
export const MOCK_DIFFERENCES_FROM_PIXEL: DifferenceRegion[] = MOCK_DIFFERENCES_BY_PIXEL.map((d) => {
  const left = toRelative(d.leftPx[0], d.leftPx[1])
  const right = toRelative(d.rightPx[0], d.rightPx[1])
  const r = 0.06
  return {
    id: d.id,
    left: { ...left, r },
    right: { ...right, r },
    tip: d.tip,
  }
})

/*
 使用方式示例：

 1) 在设计图（如 400×300）上标出每处差异的中心点像素 (px, py)。
 2) 用 toRelative(px, py) 得到 cx, cy；或手算 cx = px/400, cy = py/300。
 3) 设定 r，一般 0.05～0.08；点小的差异用 0.05，点大的用 0.08。
 4) 若左右图差异位置不同，left 与 right 填不同的 (cx, cy)。

 最终填入 types.ts 的 SPOT_LEVELS：

 differences: [
   { id: 0, left: { cx: 0.22, cy: 0.28, r: 0.06 }, right: { cx: 0.22, cy: 0.28, r: 0.06 } },
   { id: 1, left: { cx: 0.55, cy: 0.35, r: 0.06 }, right: { cx: 0.55, cy: 0.35, r: 0.06 } },
   // ...
 ]
*/
