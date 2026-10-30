import { Check, Trash2 } from 'lucide-react'
import type { ServiceDue, ServiceStatus } from '../lib/schedule'
import { formatDate } from '../lib/date'
import { Badge, ProgressBar, km, type Tone } from './ui'

export const statusTone: Record<ServiceStatus, Tone> = { ok: 'good', soon: 'warn', overdue: 'bad' }
export const statusLabel: Record<ServiceStatus, string> = { ok: 'OK', soon: 'Due soon', overdue: 'Overdue' }

export function dueText(d: ServiceDue): string {
  const parts: string[] = []
  if (d.kmLeft !== undefined) parts.push(d.kmLeft >= 0 ? `${km(d.kmLeft)} km left` : `${km(-d.kmLeft)} km over`)
  if (d.daysLeft !== undefined) parts.push(d.daysLeft >= 0 ? `${d.daysLeft} days left` : `${-d.daysLeft} days over`)
  return parts.join(' · ')
}

export function ServiceCard({ due, onDone, onRemove }: { due: ServiceDue; onDone?: () => void; onRemove?: () => void }) {
  const { item, lastRecord, status } = due
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{item.name}</div>
          <div className="mt-0.5 text-xs text-muted">
            Every {[item.intervalKm && `${km(item.intervalKm)} km`, item.intervalMonths && `${item.intervalMonths} mo`].filter(Boolean).join(' / ')}
            {item.firstKm && !lastRecord ? ` · first at ${km(item.firstKm)} km` : ''}
          </div>
        </div>
        <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
      </div>
      <ProgressBar value={due.progress} tone={statusTone[status]} />
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="num text-muted">{dueText(due)}</span>
        <div className="flex items-center gap-1">
          {onRemove && (
            <button onClick={onRemove} aria-label={`Remove ${item.name}`} className="cursor-pointer rounded-lg p-1 text-muted hover:text-bad">
              <Trash2 size={14} />
            </button>
          )}
          {onDone && (
            <button onClick={onDone} className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-semibold text-accent hover:bg-accent-soft">
              <Check size={14} /> Done
            </button>
          )}
        </div>
      </div>
      <div className="text-xs text-muted/80">{lastRecord ? `Last: ${formatDate(lastRecord.date)} at ${km(lastRecord.odometer)} km` : 'No service logged yet'}</div>
    </div>
  )
}
