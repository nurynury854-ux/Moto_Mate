import { useState } from 'react'
import { History, Plus, Trash2, Wrench } from 'lucide-react'
import { useStore } from '../lib/store'
import { allServiceDue } from '../lib/schedule'
import { formatDate, todayISO, uid } from '../lib/date'
import { ServiceCard } from '../components/ServiceCard'
import { Button, Card, CardTitle, Empty, Field, Input, PageHeader, Stat, inputClass, km, nt } from '../components/ui'

export default function Garage() {
  const { bike, items, setItems, services, setServices, bumpOdometer } = useStore()
  const today = todayISO()
  const dues = allServiceDue(items, services, bike, today)
  const [showLog, setShowLog] = useState(false)
  const [showCustom, setShowCustom] = useState(false)

  const [form, setForm] = useState({ itemId: items[0]?.id ?? '', date: today, odometer: String(bike.odometer), cost: '', notes: '' })
  const [custom, setCustom] = useState({ name: '', intervalKm: '', intervalMonths: '' })

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? 'Removed item'
  const totalSpend = services.reduce((s, r) => s + r.cost, 0)
  const needAttention = dues.filter((d) => d.status !== 'ok').length

  const markDone = (itemId: string) => {
    setServices((s) => [...s, { id: uid(), itemId, date: today, odometer: bike.odometer, cost: 0, notes: 'Marked done' }])
  }

  const submitLog = (e: React.FormEvent) => {
    e.preventDefault()
    const odo = Number(form.odometer)
    setServices((s) => [...s, { id: uid(), itemId: form.itemId, date: form.date, odometer: odo, cost: Number(form.cost) || 0, notes: form.notes.trim() }])
    bumpOdometer(odo)
    setForm((f) => ({ ...f, cost: '', notes: '' }))
    setShowLog(false)
  }

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const intervalKm = Number(custom.intervalKm) || undefined
    const intervalMonths = Number(custom.intervalMonths) || undefined
    if (!custom.name.trim() || (!intervalKm && !intervalMonths)) return
    setItems((list) => [...list, { id: uid(), name: custom.name.trim(), description: 'Custom item', intervalKm, intervalMonths, custom: true }])
    setCustom({ name: '', intervalKm: '', intervalMonths: '' })
    setShowCustom(false)
  }

  const history = [...services].sort((a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer)

  return (
    <>
      <PageHeader
        title="Garage"
        subtitle={`${bike.model} · ${km(bike.odometer)} km`}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowCustom((v) => !v)}>
              <Plus size={16} /> Custom item
            </Button>
            <Button onClick={() => setShowLog((v) => !v)}>
              <Wrench size={16} /> Log service
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Odometer" value={km(bike.odometer)} unit="km" />
        <Stat label="Need attention" value={needAttention} unit={`of ${dues.length}`} />
        <Stat label="Maintenance spend" value={nt(totalSpend)} hint={`${services.length} services logged`} />
      </div>

      {showLog && (
        <Card className="mb-6 border-accent/40">
          <CardTitle icon={<Wrench size={16} />}>Log a service</CardTitle>
          <form onSubmit={submitLog} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Service" className="lg:col-span-2">
              <select className={inputClass} value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })}>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <Input type="date" required value={form.date} max={today} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Odometer (km)">
              <Input type="number" required min={0} value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
            </Field>
            <Field label="Cost (NT$)">
              <Input type="number" min={0} placeholder="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>
            <Field label="Notes" className="sm:col-span-2 lg:col-span-4">
              <Input placeholder="e.g. Motul 3000 10W-40 at the corner shop" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Save</Button>
            </div>
          </form>
        </Card>
      )}

      {showCustom && (
        <Card className="mb-6 border-accent/40">
          <CardTitle icon={<Plus size={16} />}>Add a custom maintenance item</CardTitle>
          <form onSubmit={submitCustom} className="grid gap-4 sm:grid-cols-4">
            <Field label="Name" className="sm:col-span-2">
              <Input required placeholder="e.g. Coolant, Valve check, Wash" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
            </Field>
            <Field label="Every … km">
              <Input type="number" min={0} placeholder="3000" value={custom.intervalKm} onChange={(e) => setCustom({ ...custom, intervalKm: e.target.value })} />
            </Field>
            <Field label="or every … months">
              <Input type="number" min={0} placeholder="6" value={custom.intervalMonths} onChange={(e) => setCustom({ ...custom, intervalMonths: e.target.value })} />
            </Field>
            <div className="sm:col-span-4">
              <Button type="submit">Add item</Button>
            </div>
          </form>
        </Card>
      )}

      <section className="mb-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dues.map((d) => (
            <ServiceCard
              key={d.item.id}
              due={d}
              onDone={() => markDone(d.item.id)}
              onRemove={d.item.custom ? () => setItems((l) => l.filter((i) => i.id !== d.item.id)) : undefined}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Intervals are approximate for the SYM Wild Wolf 150 — always check your owner's manual. Items turn amber at 80% and red when overdue (by km or time, whichever comes first).
        </p>
      </section>

      <Card>
        <CardTitle icon={<History size={16} />}>Service history</CardTitle>
        {history.length === 0 ? (
          <Empty icon={<Wrench size={28} />} title="No services yet">
            Log your first oil change or chain lube, or load demo data from Settings.
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {history.map((r) => (
              <li key={r.id} className="flex items-center gap-4 py-3">
                <div className="w-24 shrink-0 text-xs text-muted">{formatDate(r.date)}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{itemName(r.itemId)}</div>
                  {r.notes && <div className="truncate text-xs text-muted">{r.notes}</div>}
                </div>
                <div className="num hidden text-sm text-muted sm:block">{km(r.odometer)} km</div>
                <div className="num w-20 text-right text-sm">{r.cost ? nt(r.cost) : '—'}</div>
                <button aria-label="Delete record" onClick={() => setServices((s) => s.filter((x) => x.id !== r.id))} className="cursor-pointer text-muted hover:text-bad">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}
