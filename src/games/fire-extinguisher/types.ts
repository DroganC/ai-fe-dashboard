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

/* 与主题色系一致：主色蓝、琥珀、成功绿、靛蓝 */
export const TYPE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1'] as const
export const TYPE_LABELS = ['CO₂', '干粉', '水基', '泡沫'] as const

export const TOTAL_CELLS = 48
export const PAIRS_PER_TYPE = 6
/** 48 的因数，用于响应式列数，最多 6 列 */
export const GRID_FACTORS = [4, 6] as const

export type Point = { x: number; y: number }
