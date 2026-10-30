import { BatteryWarning, Check, CircleDashed, Disc3, Droplet, Droplets, Link, Trash2, Wind, Wrench, Zap, type LucideIcon } from 'lucide-react'
import type { ServiceDue, ServiceStatus } from '../lib/schedule'
import { formatDate } from '../lib/date'
import { Badge, cx, km, toneText, type Tone } from './ui'
import { SegmentBar, wearColor } from './gauges'

export const statusTone: Record<ServiceStatus, Tone> = { ok: 'good', soon: 'warn', overdue: 'bad' }
export const statusLabel: Record<ServiceStatus, string> = { ok: 'OK', soon: 'Due soon', overdue: 'Overdue' }

/** Warning-lamp icon for each preset service item; custom items get a wrench. */
const SERVICE_ICON: Record<string, LucideIcon> = {
  oil: Droplet,
  chain: Link,
  air: Wind,
  plug: Zap,
  pads: Disc3,
  fluid: Droplets,
  tires: CircleDashed,
  battery: BatteryWarning,
}
export const serviceIcon = (id: string): LucideIcon => SERVICE_ICON[id] ?? Wrench

export function dueText(d: ServiceDue): string {
  const parts: string[] = []
  if (d.kmLeft !== undefined) parts.push(d.kmLeft >= 0 ? `${km(d.kmLeft)} km left` : `${km(-d.kmLeft)} km over`)
  if (d.daysLeft !== undefined) parts.push(d.daysLeft >= 0 ? `${d.daysLeft} days left` : `${-d.daysLeft} days over`)
  return parts.join(' · ')
}

export function ServiceCard({ due, onDone, onRemove }: { due: ServiceDue; onDone?: () => void; onRemove?: () => void }) {
  const { item, lastRecord, status } = due
  const Icon = serviceIcon(item.id)
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-[#0c0e11] p-4 shadow-[inset_0_1px_0_#ffffff08]">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cx('rounded-lg border p-1.5', status === 'ok' ? 'border-line text-muted/60' : cx('border-current/40 bg-current/10', toneText[statusTone[status]]))}
          style={status !== 'ok' ? { filter: 'drop-shadow(0 0 6px currentColor)' } : undefined}
        >
          <Icon size={16} />
        </span>
        <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
      </div>
      <div>
        <div className="font-semibold leading-tight">{item.name}</div>
        <div className="mt-0.5 text-xs text-muted">
          Every {[item.intervalKm && `${km(item.intervalKm)} km`, item.intervalMonths && `${item.intervalMonths} mo`].filter(Boolean).join(' / ')}
          {item.firstKm && !lastRecord ? ` · first at ${km(item.firstKm)} km` : ''}
        </div>
      </div>
      <div>
        <SegmentBar value={due.progress} color={wearColor(status === 'overdue')} segments={20} />
        <div className="mt-1 flex justify-between font-display text-[10px] font-semibold tracking-widest text-muted/60">
          <span>SERVICED</span>
          <span>DUE</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="num text-muted">{dueText(due)}</span>
        <div className="flex items-center gap-1">
          {onRemove && (
            <button onClick={onRemove} aria-label={`Remove ${item.name}`} className="cursor-pointer rounded-lg p-1 text-muted hover:text-bad">
              <Trash2 size={14} />
            </button>
          )}
          {onDone && (
            <button onClick={onDone} className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 font-display text-sm font-bold uppercase tracking-wider text-accent hover:bg-accent-soft">
              <Check size={14} /> Done
            </button>
          )}
        </div>
      </div>
      <div className="text-xs text-muted/80">{lastRecord ? `Last: ${formatDate(lastRecord.date)} at ${km(lastRecord.odometer)} km` : 'No service logged yet'}</div>
    </div>
  )
}
