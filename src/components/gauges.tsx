import { useEffect, useRef, useState } from 'react'
import { cx } from './ui'

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Gauges mounted right after page load do a full "ignition self-test" sweep, like a real cluster. */
const BOOT_AT = typeof performance !== 'undefined' ? performance.now() : 0
const isBooting = () => performance.now() - BOOT_AT < 4000

/** Eases a number toward `target` with requestAnimationFrame. */
function useTween(target: number, from: number, ms = 750) {
  const [v, setV] = useState(from)
  const current = useRef(from)
  useEffect(() => {
    if (reducedMotion()) {
      current.current = target
      setV(target)
      return
    }
    const start = performance.now()
    const a = current.current
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      const x = a + (target - a) * (1 - Math.pow(1 - k, 3))
      current.current = x
      setV(x)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

/** Needle value: min → (max on boot) → value. */
function useGaugeValue(value: number, min: number, max: number) {
  const [target, setTarget] = useState(min)
  const [warm, setWarm] = useState(false)
  useEffect(() => {
    if (warm || reducedMotion() || !isBooting()) {
      setTarget(value)
      return
    }
    const t1 = setTimeout(() => setTarget(max), 60)
    const t2 = setTimeout(() => setWarm(true), 900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [value, max, warm])
  return useTween(target, min)
}

// ---------------------------------------------------------------- Dial

const START = 150 // degrees, SVG coords (0 = +x, clockwise)
const SWEEP = 240

function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)]
}

function arc(r: number, a0: number, a1: number) {
  const [x0, y0] = polar(r, a0)
  const [x1, y1] = polar(r, a1)
  return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`
}

export interface Zone {
  from: number
  to: number
  color: string
}

interface DialProps {
  value: number
  min?: number
  max?: number
  /** Value between labelled major ticks. */
  step: number
  /** Minor ticks per major step. */
  minor?: number
  zones: Zone[]
  label: string
  unit?: string
  format?: (v: number) => string
  size?: number
  ariaLabel: string
}

/** Analog instrument dial with colored zones, tick marks and a sweeping needle. */
export function Dial({ value, min = 0, max = 100, step, minor = 4, zones, label, unit, format = (v) => String(Math.round(v)), size = 180, ariaLabel }: DialProps) {
  const shown = useGaugeValue(Math.min(max, Math.max(min, value)), min, max)
  const angle = (v: number) => START + (SWEEP * (v - min)) / (max - min)
  const zoneAt = (v: number) => zones.find((z) => v >= z.from && v <= z.to)?.color ?? 'var(--color-accent)'

  const ticks: { v: number; major: boolean }[] = []
  const minorStep = step / minor
  for (let i = 0; min + i * minorStep <= max + 1e-9; i++) ticks.push({ v: min + i * minorStep, major: i % minor === 0 })

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={ariaLabel} className="shrink-0">
      <defs>
        <radialGradient id="dial-face" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#1c2027" />
          <stop offset="100%" stopColor="#0a0b0e" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="97" fill="url(#dial-face)" stroke="#2c323c" strokeWidth="2" />
      <circle cx="100" cy="100" r="91" fill="none" stroke="#ffffff08" strokeWidth="1" />

      {/* Zones: dim band for the full range, bright band up to the needle. */}
      {zones.map((z) => (
        <path key={`d${z.from}`} d={arc(84, angle(z.from), angle(z.to))} fill="none" stroke={z.color} strokeOpacity="0.18" strokeWidth="6" />
      ))}
      {zones.map((z) =>
        shown > z.from ? (
          <path
            key={`l${z.from}`}
            d={arc(84, angle(z.from), angle(Math.min(z.to, shown)))}
            fill="none"
            stroke={z.color}
            strokeWidth="6"
            style={{ filter: `drop-shadow(0 0 4px ${z.color})` }}
          />
        ) : null,
      )}

      {ticks.map(({ v, major }) => {
        const [x0, y0] = polar(major ? 66 : 72, angle(v))
        const [x1, y1] = polar(78, angle(v))
        return <line key={v} x1={x0} y1={y0} x2={x1} y2={y1} stroke={major ? '#d5d9e0' : '#5b6370'} strokeWidth={major ? 2.2 : 1.2} strokeLinecap="round" />
      })}
      {ticks
        .filter((t) => t.major)
        .map(({ v }) => {
          const [x, y] = polar(54, angle(v))
          return (
            <text key={v} x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="#9aa3b1" style={{ fontFamily: "var(--font-display)" }}>
              {Math.round(v)}
            </text>
          )
        })}


      {/* Needle */}
      <g style={{ transform: `rotate(${angle(shown)}deg)`, transformOrigin: '100px 100px' }}>
        <polygon points="86,98.4 182,100 86,101.6" fill="var(--color-accent)" style={{ filter: 'drop-shadow(0 0 3px #ff6a13aa)' }} />
      </g>
      <circle cx="100" cy="100" r="10" fill="#1d2129" stroke="#3a414c" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="3.5" fill="var(--color-accent)" />

      <text x="100" y="128" textAnchor="middle" fontSize="10" fontWeight="600" letterSpacing="2.5" fill="var(--color-muted)" style={{ fontFamily: "var(--font-display)" }}>
        {label}
      </text>
      <text x="100" y="157" textAnchor="middle" className="num" fontSize="30" fontWeight="700" fill={zoneAt(shown)}>
        {format(shown)}
      </text>
      {unit && (
        <text x="100" y="174" textAnchor="middle" fontSize="10" fontWeight="600" letterSpacing="2" fill="var(--color-muted)" style={{ fontFamily: "var(--font-display)" }}>
          {unit}
        </text>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------- Segment bar

interface SegmentBarProps {
  /** 0 → empty, 1 → full. Values above 1 fill the bar and flash it. */
  value: number
  /** Color of a lit segment, given its position (0–1) along the bar. */
  color: (pos: number) => string
  segments?: number
  vertical?: boolean
  className?: string
}

/** LED bar graph, like a rev-counter strip or fuel level indicator. */
export function SegmentBar({ value, color, segments = 24, vertical, className }: SegmentBarProps) {
  const shown = useTween(Math.max(0, value), 0, 600)
  const lit = Math.round(Math.min(1, shown) * segments)
  return (
    <div
      className={cx('flex gap-[3px]', vertical ? 'h-full w-full flex-col-reverse' : 'h-2.5 w-full', value > 1 && 'redline', className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(Math.min(1, value) * 100)}
    >
      {Array.from({ length: segments }, (_, i) => {
        const on = i < Math.max(value > 0 ? 1 : 0, lit)
        const c = color((i + 1) / segments)
        return (
          <div
            key={i}
            className="flex-1 rounded-[2px]"
            style={on ? { background: c, boxShadow: `0 0 6px ${c}88` } : { background: '#20242c' }}
          />
        )
      })}
    </div>
  )
}

/** Wear-style coloring: green until 80 %, amber to 100 %, red once past it. */
export const wearColor = (overdue: boolean) => (pos: number) =>
  overdue ? 'var(--color-bad)' : pos <= 0.8 ? 'var(--color-good)' : 'var(--color-warn)'

export const solidColor = (c: string) => () => c

// ---------------------------------------------------------------- Odometer

/** Mechanical drum odometer — each digit rolls into place. */
export function Odometer({ value, digits = 6, className }: { value: number; digits?: number; className?: string }) {
  const [shown, setShown] = useState(reducedMotion() ? value : 0)
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 80)
    return () => clearTimeout(t)
  }, [value])

  const real = String(Math.max(0, Math.round(value)))
  const str = String(Math.max(0, Math.round(shown))).padStart(Math.max(digits, real.length), '0')
  const leading = str.length - real.length

  return (
    <div className={cx('num inline-flex gap-[3px] rounded-lg border border-[#2c323c] bg-black p-[3px] font-bold leading-none shadow-[inset_0_2px_6px_#000]', className)} aria-label={`${real} km`}>
      {str.split('').map((d, i) => (
        <span
          key={i}
          className={cx('relative h-[1.25em] w-[0.78em] overflow-hidden rounded-[4px] bg-[linear-gradient(180deg,#0b0c0f,#23272f_50%,#0b0c0f)]', i < leading ? 'text-[#4a515c]' : 'text-ink')}
          aria-hidden
        >
          <span className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-[1200ms] ease-[cubic-bezier(.2,.8,.2,1)]" style={{ transform: `translateY(-${Number(d) * 1.25}em)`, transitionDelay: `${(str.length - i) * 60}ms` }}>
            {'0123456789'.split('').map((n) => (
              <span key={n} className="flex h-[1.25em] items-center justify-center">{n}</span>
            ))}
          </span>
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#000a,transparent_30%,transparent_70%,#000a)]" />
        </span>
      ))}
    </div>
  )
}
