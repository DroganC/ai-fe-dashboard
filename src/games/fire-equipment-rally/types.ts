import { MOCK_DIFFERENCES_FROM_PIXEL } from './mockLevelExample'

/**
 * 消防器材总动员 - 类型与数据
 * 大家来找茬：关卡与差异区域；保留器材数据供结束页或说明用。
 *
 * 坐标说明（cx, cy, r）：
 * - 均为相对比例 0～1。以图片显示区域为参考：宽方向 0=最左、1=最右，高方向 0=最上、1=最下。
 * - 从设计图像素换算：若设计图宽 W、高 H，某差异中心在像素 (px, py)，则
 *   cx = px / W,  cy = py / H。
 * - r 为圆的半径，相对「短边」的比例。例如 r=0.06 表示半径 = 图片短边长度 × 6%。
 *   点击落在圆心为 (cx,cy)、半径 r 的圆内即判定命中。
 * - 左图用 left，右图用 right；经典找茬左右差异位置可能不同，可设不同 cx,cy。
 */

/** 单侧图上圆形判定区域，均为 0～1 相对比例 */
export interface CircleRegion {
  cx: number
  cy: number
  r: number
}

/** 一处差异的判定区域（左/右图各一圆，相对图片宽高 0～1） */
export interface DifferenceRegion {
  id: number
  /** 左图上该差异的圆形区域 */
  left: CircleRegion
  /** 右图上该差异的圆形区域 */
  right: CircleRegion
  /** 找到该差异后展示的小知识（可选，仅作展示用，不解析 HTML） */
  tip?: string
}

/** 单关找茬数据 */
export interface SpotDifferenceLevel {
  id: number
  title: string
  /** 左图 URL，空字符串表示使用占位图 */
  leftImage: string
  /** 右图 URL */
  rightImage: string
  /** 本关所有差异（规则建议 5～7 处） */
  differences: readonly DifferenceRegion[]
}

/** 找茬关卡列表（只读）；第 1 关使用 mock 示例数据，便于查看效果 */
export const SPOT_LEVELS: readonly SpotDifferenceLevel[] = [
  {
    id: 0,
    title: '示例关（Mock 坐标 400×300）',
    leftImage: '',
    rightImage: '',
    differences: MOCK_DIFFERENCES_FROM_PIXEL,
  },
  {
    id: 1,
    title: '安全出口',
    leftImage: '',
    rightImage: '',
    differences: [
      { id: 0, left: { cx: 0.18, cy: 0.25, r: 0.06 }, right: { cx: 0.18, cy: 0.25, r: 0.06 } },
      { id: 1, left: { cx: 0.48, cy: 0.45, r: 0.06 }, right: { cx: 0.48, cy: 0.45, r: 0.06 } },
      { id: 2, left: { cx: 0.82, cy: 0.38, r: 0.06 }, right: { cx: 0.82, cy: 0.38, r: 0.06 } },
      { id: 3, left: { cx: 0.28, cy: 0.72, r: 0.06 }, right: { cx: 0.28, cy: 0.72, r: 0.06 } },
      { id: 4, left: { cx: 0.65, cy: 0.85, r: 0.06 }, right: { cx: 0.65, cy: 0.85, r: 0.06 } },
    ],
  },
]

/** 单条器材：名称、使用目的、配置场景（保留供结束页/说明） */
export interface FireEquipmentItem {
  id: number
  name: string
  purpose: string
  scenarios: string
}

/** 四种常见消防器材 */
export const EQUIPMENT: readonly FireEquipmentItem[] = [
  { id: 0, name: '移动排烟风机', purpose: '锂电池火灾排烟', scenarios: '微型消防站、重点防火区域、储能电站' },
  { id: 1, name: '灭火毯', purpose: '转移电芯时覆盖使用、非电池火灾隔绝空气灭火', scenarios: '锂离子电池生产车间/仓库' },
  { id: 2, name: '消防沙箱', purpose: '沙子覆盖转移电池', scenarios: '化成、容量、静止车间' },
  { id: 3, name: '消防软管卷盘、消防栓', purpose: '扑灭含锂电池火灾。灭火原理：冷却降温', scenarios: '所有厂房及仓库' },
]
