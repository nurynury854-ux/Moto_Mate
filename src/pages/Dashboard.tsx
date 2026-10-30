import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronRight, CloudSun, FileWarning, Fuel, Gauge, Pencil, Sparkles, Wrench } from 'lucide-react'
import { useStore } from '../lib/store'
import { useForecast } from '../hooks/useForecast'
import { allServiceDue, type ServiceDue } from '../lib/schedule'
import { fuelStats, monthlySpend } from '../lib/fuel'
import { scoreHour } from '../lib/rideScore'
import { weatherLabel } from '../lib/weather'
import { daysBetween, formatDate, todayISO } from '../lib/date'
import { ScoreGauge, scoreColor } from '../components/ScoreGauge'
import { ServiceCard, serviceIcon, statusLabel, statusTone } from '../components/ServiceCard'
import { Dial, Odometer, type Zone } from '../components/gauges'
import { Badge, Button, Card, CardTitle, Input, Stat, cx, nt, toneText, type Tone } from '../components/ui'

// Wild Wolf 150 riders typically see 35–45 km/L.
const KMPL_ZONES: Zone[] = [
  { from: 20, to: 30, color: 'var(--color-bad)' },
  { from: 30, to: 35, color: 'var(--color-warn)' },
  { from: 35, to: 50, color: 'var(--color-good)' },
]

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { bike, setBike, items, services, fuel, reminders, setReminders, place, loadDemo } = useStore()
  const today = todayISO()
  const { data: forecast } = useForecast(place)
  const allDues = allServiceDue(items, services, bike, today)
  const dues = allDues.slice(0, 3)
  // Lamps keep a fixed position, like on a real cluster.
  const lamps = items.map((i) => allDues.find((d) => d.item.id === i.id)!)
  const paperworkSoon = reminders.some((r) => daysBetween(today, r.dueDate) <= 30)
  const stats = fuelStats(fuel)
  const thisMonth = monthlySpend(fuel).find((m) => m.month === today.slice(0, 7))?.spend ?? 0
  const now = forecast?.hours[0] ? scoreHour(forecast.hours[0]) : null
  const isEmpty = fuel.length === 0 && services.length === 0

  const [editingOdo, setEditingOdo] = useState(false)
  const [odoInput, setOdoInput] = useState('')

  const saveOdo = (e: React.FormEvent) => {
    e.preventDefault()
    const v = Number(odoInput)
    if (v >= 0) setBike({ ...bike, odometer: v })
    setEditingOdo(false)
  }

  return (
    <>
      <div className="mb-6">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-muted">{formatDate(today)}</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide sm:text-4xl">{greeting()}, rider.</h1>
        <div className="stripe mt-2 ml-1" />
      </div>

      {isEmpty && (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 text-sm">
            <Sparkles size={18} className="shrink-0 text-accent" />
            <span>New here? Load 4 months of sample rides to see MotoMate in action, or start logging your own.</span>
          </div>
          <Button onClick={loadDemo} className="shrink-0">Load demo data</Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bike hero */}
        <Card className="carbon lg:col-span-2">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">{bike.model}</Badge>
                {bike.plate && <span className="num rounded-md border border-line bg-black/40 px-2 py-0.5 text-xs text-muted">{bike.plate}</span>}
              </div>
              <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-wide">{bike.nickname}</h2>
              <div className="mt-5 font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">Odometer</div>
              {editingOdo ? (
                <form onSubmit={saveOdo} className="mt-1.5 flex max-w-xs gap-2">
                  <Input type="number" min={0} autoFocus value={odoInput} onChange={(e) => setOdoInput(e.target.value)} aria-label="Odometer in km" />
                  <Button type="submit">Save</Button>
                </form>
              ) : (
                <div className="mt-1.5 flex flex-wrap items-end gap-3">
                  <Odometer value={bike.odometer} className="text-4xl sm:text-5xl" />
                  <span className="pb-1 font-display text-lg font-semibold text-muted">KM</span>
                  <button
                    onClick={() => { setOdoInput(String(bike.odometer)); setEditingOdo(true) }}
                    className="mb-1 inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-display text-sm font-bold uppercase tracking-wider text-accent hover:bg-accent-soft"
                  >
                    <Pencil size={12} /> Update
                  </button>
                </div>
              )}
              <div className="mt-6 grid max-w-sm grid-cols-2 gap-2 sm:gap-3">
                <Stat label="This month" value={nt(thisMonth)} />
                <Stat label="Per km" value={stats.costPerKm ? `$${stats.costPerKm.toFixed(2)}` : '—'} />
              </div>
            </div>
            <Dial
              value={stats.avgKmPerLiter ?? 20}
              min={20}
              max={50}
              step={5}
              minor={5}
              zones={KMPL_ZONES}
              label="ECONOMY"
              unit="KM / L"
              format={(v) => (stats.avgKmPerLiter ? v.toFixed(1) : '—')}
              size={210}
              ariaLabel={stats.avgKmPerLiter ? `Average fuel economy ${stats.avgKmPerLiter.toFixed(1)} km per liter` : 'No fuel economy data yet'}
            />
          </div>
          <WarningLights dues={lamps} paperworkSoon={paperworkSoon} />
        </Card>

        {/* Ride score */}
        <Link to="/ride" className="group">
          <Card className="flex h-full flex-col items-center justify-center text-center transition-colors group-hover:border-accent/50">
            <CardTitle icon={<CloudSun size={16} />}>Ride today? · {place.name.replace(/^My location \(near (.+)\)$/, '$1')}</CardTitle>
            {now && forecast ? (
              <>
                <ScoreGauge score={now.score} size={190} />
                <div className="mt-1 font-display text-2xl font-bold uppercase tracking-wide" style={{ color: scoreColor[now.tone] }}>{now.label}</div>
                <div className="mt-1 text-sm text-muted">
                  {weatherLabel(forecast.current.code)} · {Math.round(forecast.current.temp)}°C
                </div>
              </>
            ) : (
              <div className="h-[190px] w-[190px] animate-pulse rounded-full bg-surface-2" />
            )}
            <div className="mt-3 flex items-center gap-1 font-display text-sm font-bold uppercase tracking-wider text-accent">
              12-hour forecast <ChevronRight size={14} />
            </div>
          </Card>
        </Link>

        {/* Maintenance */}
        <Card className="lg:col-span-2">
          <CardTitle
            icon={<Wrench size={16} />}
            action={<Link to="/garage" className="flex items-center gap-1 font-display text-sm font-bold uppercase tracking-wider text-accent">Garage <ChevronRight size={14} /></Link>}
          >
            Up next
          </CardTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {dues.map((d) => <ServiceCard key={d.item.id} due={d} />)}
          </div>
        </Card>

        {/* Paperwork */}
        <Card>
          <CardTitle icon={<CalendarClock size={16} />}>Paperwork</CardTitle>
          <ul className="space-y-4">
            {reminders.map((r) => {
              const days = daysBetween(today, r.dueDate)
              const tone: Tone = days < 0 ? 'bad' : days <= 30 ? 'warn' : 'good'
              return (
                <li key={r.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium">{r.title}</div>
                    <Badge tone={tone}>{days < 0 ? `${-days}d overdue` : `${days}d`}</Badge>
                  </div>
                  <input
                    type="date"
                    aria-label={`${r.title} due date`}
                    value={r.dueDate}
                    onChange={(e) => e.target.value && setReminders((list) => list.map((x) => (x.id === r.id ? { ...x, dueDate: e.target.value } : x)))}
                    className="num mt-1 cursor-pointer bg-transparent text-xs text-muted outline-none hover:text-ink"
                  />
                  <p className="mt-1 text-xs text-muted/80">{r.note}</p>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickLink to="/fuel" icon={<Fuel size={18} />} title="Log a fill-up" text="Track km/L and spending" />
        <QuickLink to="/garage" icon={<Gauge size={18} />} title="Log a service" text="Oil, chain, brakes and more" />
        <QuickLink to="/diagnose" icon={<Wrench size={18} />} title="Something wrong?" text="Diagnose your bike in 3 questions" />
      </div>
    </>
  )
}

function QuickLink({ to, icon, title, text }: { to: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <Link to={to} className="panel group flex items-center gap-3 rounded-2xl border border-line p-4 transition-colors hover:border-accent/50">
      <span className="rounded-xl bg-accent-soft p-2.5 text-accent">{icon}</span>
      <span className="flex-1">
        <span className="block font-display text-base font-bold uppercase tracking-wide">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
      <ChevronRight size={16} className="text-muted group-hover:text-accent" />
    </Link>
  )
}

/** Dashboard "tell-tale" lamps: one per service item, lit when it needs attention. */
function WarningLights({ dues, paperworkSoon }: { dues: ServiceDue[]; paperworkSoon: boolean }) {
  const lamp = (lit: boolean, tone: Tone) =>
    cx('rounded-md border p-1.5 transition-colors', lit ? cx('border-current/40 bg-current/10', toneText[tone]) : 'border-line text-[#3a414c] hover:text-muted')
  const glow = (lit: boolean) => (lit ? { filter: 'drop-shadow(0 0 6px currentColor)' } : undefined)
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      <span className="mr-1 font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted">Warning lights</span>
      {dues.map((d) => {
        const Icon = serviceIcon(d.item.id)
        const lit = d.status !== 'ok'
        return (
          <Link key={d.item.id} to="/garage" title={`${d.item.name}: ${statusLabel[d.status]}`} aria-label={`${d.item.name}: ${statusLabel[d.status]}`} className={lamp(lit, statusTone[d.status])} style={glow(lit)}>
            <Icon size={16} />
          </Link>
        )
      })}
      <span title={paperworkSoon ? 'Paperwork due within 30 days' : 'Paperwork OK'} aria-label={paperworkSoon ? 'Paperwork due within 30 days' : 'Paperwork OK'} className={lamp(paperworkSoon, 'warn')} style={glow(paperworkSoon)}>
        <FileWarning size={16} />
      </span>
    </div>
  )
}
