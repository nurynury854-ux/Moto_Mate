import { useState } from 'react'
import { Clock, CloudRain, Droplets, LocateFixed, MapPin, RotateCcw, Shirt, Thermometer, TriangleAlert, Wind } from 'lucide-react'
import { useStore } from '../lib/store'
import { useForecast } from '../hooks/useForecast'
import { TAIWAN_CITIES, nearestCity, weatherLabel } from '../lib/weather'
import { bestWindow, gearTips, scoreHour } from '../lib/rideScore'
import { ScoreGauge, scoreColor } from '../components/ScoreGauge'
import { Button, Card, CardTitle, PageHeader, cx, inputClass } from '../components/ui'
import { SegmentBar, solidColor } from '../components/gauges'

const hourLabel = (iso: string) => iso.slice(11, 16)

export default function Ride() {
  const { place, setPlace } = useStore()
  const { data, error, loading, refresh } = useForecast(place)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  const locate = () => {
    if (!navigator.geolocation) return setGeoError('Location is not supported in this browser.')
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        setPlace({ name: `My location (near ${nearestCity(lat, lon).name})`, lat, lon })
        setLocating(false)
      },
      () => {
        setGeoError('Location permission denied — pick a city instead.')
        setLocating(false)
      },
      { timeout: 10_000 },
    )
  }

  const next12 = data?.hours.slice(0, 12) ?? []
  const now = next12[0] ? scoreHour(next12[0]) : null
  const best = bestWindow(next12, 2)
  const tips = gearTips(next12.slice(0, 6))

  return (
    <>
      <PageHeader
        title="Ride or Rain?"
        subtitle="Live weather and air quality turned into one ride score, from 0 to 100."
        action={
          <div className="flex w-full gap-2 sm:w-auto">
            <select
              aria-label="City"
              className={cx(inputClass, 'sm:w-48')}
              value={TAIWAN_CITIES.some((c) => c.name === place.name) ? place.name : ''}
              onChange={(e) => setPlace(TAIWAN_CITIES.find((c) => c.name === e.target.value)!)}
            >
              {!TAIWAN_CITIES.some((c) => c.name === place.name) && <option value="">{place.name}</option>}
              {TAIWAN_CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <Button variant="ghost" onClick={locate} disabled={locating} aria-label="Use my location">
              <LocateFixed size={16} className={locating ? 'animate-pulse' : ''} />
            </Button>
            <Button variant="ghost" onClick={refresh} aria-label="Refresh">
              <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
        }
      />

      {geoError && <p className="mb-4 text-sm text-warn">{geoError}</p>}

      {error && !data && (
        <Card className="text-center">
          <TriangleAlert className="mx-auto mb-2 text-warn" />
          <p className="font-semibold">Couldn't reach the weather service</p>
          <p className="mt-1 text-sm text-muted">{error}. Check your connection and try again.</p>
          <Button className="mt-4" onClick={refresh}>Retry</Button>
        </Card>
      )}

      {!data && !error && <Card className="h-72 animate-pulse" />}

      {data && now && (
        <div className={cx('grid grid-cols-1 gap-6 lg:grid-cols-5', loading && 'opacity-60')}>
          <Card className="lg:col-span-3">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div className="shrink-0">
                <ScoreGauge score={now.score} size={210} />
              </div>
              <div className="w-full min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <MapPin size={14} /> {place.name} · now
                </div>
                <div className="mt-1 font-display text-4xl font-bold uppercase tracking-wide" style={{ color: scoreColor[now.tone] }}>{now.label}</div>
                <div className="mt-1 text-muted">{weatherLabel(data.current.code)}</div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                  <Metric icon={<Thermometer size={14} />} label="Temp" value={`${Math.round(data.current.temp)}°C`} sub={`feels ${Math.round(data.current.feelsLike)}°`} />
                  <Metric icon={<Wind size={14} />} label="Wind" value={`${Math.round(data.current.wind)}`} sub="km/h" />
                  <Metric icon={<Droplets size={14} />} label="Humidity" value={`${data.current.humidity}%`} />
                  <Metric icon={<CloudRain size={14} />} label="AQI" value={data.current.aqi !== undefined ? `${Math.round(data.current.aqi)}` : '—'} sub={data.current.pm25 !== undefined ? `PM2.5 ${Math.round(data.current.pm25)}` : undefined} />
                </div>
              </div>
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <div className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">Why this score</div>
              {now.penalties.length === 0 ? (
                <p className="text-sm text-good">No penalties — perfect riding conditions.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {now.penalties.map((p) => (
                    <li key={p.factor} className="flex items-center justify-between gap-3">
                      <span>
                        <span className="font-medium">{p.factor}</span> <span className="text-muted">— {p.detail}</span>
                      </span>
                      <span className="num shrink-0 text-bad">−{p.points}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <div className="flex flex-col gap-6 lg:col-span-2">
            {best && (
              <Card className="border-accent/30 bg-gradient-to-br from-accent-soft to-surface">
                <CardTitle icon={<Clock size={16} />}>Best time to ride</CardTitle>
                <div className="num text-3xl font-bold">
                  {hourLabel(next12[best.start].time)}–{hourLabel(next12[best.start + 1].time).slice(0, 2)}:59
                </div>
                <p className="mt-1 text-sm text-muted">
                  Average score <span className="num font-semibold text-ink">{Math.round(best.avg)}</span> in the next 12 hours
                  {best.start === 0 ? ' — that is right now!' : '.'}
                </p>
              </Card>
            )}
            <Card className="flex-1">
              <CardTitle icon={<Shirt size={16} />}>What to bring</CardTitle>
              <ul className="space-y-2.5 text-sm">
                {tips.map((t) => (
                  <li key={t.id} className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {t.text}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="lg:col-span-5">
            <CardTitle icon={<Clock size={16} />}>Next 12 hours</CardTitle>
            <div className="-mx-5 overflow-x-auto px-5 pb-1">
              <div className="flex min-w-max gap-2">
                {next12.map((h, i) => {
                  const s = scoreHour(h)
                  const inBest = best && i >= best.start && i < best.start + 2
                  return (
                    <div
                      key={h.time}
                      title={`${hourLabel(h.time)} — score ${s.score}: ${s.label}`}
                      className={cx('flex w-16 flex-col items-center gap-2 rounded-xl border px-1 py-3', inBest ? 'border-accent/60 bg-accent-soft' : 'border-line bg-[#0c0e11]')}
                    >
                      <div className="num text-xs text-muted">{i === 0 ? 'Now' : hourLabel(h.time)}</div>
                      <div className="h-24 w-4">
                        <SegmentBar vertical value={s.score / 100} segments={12} color={solidColor(scoreColor[s.tone])} />
                      </div>
                      <div className="num text-sm font-bold">{s.score}</div>
                      <div className="num text-[11px] text-sky">{h.rainProb}%</div>
                      <div className="num text-[11px] text-muted">{Math.round(h.temp)}°</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span>LED bar = ride score</span>
              <span className="text-sky">Blue = chance of rain</span>
              <span>Grey = temperature</span>
              <span className="text-accent">Highlighted = best window</span>
            </div>
          </Card>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        Weather and air quality by Open-Meteo. The score is guidance, not a guarantee — always ride for the conditions you see.
      </p>
    </>
  )
}

function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-muted">{icon}{label}</div>
      <div className="num font-semibold">{value}</div>
      {sub && <div className="num text-xs text-muted">{sub}</div>}
    </div>
  )
}
