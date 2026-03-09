/**
 * 连连看 - 动画与交互时长（规则 2.7、4.1）
 * 单位：毫秒
 */
/** 连线从起点到终点的绘制过渡时长（规则 2.7） */
export const LINE_DURATION_MS: number = 360
/** 连线保留显示时长，之后清除 SVG 并播格子消除动画（规则 4.1 第 2、3 步） */
export const LINE_CLEAR_DELAY_MS: number = 400
/** 格子缩放淡出动画时长（规则 2.7、4.1） */
export const MATCH_ANIMATION_MS: number = 320
/** 无解等 Toast 的展示时长（备用） */
export const TOAST_DURATION_MS: number = 2800
/** 提示高亮一对格子的显示时长（规则 4） */
export const HINT_HIGHLIGHT_MS: number = 800
/** 提示按钮冷却时间（规则 4） */
export const HINT_COOLDOWN_MS: number = 2000
/** 重排网格抖动动效时长（规则 2.7） */
export const SHUFFLE_SHAKE_MS: number = 220
