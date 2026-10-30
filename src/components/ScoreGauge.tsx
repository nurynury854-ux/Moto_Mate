import type { RideScore } from '../lib/rideScore'

const toneColor: Record<RideScore['tone'], string> = {
  great: 'var(--color-good)',
  good: '#84cc16',
  care: 'var(--color-warn)',
  bad: 'var(--color-bad)',
}

/** Speedometer-style 240° arc gauge. */
export function ScoreGauge({ score, tone, size = 180 }: { score: number; tone: RideScore['tone']; size?: number }) {
  const r = 70
  const c = 2 * Math.PI * r
  const arc = c * (240 / 360)
  const filled = arc * (score / 100)
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" role="img" aria-label={`Ride score ${score} out of 100`}>
      <g transform="rotate(150 90 90)">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--color-line)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
        <circle
          cx="90" cy="90" r={r} fill="none" stroke={toneColor[tone]} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`} style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </g>
      <text x="90" y="98" textAnchor="middle" className="num" fontSize="46" fontWeight="700" fill="var(--color-ink)">{score}</text>
      <text x="90" y="124" textAnchor="middle" fontSize="11" fill="var(--color-muted)" letterSpacing="2">RIDE SCORE</text>
    </svg>
  )
}

export const scoreColor = toneColor
