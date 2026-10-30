import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ChevronRight, CloudSun, Fuel, Gauge, Motorbike, Pencil, Sparkles, Wrench } from 'lucide-react'
import { useStore } from '../lib/store'
import { useForecast } from '../hooks/useForecast'
import { allServiceDue } from '../lib/schedule'
import { fuelStats, monthlySpend } from '../lib/fuel'
import { scoreHour } from '../lib/rideScore'
import { weatherLabel } from '../lib/weather'
import { daysBetween, formatDate, todayISO } from '../lib/date'
import { ScoreGauge, scoreColor } from '../components/ScoreGauge'
import { ServiceCard } from '../components/ServiceCard'
import { Badge, Button, Card, CardTitle, Input, Stat, km, nt, type Tone } from '../components/ui'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { bike, setBike, items, services, fuel, reminders, setReminders, place, loadDemo } = useStore()
  const today = todayISO()
  const { data: forecast } = useForecast(place)
  const dues = allServiceDue(items, services, bike, today).slice(0, 3)
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
        <p className="text-sm text-muted">{formatDate(today)}</p>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{greeting()}, rider.</h1>
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
        <Card className="relative overflow-hidden lg:col-span-2">
          <Motorbike size={220} strokeWidth={1} className="pointer-events-none absolute -right-8 -bottom-10 text-accent/10" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{bike.model}</Badge>
              {bike.plate && <span className="num rounded-md border border-line px-2 py-0.5 text-xs text-muted">{bike.plate}</span>}
            </div>
            <h2 className="mt-3 text-3xl font-extrabold">{bike.nickname}</h2>
            <div className="mt-6 text-xs font-medium uppercase tracking-wider text-muted">Odometer</div>
            {editingOdo ? (
              <form onSubmit={saveOdo} className="mt-1 flex max-w-xs gap-2">
                <Input type="number" min={0} autoFocus value={odoInput} onChange={(e) => setOdoInput(e.target.value)} aria-label="Odometer in km" />
                <Button type="submit">Save</Button>
              </form>
            ) : (
              <div className="flex items-baseline gap-3">
                <span className="num text-5xl font-bold tracking-tight">{km(bike.odometer)}</span>
                <span className="text-muted">km</span>
                <button
                  onClick={() => { setOdoInput(String(bike.odometer)); setEditingOdo(true) }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-accent hover:bg-accent-soft"
                >
                  <Pencil size={12} /> Update
                </button>
              </div>
            )}
            <div className="mt-6 grid max-w-lg grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Avg" value={stats.avgKmPerLiter ? stats.avgKmPerLiter.toFixed(1) : '—'} unit="km/L" />
              <Stat label="This month" value={nt(thisMonth)} />
              <Stat label="Per km" value={stats.costPerKm ? `$${stats.costPerKm.toFixed(2)}` : '—'} />
            </div>
          </div>
        </Card>

        {/* Ride score */}
        <Link to="/ride" className="group">
          <Card className="flex h-full flex-col items-center justify-center text-center transition-colors group-hover:border-accent/50">
            <CardTitle icon={<CloudSun size={16} />}>Ride today? · {place.name.replace(/^My location \(near (.+)\)$/, '$1')}</CardTitle>
            {now && forecast ? (
              <>
                <ScoreGauge score={now.score} tone={now.tone} size={160} />
                <div className="-mt-2 text-xl font-bold" style={{ color: scoreColor[now.tone] }}>{now.label}</div>
                <div className="mt-1 text-sm text-muted">
                  {weatherLabel(forecast.current.code)} · {Math.round(forecast.current.temp)}°C
                </div>
              </>
            ) : (
              <div className="h-40 w-40 animate-pulse rounded-full bg-surface-2" />
            )}
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent">
              12-hour forecast <ChevronRight size={14} />
            </div>
          </Card>
        </Link>

        {/* Maintenance */}
        <Card className="lg:col-span-2">
          <CardTitle
            icon={<Wrench size={16} />}
            action={<Link to="/garage" className="flex items-center gap-1 text-xs font-semibold text-accent">Garage <ChevronRight size={14} /></Link>}
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
    <Link to={to} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-accent/50">
      <span className="rounded-xl bg-accent-soft p-2.5 text-accent">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
      <ChevronRight size={16} className="text-muted group-hover:text-accent" />
    </Link>
  )
}
