/**
 * 消防器材总动员 - 主组件（大家来找茬）
 * 规则对齐：见 docs/消防找茬.md。死亡规则 = 误点达上限即本关失败；超时规则 = 限时内未找齐即本关超时。
 * 安全：小知识 tip 仅作文本展示，不解析 HTML，避免 XSS。
 */
import { useCallback, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Toast } from 'antd-mobile'
import { gameStore } from './gameStore'
import { SPOT_LEVELS, type DifferenceRegion, type CircleRegion } from './types'
import { GAME_TITLE, GAME_INTRO, MAX_WRONG_CLICKS_PER_LEVEL, LEVEL_DURATION_SEC, TIMEOUT_WARNING_SEC } from './constants'
import './styles.less'

/** 将剩余秒数格式化为 MM:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/** 图片区域宽高比，与坐标判定一致（0～1 相对比例） */
const IMAGE_ASPECT = 4 / 3

/**
 * 点击是否落在圆形判定区域内（规则：圆心 (cx,cy) 半径 r，均为 0～1）
 * 使用平方比较避免开方，性能更优。
 */
function hitTest(cx: number, cy: number, region: CircleRegion): boolean {
  const dx = cx - region.cx
  const dy = cy - region.cy
  return dx * dx + dy * dy <= region.r * region.r
}

function FireEquipmentRallyGame(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * 规则：点击左/右图时转为相对坐标 (cx,cy)，仅对「未找到」的差异做圆内判定；
   * 命中则 markFound，未命中则 recordWrongClick + Toast「再试试」。已过关/失败/超时后不再响应点击。
   */
  const handleImageClick = useCallback(
    (side: 'left' | 'right', e: React.MouseEvent<HTMLDivElement>) => {
      if (gameStore.screen !== 'play' || !gameStore.currentLevel) return
      if (gameStore.isLevelComplete() || gameStore.isLevelFailed() || gameStore.isLevelTimedOut) return

      const el = e.currentTarget
      const rect = el.getBoundingClientRect()
      const cx = (e.clientX - rect.left) / rect.width
      const cy = (e.clientY - rect.top) / rect.height

      const differences = gameStore.currentLevel.differences
      const regionKey: 'left' | 'right' = side === 'left' ? 'left' : 'right'

      for (const d of differences) {
        if (gameStore.isFound(d.id)) continue
        const region = d[regionKey]
        if (hitTest(cx, cy, region)) {
          gameStore.markFound(d.id)
          return
        }
      }

      gameStore.recordWrongClick()
      Toast.show({ content: '再试试', position: 'top', duration: 1200 })
      if (gameStore.isLevelFailed()) {
        Toast.show({ content: '本关误点次数已达上限', position: 'top', duration: 2000 })
      }
    },
    []
  )

  /**
   * 超时规则：每关倒计时，到 0 即本关超时；剩余 TIMEOUT_WARNING_SEC 秒时 Toast 提醒一次。
   * 必须放在所有条件 return 之前，保证 Hooks 调用顺序一致（Rules of Hooks）。
   */
  useEffect(() => {
    if (gameStore.screen !== 'play' || gameStore.levelTimeRemaining <= 0) return
    if (gameStore.isLevelComplete() || gameStore.isLevelFailed()) return
    const id = setInterval(() => {
      if (gameStore.isLevelComplete() || gameStore.isLevelFailed()) {
        clearInterval(id)
        return
      }
      gameStore.tick()
      if (gameStore.levelTimeRemaining === TIMEOUT_WARNING_SEC) {
        Toast.show({ content: `剩余 ${TIMEOUT_WARNING_SEC} 秒，即将超时`, position: 'top', duration: 2000 })
      }
      if (gameStore.levelTimeRemaining <= 0) {
        Toast.show({ content: '时间到，本关超时', position: 'top', duration: 2000 })
        clearInterval(id)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [gameStore.screen, gameStore.currentLevelIndex])

  if (gameStore.screen === 'start') {
    return (
      <div className="fer-game fer-screen fer-start">
        <h1 className="fer-title">{GAME_TITLE}</h1>
        <p className="fer-desc">{GAME_INTRO}</p>
        <Button className="fer-btn-action" color="primary" size="middle" onClick={() => gameStore.start()}>
          开始游戏
        </Button>
      </div>
    )
  }

  if (gameStore.screen === 'end') {
    /** 通过关数：若当前下标已等于总关数说明刚完成最后一关，否则为 currentLevelIndex+1（刚点「查看结果」时） */
    const passedLevels =
      gameStore.currentLevelIndex >= SPOT_LEVELS.length
        ? SPOT_LEVELS.length
        : gameStore.currentLevelIndex + 1
    return (
      <div className="fer-game fer-screen fer-end">
        <h2 className="fer-title">全部完成</h2>
        <p className="fer-desc">
          共 {SPOT_LEVELS.length} 关，通过 {passedLevels} 关，累计找到 {gameStore.totalFoundCount} 处差异。
        </p>
        <Button className="fer-btn-action" color="primary" onClick={() => gameStore.restart()}>
          再玩一次
        </Button>
      </div>
    )
  }

  const level = gameStore.currentLevel
  if (!level) {
    return (
      <div className="fer-game fer-screen fer-start">
        <p className="fer-desc">暂无关卡</p>
        <Button className="fer-btn-action" color="primary" onClick={() => gameStore.restart()}>
          返回
        </Button>
      </div>
    )
  }

  const total = level.differences.length
  const foundCount = gameStore.foundIds.length
  const complete = gameStore.isLevelComplete()
  const failed = gameStore.isLevelFailed()
  const timedOut = gameStore.isLevelTimedOut
  const remainingWrong = MAX_WRONG_CLICKS_PER_LEVEL > 0 ? MAX_WRONG_CLICKS_PER_LEVEL - gameStore.wrongClicks : null
  const showTimer = LEVEL_DURATION_SEC > 0 && gameStore.levelTimeRemaining >= 0

  return (
    <div className="fer-game fer-play" ref={containerRef}>
      <div className="fer-spot-header">
        <span className="fer-spot-title">
          第 {gameStore.currentLevelIndex + 1} 关 · {level.title}
        </span>
        <span className="fer-spot-progress">
          已找 {foundCount} / {total}
          {remainingWrong !== null && (
            <span className="fer-spot-wrong"> · 剩余误点 {Math.max(0, remainingWrong)}</span>
          )}
          {showTimer && (
            <span className={gameStore.levelTimeRemaining <= TIMEOUT_WARNING_SEC ? 'fer-spot-time fer-spot-time-warn' : 'fer-spot-time'}>
              · {formatTime(gameStore.levelTimeRemaining)}
            </span>
          )}
        </span>
      </div>

      <div className="fer-spot-panels">
        <div className="fer-spot-panel">
          <div
            className="fer-spot-image-wrap"
            style={{ aspectRatio: IMAGE_ASPECT }}
            onClick={(e) => !complete && !failed && !timedOut && handleImageClick('left', e)}
          >
            {level.leftImage ? (
              <img src={level.leftImage} alt="左图" className="fer-spot-image" />
            ) : (
              <div className="fer-spot-placeholder">左图 · 点击圆圈内可命中</div>
            )}
            <SpotOverlays differences={level.differences} side="left" showHint={!level.leftImage} />
          </div>
        </div>
        <div className="fer-spot-panel">
          <div
            className="fer-spot-image-wrap"
            style={{ aspectRatio: IMAGE_ASPECT }}
            onClick={(e) => !complete && !failed && !timedOut && handleImageClick('right', e)}
          >
            {level.rightImage ? (
              <img src={level.rightImage} alt="右图" className="fer-spot-image" />
            ) : (
              <div className="fer-spot-placeholder">右图 · 点击圆圈内可命中</div>
            )}
            <SpotOverlays differences={level.differences} side="right" showHint={!level.rightImage} />
          </div>
        </div>
      </div>

      {/* 规则：每找到一处差异，下方展示该差异对应的小知识（仅展示最近一次）；tip 仅作文本，不解析 HTML */}
      {foundCount > 0 && (() => {
        const lastFoundId = gameStore.foundIds[gameStore.foundIds.length - 1]
        const diff = level.differences.find((d) => d.id === lastFoundId)
        const tip: string | undefined = diff?.tip
        if (tip == null || tip === '') return null
        return (
          <div className="fer-spot-tip">
            <span className="fer-spot-tip-label">小知识</span>
            <p className="fer-spot-tip-text">{tip}</p>
          </div>
        )
      })()}

      {/* 本关通过 */}
      {complete && (
        <div className="fer-spot-modal fer-spot-modal-success">
          <div className="fer-spot-modal-inner">
            <p className="fer-spot-modal-title">本关通过</p>
            <p className="fer-spot-modal-desc">已找出全部 {total} 处差异</p>
            <div className="fer-spot-modal-actions">
              {gameStore.hasNextLevel ? (
                <Button color="primary" onClick={() => gameStore.nextLevel()}>
                  下一关
                </Button>
              ) : null}
              <Button color="primary" fill="outline" onClick={() => gameStore.finish()}>
                {gameStore.hasNextLevel ? '查看结果' : '完成'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 本关失败（死亡规则：误点超限） */}
      {failed && !complete && !timedOut && (
        <div className="fer-spot-modal fer-spot-modal-fail">
          <div className="fer-spot-modal-inner">
            <p className="fer-spot-modal-title">本关失败</p>
            <p className="fer-spot-modal-desc">误点次数已达上限，可重试本关或返回</p>
            <div className="fer-spot-modal-actions">
              <Button color="primary" onClick={() => gameStore.retryLevel()}>
                重试本关
              </Button>
              <Button fill="outline" onClick={() => gameStore.restart()}>
                返回开始
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 本关超时（超时规则：限时内未找齐） */}
      {timedOut && !complete && (
        <div className="fer-spot-modal fer-spot-modal-fail">
          <div className="fer-spot-modal-inner">
            <p className="fer-spot-modal-title">本关超时</p>
            <p className="fer-spot-modal-desc">时间到未找齐全部差异，可重试本关或返回</p>
            <div className="fer-spot-modal-actions">
              <Button color="primary" onClick={() => gameStore.retryLevel()}>
                重试本关
              </Button>
              <Button fill="outline" onClick={() => gameStore.restart()}>
                返回开始
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/** 左/右图上的差异圈 overlay：已找到的显示闭合圆环，占位图模式下未找到的显示虚线提示圈 */
interface SpotOverlaysProps {
  differences: readonly DifferenceRegion[]
  side: 'left' | 'right'
  showHint?: boolean
}

const SpotOverlays = observer(function SpotOverlays({
  differences,
  side,
  showHint = false,
}: SpotOverlaysProps): JSX.Element {
  const regionKey: 'left' | 'right' = side
  return (
    <div className="fer-spot-overlays" aria-hidden>
      {differences.map((d) => {
        const region = d[regionKey]
        const found = gameStore.isFound(d.id)
        if (!found && !showHint) return null
        const sizePct = 2 * region.r * (IMAGE_ASPECT >= 1 ? 1 / IMAGE_ASPECT : IMAGE_ASPECT) * 100
        const pos: React.CSSProperties = {
          left: `${region.cx * 100}%`,
          top: `${region.cy * 100}%`,
          width: `${sizePct}%`,
          height: `${sizePct}%`,
          transform: 'translate(-50%, -50%)',
        }
        if (found) {
          return (
            <div key={d.id} className="fer-spot-dot fer-spot-dot-found" style={pos}>
              <svg className="fer-spot-dot-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                <circle className="fer-spot-dot-ring" cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
            </div>
          )
        }
        return <div key={d.id} className="fer-spot-dot fer-spot-dot-hint" style={pos} />
      })}
    </div>
  )
})

export default observer(FireEquipmentRallyGame)
