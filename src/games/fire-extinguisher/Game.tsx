/**
 * 连连看 - 消防器材识别（主游戏组件）
 * 流程符合规则文档：开始页 → 进行中（头部/网格/小知识区/吸底操作栏）→ 结束页
 */
import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Toast } from 'antd-mobile'
import { gameStore } from './gameStore'
import { TYPES, TYPE_COLORS, TYPE_LABELS } from './types'
import type { Point, MatchedTipDisplay, AnimatingPair } from './types'
import { getPath } from './utils'
import {
  LINE_DURATION_MS,
  LINE_CLEAR_DELAY_MS,
  MATCH_ANIMATION_MS,
  HINT_HIGHLIGHT_MS,
  HINT_COOLDOWN_MS,
  SHUFFLE_SHAKE_MS,
} from './constants'
import './styles.less'

function FireExtinguisherGame(): JSX.Element {
  const gridRef = useRef<HTMLDivElement>(null)
  /** 格子 DOM 引用，key 为 `${r}-${c}`，用于 getRect、消除动画、提示高亮 */
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({})
  /** 全屏连线 SVG 层（规则 2.7：主题色、绘制过渡） */
  const lineSvgRef = useRef<SVGSVGElement>(null)
  /** 当前正在播放消除动画的一对格子（规则 4.1：画线→消除动画→提交）；非空时禁止点击 */
  const [animatingOut, setAnimatingOut] = useState<AnimatingPair | null>(null)
  /** 提示按钮冷却剩余毫秒数（规则 4） */
  const [hintCooldown, setHintCooldown] = useState<number>(0)
  /** 小知识区展示内容（规则 2.4：最近一次消除的灭火器名称与小知识） */
  const [lastMatchedTip, setLastMatchedTip] = useState<MatchedTipDisplay | null>(null)
  /** 重排抖动动效是否进行中（规则 2.7） */
  const [shuffleShake, setShuffleShake] = useState<boolean>(false)
  /** 忙碌状态：消除动画进行中时格子不可点、重排禁用 */
  const isBusy = animatingOut !== null

  /** 卸载时清理所有定时器，避免内存泄漏与卸载后 setState */
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const intervalIdsRef = useRef<ReturnType<typeof setInterval>[]>([])
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((id) => clearTimeout(id))
      intervalIdsRef.current.forEach((id) => clearInterval(id))
      timeoutIdsRef.current = []
      intervalIdsRef.current = []
    }
  }, [])

  /** 按类型缓存的格子文字样式，避免每格每帧创建新对象（性能） */
  const cellStyleByType = useMemo(
    () =>
      TYPE_COLORS.map((color) => ({
        color,
        fontWeight: 700 as const,
        fontSize: '0.75em',
      })),
    []
  )

  /** 获取格子相对于视口的位置，用于计算连线路径（规则 3.3） */
  const getRect = useCallback((r: number, c: number): DOMRect | null => {
    const key = `${r}-${c}`
    const el = cellRefs.current[key]
    return el?.getBoundingClientRect() ?? null
  }, [])

  /** 在全屏 SVG 层绘制连线：主题色、绘制过渡动画，LINE_CLEAR_DELAY_MS 后清除（规则 2.7、4.1） */
  const drawLine = useCallback(
    (path: Point[]) => {
      if (!path.length || !lineSvgRef.current) return
      const W = window.innerWidth
      const H = window.innerHeight
      lineSvgRef.current.setAttribute('viewBox', `0 0 ${W} ${H}`)
      let d = `M ${path[0].x} ${path[0].y}`
      for (let i = 1; i < path.length; i++)
        d += ` L ${path[i].x} ${path[i].y}`
      const pathEl = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      )
      const rootStyle = getComputedStyle(document.documentElement)
      const lineColor =
        rootStyle.getPropertyValue('--fe-line-stroke-subtle').trim() ||
        rootStyle.getPropertyValue('--fe-line-stroke').trim() ||
        'rgba(59, 130, 246, 0.75)'
      pathEl.setAttribute('d', d)
      pathEl.setAttribute('fill', 'none')
      pathEl.setAttribute('stroke', lineColor)
      pathEl.setAttribute('stroke-width', '2')
      pathEl.setAttribute('stroke-linecap', 'round')
      pathEl.setAttribute('stroke-linejoin', 'round')
      lineSvgRef.current.innerHTML = ''
      lineSvgRef.current.appendChild(pathEl)
      const len = pathEl.getTotalLength()
      pathEl.style.strokeDasharray = String(len)
      pathEl.style.strokeDashoffset = String(len)
      pathEl.animate(
        [{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: LINE_DURATION_MS, easing: 'ease-out', fill: 'forwards' }
      )
      setTimeout(() => {
        if (lineSvgRef.current) lineSvgRef.current.innerHTML = ''
      }, LINE_CLEAR_DELAY_MS)
    },
    []
  )

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (isBusy) return
      const result = gameStore.selectCell(r, c)
      if (
        result.connected &&
        result.typeId !== undefined &&
        result.r1 !== undefined &&
        result.c1 !== undefined &&
        result.r2 !== undefined &&
        result.c2 !== undefined
      ) {
        const path = getPath(
          gameStore.grid,
          gameStore.rows,
          gameStore.cols,
          getRect,
          result.r1,
          result.c1,
          result.r2,
          result.c2
        )
        drawLine(path)
        setAnimatingOut({
          r1: result.r1,
          c1: result.c1,
          r2: result.r2,
          c2: result.c2,
          typeId: result.typeId,
        })
        const id1 = setTimeout(() => {
          const el1 = cellRefs.current[`${result.r1}-${result.c1}`]
          const el2 = cellRefs.current[`${result.r2}-${result.c2}`]
          el1?.classList.add('fe-cell-matched')
          el2?.classList.add('fe-cell-matched')
          const id2 = setTimeout(() => {
            gameStore.commitClear(result.r1!, result.c1!, result.r2!, result.c2!)
            setAnimatingOut(null)
            const tip = TYPES[result.typeId!]
            if (tip) setLastMatchedTip({ name: tip.name, tip: tip.tip })
          }, MATCH_ANIMATION_MS)
          timeoutIdsRef.current.push(id2)
        }, LINE_CLEAR_DELAY_MS)
        timeoutIdsRef.current.push(id1)
      }
    },
    [getRect, drawLine, isBusy]
  )

  // ---------- 三种界面（规则 2.1） ----------
  /** 开始页（规则 2.3） */
  if (gameStore.screen === 'start') {
    return (
      <div className="fe-game screen start">
        <h1 className="fe-title">灭火器连连看</h1>
        <p className="fe-desc">
          经典连连看玩法：点击两个<strong>相同</strong>灭火器，用不超过一折的直线连起来即可消除。
          <br />
          认识四种灭火器，消除时查看小知识。
        </p>
        <Button
          className="fe-btn-action"
          color="primary"
          size="middle"
          onClick={() => gameStore.startGame()}
        >
          开始游戏
        </Button>
      </div>
    )
  }

  /** 结束页（规则 2.5、五） */
  if (gameStore.screen === 'end') {
    return (
      <div className="fe-game screen end">
        <h2 className="fe-title">全部消除完成</h2>
        <p className="fe-score">
          共 {gameStore.totalPairs} 对灭火器，全部认全啦！
        </p>
        <p className="fe-desc">
          四种灭火器各有适用场景，生活中遇到火情要先判断类型再选对灭火器哦。
        </p>
        <Button className="fe-btn-action" color="primary" onClick={() => gameStore.restart()}>
          再玩一局
        </Button>
      </div>
    )
  }

  /** 重排：先播抖动再打乱；无解时 Toast 提示（规则 4、2.7） */
  const handleShuffle = (): void => {
    if (shuffleShake) return
    const noSolution = !gameStore.hasSolution()
    setShuffleShake(true)
    const id = setTimeout(() => {
      setShuffleShake(false)
      gameStore.shuffle()
      if (noSolution) Toast.show({ content: '当前无解，已重新排列', position: 'bottom', duration: 2000 })
    }, SHUFFLE_SHAKE_MS)
    timeoutIdsRef.current.push(id)
  }

  /** 提示：高亮一对可消除格子，并进入冷却（规则 4）；无解时 Toast */
  const hint = (): void => {
    if (hintCooldown > 0) return
    const h = gameStore.findHint()
    if (!h) {
      Toast.show({ content: '当前无解，请点击重排', position: 'bottom', duration: 2000 })
      return
    }
    setHintCooldown(HINT_COOLDOWN_MS)
    const el1 = cellRefs.current[`${h.r1}-${h.c1}`]
    const el2 = cellRefs.current[`${h.r2}-${h.c2}`]
    ;[el1, el2].forEach((el) => el?.classList.add('hint'))
    const hideId = setTimeout(() => {
      ;[el1, el2].forEach((el) => el?.classList.remove('hint'))
    }, HINT_HIGHLIGHT_MS)
    timeoutIdsRef.current.push(hideId)
    const t = setInterval(() => {
      setHintCooldown((prev) => {
        const next = prev - 200
        if (next <= 0) clearInterval(t)
        return Math.max(0, next)
      })
    }, 200)
    intervalIdsRef.current.push(t)
  }

  /** 进行中界面（规则 2.4：头部 → 网格 → 小知识区 → 吸底操作栏） */
  return (
    <div className={`fe-game play ${isBusy ? 'fe-game-busy' : ''}`}>
      <div className="fe-header">
        <span>消除相同图案（≤1 折连线）</span>
        <span className="fe-score">
          已消除：{gameStore.pairsDone} / {gameStore.pairsTotal}
        </span>
      </div>
      <div
        className={`fe-grid ${shuffleShake ? 'fe-grid-shake' : ''}`}
        ref={gridRef}
        style={{
          gridTemplateColumns: `repeat(${gameStore.cols}, 1fr)`,
        }}
      >
        {Array.from({ length: gameStore.rows }, (_, r) =>
          Array.from({ length: gameStore.cols }, (_, c) => {
            const type = gameStore.grid[r]?.[c] ?? -1
            const key = `${r}-${c}`
            const isSelected =
              gameStore.selected?.r === r && gameStore.selected?.c === c
            return (
              <div
                key={key}
                ref={(el) => {
                  cellRefs.current[`${r}-${c}`] = el
                }}
                        className={`fe-cell ${type === -1 ? 'empty' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => type !== -1 && handleCellClick(r, c)}
                title={type >= 0 ? TYPES[type]?.name : ''}
              >
                {type >= 0 && (
                  <span style={cellStyleByType[type]}>
                    {TYPE_LABELS[type]}
                  </span>
                )}
              </div>
            )
          })
        ).flat()}
      </div>
      <div className="fe-tip-area">
        {lastMatchedTip ? (
          <div className="fe-tip-inline">
            <div className="fe-tip-inline-title">{lastMatchedTip.name}</div>
            <div className="fe-tip-inline-desc">{lastMatchedTip.tip}</div>
          </div>
        ) : (
          <div className="fe-tip-inline-placeholder">消除一对即可查看小知识</div>
        )}
      </div>
      <div className="fe-actions-bar">
        <div className="fe-actions">
          <Button
            className="fe-btn-action"
            color="primary"
            onClick={hint}
            disabled={isBusy || hintCooldown > 0}
          >
            {hintCooldown > 0 ? `提示 (${Math.ceil(hintCooldown / 1000)}s)` : '提示'}
          </Button>
          <Button
            className="fe-btn-action"
            color="primary"
            onClick={handleShuffle}
            disabled={isBusy || shuffleShake}
          >
            重排
          </Button>
        </div>
      </div>
      <svg
        ref={lineSvgRef}
        className="fe-line-svg"
        aria-hidden
      />
    </div>
  )
}

export default observer(FireExtinguisherGame)
