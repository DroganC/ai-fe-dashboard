/**
 * 消防器材总动员 - 常量（大家来找茬）
 * 与规则文档 消防找茬.md 中的「技术说明与实现要点」一致。
 */

/** 游戏标题 */
export const GAME_TITLE = '消防器材总动员'

/** 开始页玩法说明文案 */
export const GAME_INTRO =
  '找出左右两图的差异，点击正确位置即可标记。全部找完即过关，一起提升消防安全观察力吧。'

/** 每关最大错误点击次数（死亡规则），达到后本关失败；0 表示不限制 */
export const MAX_WRONG_CLICKS_PER_LEVEL = 5

/** 每关限时秒数（超时规则），超时未找齐即本关失败；0 表示不限时 */
export const LEVEL_DURATION_SEC = 60

/** 剩余多少秒时做超时提醒（Toast + 剩余时间变红） */
export const TIMEOUT_WARNING_SEC = 10
