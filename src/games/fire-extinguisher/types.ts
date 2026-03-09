/**
 * 连连看 - 消防器材识别
 * 类型与常量定义（与规则文档第六章一致）
 */

/** 单个灭火器类型：id、名称、适用场景小知识 */
export interface FireExtinguisherType {
  id: number
  name: string
  tip: string
}

/** 四种灭火器（与规则六一致） */
export const TYPES = [
  {
    id: 0,
    name: '二氧化碳灭火器',
    tip: '锂电池灭火适用性：中。适用配电间/精密仪器实验室。带电设备、精密仪器；不导电、不留残渣。',
  },
  {
    id: 1,
    name: '干粉灭火器',
    tip: '锂电池灭火适用性：中。适用电池生产车间/仓库。油类、气体、带电设备；通用常见。',
  },
  {
    id: 2,
    name: '水基灭火器',
    tip: '锂电池灭火适用性：良好。适用 cell 化成、容量、静置车间；固体可燃物（A 类）；忌油类、带电。',
  },
  {
    id: 3,
    name: '泡沫灭火器',
    tip: '锂电池灭火适用性：不适用。适用电解液房、电解液仓库；油类、易燃液体；在表面形成覆盖层隔绝氧气。',
  },
] as const

/** 与主题色系一致：主色蓝、琥珀、成功绿、靛蓝（对应 CO₂、干粉、水基、泡沫） */
export const TYPE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1'] as const
/** 格子内显示的短标签（规则 2.6） */
export const TYPE_LABELS = ['CO₂', '干粉', '水基', '泡沫'] as const

/** 总格数（规则 2.6：24 对 × 2 = 48） */
export const TOTAL_CELLS = 48
/** 每种灭火器对数（规则 2.6：6 对） */
export const PAIRS_PER_TYPE = 6
/** 48 的因数，用于响应式列数（规则 2.6：列数 4 或 6，最多 6 列） */
export const GRID_FACTORS = [4, 6] as const

/** 二维坐标点（用于连线路径，规则 3.3） */
export interface Point {
  x: number
  y: number
}

/** selectCell 返回值：可消除时带两格坐标与类型 id */
export interface SelectCellResult {
  connected: boolean
  typeId?: number
  r1?: number
  c1?: number
  r2?: number
  c2?: number
}

/** findHint 返回值：一对可消除格子的坐标 */
export interface HintPair {
  r1: number
  c1: number
  r2: number
  c2: number
}

/** 小知识区展示内容：最近一次消除的灭火器名称与适用场景（规则 2.4） */
export interface MatchedTipDisplay {
  name: string
  tip: string
}

/** 消除动画进行中时记录的两格坐标与类型（用于画线、加 class、commitClear） */
export interface AnimatingPair {
  r1: number
  c1: number
  r2: number
  c2: number
  typeId: number
}
