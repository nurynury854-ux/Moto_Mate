import { useEffect, useState } from 'react'
import { Database, Motorbike, RotateCcw, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { defaultReminders } from '../lib/reminders'
import { todayISO } from '../lib/date'
import { Button, Card, CardTitle, Field, Input, PageHeader } from '../components/ui'

export default function SettingsPage() {
  const { bike, setBike, setReminders, loadDemo, resetAll } = useStore()
  const [form, setForm] = useState(bike)
  useEffect(() => setForm(bike), [bike])
  const [saved, setSaved] = useState<string | null>(null)

  const flash = (msg: string) => {
    setSaved(msg)
    setTimeout(() => setSaved(null), 2500)
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setBike(form)
    if (form.purchaseDate !== bike.purchaseDate) setReminders(defaultReminders(form, todayISO()))
    flash('Bike details saved.')
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your bike's details and app data. Everything is stored privately in this browser." />

      {saved && <div className="mb-4 rounded-xl border border-good/40 bg-good/10 px-4 py-2.5 text-sm text-good">{saved}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle icon={<Motorbike size={16} />}>My bike</CardTitle>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nickname">
              <Input required value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
            </Field>
            <Field label="Model">
              <Input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </Field>
            <Field label="Plate number">
              <Input placeholder="ABC-1234" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Purchase / registration date">
              <Input type="date" required value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </Field>
            <Field label="Odometer when added (km)">
              <Input type="number" min={0} value={form.startOdometer} onChange={(e) => setForm({ ...form, startOdometer: Number(e.target.value) })} />
            </Field>
            <Field label="Current odometer (km)">
              <Input type="number" min={0} value={form.odometer} onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit">Save bike</Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardTitle icon={<Database size={16} />}>Data</CardTitle>
          <div className="space-y-5">
            <div>
              <div className="font-semibold">Demo data</div>
              <p className="mt-1 text-sm text-muted">
                Fills the app with 4 months of realistic rides on a SYM Wild Wolf 150: fill-ups around Taipei, an oil change, chain care and more. This replaces your current data.
              </p>
              <Button
                className="mt-3"
                onClick={() => {
                  if (confirm('Replace your current data with demo data?')) {
                    loadDemo()
                    flash('Demo data loaded — check the dashboard!')
                  }
                }}
              >
                <Sparkles size={16} /> Load demo data
              </Button>
            </div>
            <div className="border-t border-line pt-5">
              <div className="font-semibold">Reset</div>
              <p className="mt-1 text-sm text-muted">Delete all logs and start fresh with an empty Wild Wolf 150.</p>
              <Button
                variant="danger"
                className="mt-3"
                onClick={() => {
                  if (confirm('Delete all MotoMate data in this browser?')) {
                    resetAll()
                    flash('All data cleared.')
                  }
                }}
              >
                <RotateCcw size={16} /> Reset everything
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        MotoMate · built for Next Byte Hacks V5 · Weather data by Open-Meteo · No accounts, no tracking.
      </p>
    </>
  )
}
