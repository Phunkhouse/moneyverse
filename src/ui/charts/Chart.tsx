'use client'

// Own SVG charts (ADR 0002): line, area, stacked area and columns, drawn at the container's true
// pixel width. Exact values on hover, tap or arrow keys, with a crosshair and a tooltip (AC-7);
// a visually hidden table gives screen readers every value.
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { formatCompact, formatMoney, type Currency } from '../format.ts'
import { nearestIndex, niceTicks } from './scale.ts'
import styles from './Chart.module.scss'

export type Series = {
  name: string
  /** A CSS colour, usually a series token such as `var(--s1)`. */
  color: string
  /** Minor units per label; null where there is no value (before an account opened). */
  values: (number | null)[]
  area?: boolean
  dash?: boolean
  /** Stacked series are drawn as areas on top of each other, in order. */
  stack?: boolean
}

type Common = {
  /** Short axis labels ("lis"), one per point. */
  labels: string[]
  /** Full labels for the tooltip and table ("Listopad 2026"). */
  tipLabels: string[]
  currency: Currency
  /** The chart's accessible name. */
  label: string
  height?: number
  /** White lines and text, for the gradient hero card. */
  onHero?: boolean
}

const PAD = { left: 56, right: 12, top: 14, bottom: 26 }

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(340)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(200, Math.round(entry.contentRect.width)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return { ref, width }
}

/** Which point is active: from the pointer, a tap, or the arrow keys. */
function useActive(count: number, xs: number[]) {
  const [active, setActive] = useState<number | null>(null)
  const onPointer = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const viewWidth = event.currentTarget.viewBox.baseVal.width
    setActive(
      nearestIndex(xs, ((event.clientX - box.left) / box.width) * viewWidth),
    )
  }
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const step = event.key === 'ArrowLeft' ? -1 : 1
      setActive((i) => Math.min(count - 1, Math.max(0, (i ?? count) + step)))
    } else if (event.key === 'Escape') {
      setActive(null)
    }
  }
  return { active, setActive, onPointer, onKey }
}

function Frame({
  common,
  width,
  frameRef,
  active,
  xs,
  rows,
  table,
  onKey,
  onLeave,
  children,
}: {
  common: Common
  width: number
  frameRef: RefObject<HTMLDivElement | null>
  active: number | null
  xs: number[]
  rows: (
    index: number,
  ) => { name: string; color?: string; value: number | null }[]
  table: { name: string; values: (number | null)[] }[]
  onKey: (event: KeyboardEvent<HTMLDivElement>) => void
  onLeave: () => void
  children: ReactNode
}) {
  const tableId = useId()
  const format = (v: number | null) =>
    v === null ? '—' : formatMoney(v, common.currency)
  const left = active === null ? 0 : (xs[active] / width) * 100
  return (
    <div
      ref={frameRef}
      className={`${styles.frame} ${common.onHero ? styles.hero : ''}`}
      tabIndex={0}
      role="group"
      aria-label={common.label}
      aria-describedby={tableId}
      onKeyDown={onKey}
      onBlur={onLeave}
    >
      {children}
      {active !== null && (
        <div
          className={`${styles.tip} ${left > 60 ? styles.tipLeft : ''}`}
          style={{ left: `${left}%` }}
          role="status"
        >
          <b>{common.tipLabels[active]}</b>
          {rows(active).map((row) => (
            <div key={row.name} className={styles.tipRow}>
              <span>
                {row.color && (
                  <i
                    className={styles.swatch}
                    style={{ background: row.color }}
                  />
                )}
                {row.name}
              </span>
              <span className="num">{format(row.value)}</span>
            </div>
          ))}
        </div>
      )}
      <table id={tableId} className="sr-only">
        <caption>{common.label}</caption>
        <thead>
          <tr>
            <th scope="col">Měsíc</th>
            {table.map((s) => (
              <th key={s.name} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {common.tipLabels.map((label, i) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              {table.map((s) => (
                <td key={s.name}>{format(s.values[i])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Axes({
  ticks,
  y,
  width,
  labels,
  x,
  height,
  currency,
}: {
  ticks: number[]
  y: (v: number) => number
  width: number
  labels: string[]
  x: (i: number) => number
  height: number
  currency: Currency
}) {
  const every = labels.length > 8 ? 2 : 1
  const last = labels.length - 1
  return (
    <>
      {ticks.map((t) => (
        <g key={t}>
          <line
            className={t === 0 ? styles.base : styles.grid}
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(t)}
            y2={y(t)}
          />
          <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end">
            {formatCompact(t, currency)}
          </text>
        </g>
      ))}
      {labels.map((label, i) =>
        i % every === last % every ? (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle">
            {label}
          </text>
        ) : null,
      )}
    </>
  )
}

function points(
  values: (number | null)[],
  x: (i: number) => number,
  y: (v: number) => number,
) {
  // Separate runs, so a gap (null) breaks the line instead of joining across it.
  const runs: string[][] = [[]]
  values.forEach((v, i) => {
    if (v === null) {
      if (runs.at(-1)!.length) runs.push([])
    } else runs.at(-1)!.push(`${x(i)},${y(v)}`)
  })
  return runs.filter((r) => r.length > 0)
}

/** Lines, an area under a line, or stacked areas, with a crosshair and tooltip (AC-7). */
export function LineChart({
  series,
  extraRows = [],
  zero = false,
  ...common
}: Common & {
  series: Series[]
  /** Values shown in the tooltip and table only, such as the card debt under a stack. */
  extraRows?: { name: string; values: (number | null)[] }[]
  /** Always include zero on the axis. */
  zero?: boolean
}) {
  const { ref, width } = useWidth()
  const gradient = useId().replace(/:/g, '')
  const height = common.height ?? 170
  const n = common.labels.length
  const stacked = series.filter((s) => s.stack)
  const lines = series.filter((s) => !s.stack)
  const cumulative = stacked.map((_, i) =>
    common.labels.map((__, j) =>
      stacked.slice(0, i + 1).reduce((sum, s) => sum + (s.values[j] ?? 0), 0),
    ),
  )
  const all = [
    ...cumulative.flat(),
    ...lines.flatMap((s) => s.values.filter((v): v is number => v !== null)),
  ]
  let min = all.length ? Math.min(...all) : 0
  let max = all.length ? Math.max(...all) : 0
  if (zero || stacked.length || lines.some((s) => s.area))
    min = Math.min(0, min)
  else min -= (max - min) * 0.15 || 100
  max = Math.max(max, min + 1)
  const ticks = niceTicks(min, max, 4)
  const y0 = ticks[0]
  const y1 = ticks.at(-1)!
  const x = (i: number) =>
    PAD.left + (width - PAD.left - PAD.right) * (n === 1 ? 0.5 : i / (n - 1))
  const y = (v: number) =>
    PAD.top + (height - PAD.top - PAD.bottom) * (1 - (v - y0) / (y1 - y0))
  const xs = common.labels.map((_, i) => x(i))
  const { active, setActive, onPointer, onKey } = useActive(n, xs)
  const baseline = y(Math.max(0, y0))

  return (
    <Frame
      common={common}
      width={width}
      frameRef={ref}
      active={active}
      xs={xs}
      onKey={onKey}
      onLeave={() => setActive(null)}
      rows={(i) => [
        ...series
          .slice()
          .reverse()
          .map((s) => ({ name: s.name, color: s.color, value: s.values[i] })),
        ...extraRows.map((r) => ({ name: r.name, value: r.values[i] })),
      ]}
      table={[...series, ...extraRows]}
    >
      <svg
        className={styles.chart}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={(event) =>
          event.pointerType === 'mouse' && setActive(null)
        }
      >
        <defs>
          {stacked.map((s, i) => (
            <linearGradient
              key={i}
              id={`${gradient}s${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0"
                style={{ stopColor: s.color, stopOpacity: 0.95 }}
              />
              <stop
                offset="1"
                style={{ stopColor: s.color, stopOpacity: 0.6 }}
              />
            </linearGradient>
          ))}
          {lines.map((s, i) =>
            s.area ? (
              <linearGradient
                key={i}
                id={`${gradient}a${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0"
                  style={{ stopColor: s.color, stopOpacity: 0.42 }}
                />
                <stop
                  offset="1"
                  style={{ stopColor: s.color, stopOpacity: 0 }}
                />
              </linearGradient>
            ) : null,
          )}
        </defs>
        <Axes
          ticks={ticks}
          y={y}
          width={width}
          labels={common.labels}
          x={x}
          height={height}
          currency={common.currency}
        />
        {stacked.map((s, i) => {
          const top = cumulative[i].map((v, j) => `${x(j)},${y(v)}`)
          const bottom = (i ? cumulative[i - 1] : cumulative[0].map(() => 0))
            .map((v, j) => `${x(j)},${y(v)}`)
            .reverse()
          return (
            <polygon
              key={s.name}
              points={[...top, ...bottom].join(' ')}
              fill={`url(#${gradient}s${i})`}
              stroke="var(--surface)"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          )
        })}
        {lines.map((s, i) =>
          points(s.values, x, y).map((run, r) => (
            <g key={`${s.name}-${r}`}>
              {s.area && (
                <polygon
                  points={`${run[0].split(',')[0]},${baseline} ${run.join(' ')} ${run.at(-1)!.split(',')[0]},${baseline}`}
                  fill={`url(#${gradient}a${i})`}
                />
              )}
              <polyline
                points={run.join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dash ? '5 4' : undefined}
              />
            </g>
          )),
        )}
        {lines.map((s) => {
          const last = s.values.at(-1)
          return last === null || last === undefined ? null : (
            <circle
              key={s.name}
              cx={x(n - 1)}
              cy={y(last)}
              r={4.5}
              fill={s.color}
              stroke="var(--surface)"
              strokeWidth={2}
            />
          )
        })}
        {active !== null && (
          <line
            className={styles.crosshair}
            x1={xs[active]}
            x2={xs[active]}
            y1={PAD.top}
            y2={height - PAD.bottom}
          />
        )}
      </svg>
    </Frame>
  )
}

/** Monthly columns with an optional dashed reference line (such as the average). */
export function ColumnChart({
  name,
  values,
  reference,
  ...common
}: Common & {
  name: string
  values: number[]
  reference?: { value: number; label: string }
}) {
  const { ref, width } = useWidth()
  const gradient = useId().replace(/:/g, '')
  const height = common.height ?? 170
  const n = values.length
  const max = Math.max(...values, reference?.value ?? 0, 1)
  const ticks = niceTicks(0, max, 4)
  const y1 = ticks.at(-1)!
  const band = (width - PAD.left - PAD.right) / Math.max(1, n)
  const barWidth = Math.max(4, band - 6)
  const x = (i: number) => PAD.left + i * band + band / 2
  const y = (v: number) =>
    PAD.top + (height - PAD.top - PAD.bottom) * (1 - v / y1)
  const xs = values.map((_, i) => x(i))
  const { active, setActive, onPointer, onKey } = useActive(n, xs)

  return (
    <Frame
      common={common}
      width={width}
      frameRef={ref}
      active={active}
      xs={xs}
      onKey={onKey}
      onLeave={() => setActive(null)}
      rows={(i) => [
        { name, color: 'var(--g2)', value: values[i] },
        ...(reference
          ? [{ name: reference.label, value: reference.value }]
          : []),
      ]}
      table={[{ name, values }]}
    >
      <svg
        className={styles.chart}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        onPointerMove={onPointer}
        onPointerDown={onPointer}
        onPointerLeave={(event) =>
          event.pointerType === 'mouse' && setActive(null)
        }
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--g2)' }} />
            <stop offset="1" style={{ stopColor: 'var(--g1)' }} />
          </linearGradient>
        </defs>
        <Axes
          ticks={ticks}
          y={y}
          width={width}
          labels={common.labels}
          x={x}
          height={height}
          currency={common.currency}
        />
        {values.map((v, i) =>
          v > 0 ? (
            <rect
              key={i}
              x={x(i) - barWidth / 2}
              y={y(v)}
              width={barWidth}
              height={y(0) - y(v)}
              rx={Math.min(4, (y(0) - y(v)) / 2)}
              fill={`url(#${gradient})`}
              fillOpacity={i === n - 1 || i === active ? 1 : 0.5}
            />
          ) : null,
        )}
        {reference && (
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(reference.value)}
            y2={y(reference.value)}
            stroke="var(--ink-2)"
            strokeDasharray="4 3"
          />
        )}
        {active !== null && (
          <line
            className={styles.crosshair}
            x1={xs[active]}
            x2={xs[active]}
            y1={PAD.top}
            y2={height - PAD.bottom}
          />
        )}
      </svg>
    </Frame>
  )
}

/** Horizontal paired bars: this month against the average, with the values written out (R-12). */
export function PairedBars({
  rows,
  currency,
  names,
}: {
  rows: { id: string; label: string; a: number; b: number | null }[]
  currency: Currency
  names: [string, string]
}) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.a, r.b ?? 0]))
  return (
    <div className={styles.bars}>
      {rows.map((row) => (
        <div key={row.id} className={styles.bar}>
          <span className={styles.barLabel}>{row.label}</span>
          <span className={styles.tracks} aria-hidden="true">
            <i
              style={{
                width: `${(row.a / max) * 100}%`,
                background: 'var(--s1)',
              }}
            />
            {row.b !== null && (
              <i
                style={{
                  width: `${(row.b / max) * 100}%`,
                  background: 'var(--s2)',
                }}
              />
            )}
          </span>
          <span className={styles.barValue}>
            <span className="sr-only">{names[0]}: </span>
            {formatMoney(row.a, currency, { decimals: 'never' })}
            {row.b !== null && (
              <span className={styles.barSub}>
                <span className="sr-only">{names[1]}: </span>
                {formatMoney(row.b, currency, { decimals: 'never' })}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

export function Legend({
  items,
}: {
  items: { name: string; color?: string; dash?: boolean }[]
}) {
  return (
    <div className={styles.legend}>
      {items.map((item) => (
        <span key={item.name}>
          <i
            className={item.dash ? styles.dash : undefined}
            style={item.dash ? undefined : { background: item.color }}
          />
          {item.name}
        </span>
      ))}
    </div>
  )
}
