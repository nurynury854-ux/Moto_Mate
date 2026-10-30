export interface HourWeather {
  time: string // ISO local time, e.g. 2026-10-30T15:00
  temp: number
  feelsLike: number
  rainProb: number // %
  precip: number // mm
  gusts: number // km/h
  uv: number
  code: number // WMO weather code
  isDay: boolean
  aqi?: number // US AQI
  pm25?: number
}

export interface Penalty {
  factor: string
  points: number
  detail: string
}

export interface RideScore {
  score: number
  label: string
  tone: 'great' | 'good' | 'care' | 'bad'
  penalties: Penalty[]
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function isThunderstorm(code: number) {
  return code >= 95
}

export function scoreHour(h: HourWeather): RideScore {
  const penalties: Penalty[] = []
  const add = (factor: string, points: number, detail: string) => {
    const p = Math.round(points)
    if (p > 0) penalties.push({ factor, points: p, detail })
  }

  add('Rain chance', clamp(h.rainProb * 0.4, 0, 40), `${h.rainProb}% chance of rain`)
  if (h.precip > 0.1) add('Rainfall', clamp(h.precip * 15, 0, 30), `${h.precip.toFixed(1)} mm expected — wet roads, longer braking`)
  if (isThunderstorm(h.code)) add('Thunderstorm', 40, 'Lightning risk — do not ride')
  if (h.gusts > 30) add('Wind', clamp((h.gusts - 30) * 0.8, 0, 30), `Gusts up to ${Math.round(h.gusts)} km/h`)
  if (h.feelsLike < 16) add('Cold', clamp((16 - h.feelsLike) * 2.5, 0, 25), `Feels like ${Math.round(h.feelsLike)}°C`)
  if (h.feelsLike > 32) add('Heat', clamp((h.feelsLike - 32) * 3, 0, 25), `Feels like ${Math.round(h.feelsLike)}°C — heat exhaustion risk`)
  if (h.aqi !== undefined && h.aqi > 50) add('Air quality', clamp((h.aqi - 50) * 0.3, 0, 25), `AQI ${Math.round(h.aqi)}${h.pm25 !== undefined ? `, PM2.5 ${h.pm25.toFixed(0)} µg/m³` : ''}`)
  if (h.isDay && h.uv > 7) add('UV', clamp((h.uv - 7) * 3, 0, 15), `UV index ${h.uv.toFixed(0)}`)
  if (!h.isDay) add('Darkness', 5, 'Night riding — lower visibility')

  const score = clamp(100 - penalties.reduce((s, p) => s + p.points, 0), 0, 100)
  penalties.sort((a, b) => b.points - a.points)
  return { score, penalties, ...labelFor(score) }
}

export function labelFor(score: number): Pick<RideScore, 'label' | 'tone'> {
  if (score >= 80) return { label: 'Great ride', tone: 'great' }
  if (score >= 60) return { label: 'Good to go', tone: 'good' }
  if (score >= 40) return { label: 'Ride with care', tone: 'care' }
  return { label: 'Better not', tone: 'bad' }
}

/** Best contiguous window of `size` hours by average score. */
export function bestWindow(hours: HourWeather[], size = 2): { start: number; avg: number } | null {
  if (hours.length < size) return null
  const scores = hours.map((h) => scoreHour(h).score)
  let best = { start: 0, avg: -1 }
  for (let i = 0; i + size <= scores.length; i++) {
    const avg = scores.slice(i, i + size).reduce((a, b) => a + b, 0) / size
    if (avg > best.avg) best = { start: i, avg }
  }
  return best
}

export interface GearTip {
  id: string
  text: string
}

export function gearTips(hours: HourWeather[]): GearTip[] {
  if (!hours.length) return []
  const maxRain = Math.max(...hours.map((h) => h.rainProb))
  const maxPrecip = Math.max(...hours.map((h) => h.precip))
  const maxFeels = Math.max(...hours.map((h) => h.feelsLike))
  const minFeels = Math.min(...hours.map((h) => h.feelsLike))
  const maxUv = Math.max(...hours.map((h) => h.uv))
  const maxAqi = Math.max(...hours.map((h) => h.aqi ?? 0))
  const maxGust = Math.max(...hours.map((h) => h.gusts))
  const storm = hours.some((h) => isThunderstorm(h.code))

  const tips: GearTip[] = []
  if (storm) tips.push({ id: 'storm', text: 'Thunderstorms forecast — postpone or take the MRT/bus.' })
  if (maxRain >= 50 || maxPrecip >= 0.5) tips.push({ id: 'rain', text: 'Pack a two-piece raincoat and shoe covers (雨衣 + 鞋套).' })
  else if (maxRain >= 25) tips.push({ id: 'rain-maybe', text: 'Showers possible — keep a poncho under the seat.' })
  if (maxPrecip >= 0.5) tips.push({ id: 'wet', text: 'Wet roads: watch painted lines, manhole covers and metal plates.' })
  if (maxAqi > 100) tips.push({ id: 'mask', text: 'Poor air — wear a PM2.5 mask and close your visor.' })
  else if (maxAqi > 70) tips.push({ id: 'mask-light', text: 'Moderate air pollution — a mask helps in heavy traffic.' })
  if (maxUv >= 7) tips.push({ id: 'sun', text: 'Strong UV — sunscreen, sleeves or an arm cover.' })
  if (maxFeels >= 32) tips.push({ id: 'heat', text: 'Hot — drink water and avoid long stops in the sun at red lights.' })
  if (minFeels <= 16) tips.push({ id: 'cold', text: 'Chilly — wear a windproof jacket and gloves.' })
  if (maxGust >= 45) tips.push({ id: 'wind', text: 'Strong gusts — avoid bridges and coastal roads, grip firmly.' })
  if (!tips.length) tips.push({ id: 'clear', text: 'Clear conditions — standard helmet and jacket. Enjoy the ride!' })
  return tips
}
