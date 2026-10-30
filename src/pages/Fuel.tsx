import { useState } from 'react'
import { Fuel as FuelIcon, Plus, Trash2, TrendingUp, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../lib/store'
import { fillCost, fuelStats, monthlySpend } from '../lib/fuel'
import { formatDate, parseISODate, todayISO, uid } from '../lib/date'
import { ChartTooltip } from '../components/ChartTooltip'
import { Button, Card, CardTitle, Empty, Field, Input, PageHeader, Stat, km, nt } from '../components/ui'

const ACCENT = '#f97316'
const axisProps = { stroke: 'var(--color-muted)', fontSize: 11, tickLine: false, axisLine: false } as const
const shortDate = (s: string) => parseISODate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const monthLabel = (m: string) => parseISODate(`${m}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

export default function FuelPage() {
  const { bike, fuel, setFuel, bumpOdometer } = useStore()
  const today = todayISO()
  const stats = fuelStats(fuel)
  const months = monthlySpend(fuel)
  const thisMonth = months.find((m) => m.month === today.slice(0, 7))?.spend ?? 0
  const lastPrice = [...fuel].sort((a, b) => b.date.localeCompare(a.date))[0]?.pricePerLiter ?? 30.1

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: today, odometer: '', liters: '', price: String(lastPrice) })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const odometer = Number(form.odometer)
    setFuel((f) => [...f, { id: uid(), date: form.date, odometer, liters: Number(form.liters), pricePerLiter: Number(form.price) }])
    bumpOdometer(odometer)
    setForm({ ...form, odometer: '', liters: '' })
    setShowForm(false)
  }

  const effData = stats.segments.map((s) => ({ date: s.entry.date, kmpl: Math.round(s.kmPerLiter * 10) / 10 }))
  const rows = [...fuel].sort((a, b) => b.odometer - a.odometer)
  const effById = new Map(stats.segments.map((s) => [s.entry.id, s]))
  const liveCost = Number(form.liters) * Number(form.price)

  return (
    <>
      <PageHeader
        title="Fuel log"
        subtitle="Fill the tank to the top each time — MotoMate calculates real km/L between fill-ups."
        action={
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} /> Add fill-up
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 border-accent/40">
          <CardTitle icon={<FuelIcon size={16} />}>New fill-up</CardTitle>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Date">
              <Input type="date" required max={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Odometer (km)">
              <Input type="number" required min={0} placeholder={String(bike.odometer)} value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
            </Field>
            <Field label="Liters">
              <Input type="number" required min={0.1} step={0.01} placeholder="4.8" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} />
            </Field>
            <Field label="Price (NT$/L, 95)">
              <Input type="number" required min={1} step={0.1} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <div className="flex flex-col justify-end">
              <Button type="submit">Save{liveCost > 0 ? ` · ${nt(liveCost)}` : ''}</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Average" value={stats.avgKmPerLiter ? stats.avgKmPerLiter.toFixed(1) : '—'} unit="km/L" hint="Wild Wolf 150 typical: 35–45" />
        <Stat label="Cost per km" value={stats.costPerKm ? `NT$${stats.costPerKm.toFixed(2)}` : '—'} hint={stats.costPerKm ? `${nt(stats.costPerKm * 100)} per 100 km` : undefined} />
        <Stat label="This month" value={nt(thisMonth)} />
        <Stat label="Total tracked" value={km(stats.totalKm)} unit="km" hint={`${nt(stats.totalCost)} on ${fuel.length} fill-ups`} />
      </div>

      {fuel.length < 2 ? (
        <Card>
          <Empty icon={<FuelIcon size={28} />} title="Add at least two fill-ups">
            Your first fill-up sets the starting point; the second one gives your first km/L. Or load demo data from Settings.
          </Empty>
        </Card>
      ) : (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle icon={<TrendingUp size={16} />}>Fuel efficiency (km/L)</CardTitle>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={effData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line)" />
                  <XAxis dataKey="date" tickFormatter={shortDate} minTickGap={24} {...axisProps} />
                  <YAxis domain={['dataMin - 3', 'dataMax + 3']} tickFormatter={(v) => Math.round(v).toString()} {...axisProps} />
                  <Tooltip
                    cursor={{ stroke: 'var(--color-muted)', strokeDasharray: '3 3' }}
                    content={<ChartTooltip format={(v) => `${v.toFixed(1)} km/L`} labelFormat={formatDate} />}
                  />
                  <Line type="monotone" dataKey="kmpl" stroke={ACCENT} strokeWidth={2} dot={{ r: 4, fill: ACCENT, stroke: 'var(--color-surface)', strokeWidth: 2 }} activeDot={{ r: 6, stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <CardTitle icon={<Wallet size={16} />}>Monthly fuel spend (NT$)</CardTitle>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--color-line)" />
                  <XAxis dataKey="month" tickFormatter={monthLabel} {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip cursor={{ fill: 'var(--color-surface-2)' }} content={<ChartTooltip format={nt} labelFormat={monthLabel} />} />
                  <Bar dataKey="spend" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {rows.length > 0 && (
        <Card>
          <CardTitle icon={<FuelIcon size={16} />}>Fill-ups</CardTitle>
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 text-right font-medium">Odometer</th>
                  <th className="pb-2 text-right font-medium">Liters</th>
                  <th className="pb-2 text-right font-medium">NT$/L</th>
                  <th className="pb-2 text-right font-medium">Cost</th>
                  <th className="pb-2 text-right font-medium">km/L</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="num divide-y divide-line">
                {rows.map((e) => {
                  const seg = effById.get(e.id)
                  return (
                    <tr key={e.id}>
                      <td className="py-2.5 font-sans">{formatDate(e.date)}</td>
                      <td className="py-2.5 text-right">{km(e.odometer)}</td>
                      <td className="py-2.5 text-right">{e.liters.toFixed(2)}</td>
                      <td className="py-2.5 text-right">{e.pricePerLiter.toFixed(1)}</td>
                      <td className="py-2.5 text-right">{nt(fillCost(e))}</td>
                      <td className="py-2.5 text-right">{seg ? seg.kmPerLiter.toFixed(1) : <span className="text-muted">start</span>}</td>
                      <td className="py-2.5 text-right">
                        <button aria-label="Delete fill-up" onClick={() => setFuel((f) => f.filter((x) => x.id !== e.id))} className="cursor-pointer text-muted hover:text-bad">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
