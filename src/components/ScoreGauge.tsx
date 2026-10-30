import type { RideScore } from '../lib/rideScore'
import { Dial, type Zone } from './gauges'

const toneColor: Record<RideScore['tone'], string> = {
  great: 'var(--color-good)',
  good: '#84cc16',
  care: 'var(--color-warn)',
  bad: 'var(--color-bad)',
}

// Same thresholds as labelFor() in rideScore.ts.
const ZONES: Zone[] = [
  { from: 0, to: 40, color: toneColor.bad },
  { from: 40, to: 60, color: toneColor.care },
  { from: 60, to: 80, color: toneColor.good },
  { from: 80, to: 100, color: toneColor.great },
]

/** Speedometer-style ride score dial. */
export function ScoreGauge({ score, size = 200 }: { score: number; size?: number }) {
  return <Dial value={score} step={20} minor={4} zones={ZONES} label="RIDE SCORE" unit="/ 100" size={size} ariaLabel={`Ride score ${score} out of 100`} />
}

export const scoreColor = toneColor
