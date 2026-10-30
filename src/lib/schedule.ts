import type { Bike, ServiceItem, ServiceRecord } from './types'
import { addMonths, daysBetween } from './date'

/**
 * Approximate service schedule for a SYM Wild Wolf 150 (air-cooled, chain drive, manual gearbox).
 * Intervals are typical values for small commuter motorcycles — always check the owner's manual.
 */
export const WILD_WOLF_SCHEDULE: ServiceItem[] = [
  { id: 'oil', name: 'Engine oil', description: 'Drain and refill engine oil (≈1.0 L, 10W-40). First change after break-in.', firstKm: 1000, intervalKm: 3000, intervalMonths: 6 },
  { id: 'chain', name: 'Chain lube & adjust', description: 'Clean, lube and set slack to 20–30 mm.', intervalKm: 500, intervalMonths: 1 },
  { id: 'air', name: 'Air filter', description: 'Clean or replace — more often in dusty city traffic.', intervalKm: 6000, intervalMonths: 12 },
  { id: 'plug', name: 'Spark plug', description: 'Inspect gap, replace if worn or fouled.', intervalKm: 8000, intervalMonths: 12 },
  { id: 'pads', name: 'Brake pads', description: 'Check pad thickness front and rear; replace under 2 mm.', intervalKm: 3000, intervalMonths: 6 },
  { id: 'fluid', name: 'Brake fluid', description: 'Flush and replace DOT 4 brake fluid.', intervalMonths: 24 },
  { id: 'tires', name: 'Tires', description: 'Check tread depth, cracks and pressure (front 29 / rear 33 psi).', intervalKm: 5000, intervalMonths: 6 },
  { id: 'battery', name: 'Battery', description: 'Test voltage (12.6 V+ resting) and clean terminals.', intervalMonths: 12 },
]

export type ServiceStatus = 'ok' | 'soon' | 'overdue'

export interface ServiceDue {
  item: ServiceItem
  lastRecord?: ServiceRecord
  /** 0 → just serviced, 1 → due now, >1 → overdue. */
  progress: number
  status: ServiceStatus
  kmLeft?: number
  dueKm?: number
  daysLeft?: number
  dueDate?: string
}

export function lastRecordFor(itemId: string, records: ServiceRecord[]): ServiceRecord | undefined {
  return records
    .filter((r) => r.itemId === itemId)
    .sort((a, b) => b.odometer - a.odometer || b.date.localeCompare(a.date))[0]
}

export function serviceDue(item: ServiceItem, records: ServiceRecord[], bike: Bike, today: string): ServiceDue {
  const last = lastRecordFor(item.id, records)
  const baseKm = last ? last.odometer : bike.startOdometer
  const baseDate = last ? last.date : bike.purchaseDate
  const intervalKm = !last && item.firstKm ? item.firstKm : item.intervalKm

  let progress = 0
  const due: ServiceDue = { item, lastRecord: last, progress, status: 'ok' }

  if (intervalKm) {
    due.dueKm = baseKm + intervalKm
    due.kmLeft = due.dueKm - bike.odometer
    progress = Math.max(progress, (bike.odometer - baseKm) / intervalKm)
  }
  if (item.intervalMonths) {
    due.dueDate = addMonths(baseDate, item.intervalMonths)
    due.daysLeft = daysBetween(today, due.dueDate)
    const total = daysBetween(baseDate, due.dueDate)
    progress = Math.max(progress, daysBetween(baseDate, today) / total)
  }

  due.progress = Math.max(0, progress)
  due.status = due.progress >= 1 ? 'overdue' : due.progress >= 0.8 ? 'soon' : 'ok'
  return due
}

export function allServiceDue(items: ServiceItem[], records: ServiceRecord[], bike: Bike, today: string): ServiceDue[] {
  return items.map((i) => serviceDue(i, records, bike, today)).sort((a, b) => b.progress - a.progress)
}
