import type { Bike, Reminder } from './types'
import { addMonths, parseISODate, toISODate } from './date'

/** Default Taiwan paperwork reminders for a 126–250 cc motorcycle. */
export function defaultReminders(bike: Bike, today: string): Reminder[] {
  const now = parseISODate(today)
  const fuelFeeYear = now.getMonth() >= 7 ? now.getFullYear() + 1 : now.getFullYear()
  return [
    {
      id: 'insurance',
      title: 'Compulsory insurance (強制險)',
      dueDate: addMonths(bike.purchaseDate, 24),
      note: 'Renew at a post office, convenience store or insurer. Riding uninsured risks a fine of NT$1,500–3,000.',
    },
    {
      id: 'fuel-fee',
      title: 'Annual fuel fee (燃料費)',
      dueDate: toISODate(new Date(fuelFeeYear, 6, 31)),
      note: 'About NT$450 per year for 126–250 cc motorcycles. The bill arrives in July. (Plate tax is exempt for ≤150 cc.)',
    },
    {
      id: 'emission',
      title: 'Emission inspection (排氣定檢)',
      dueDate: addMonths(bike.purchaseDate, 60),
      note: 'Required every year once the bike is 5 years old, within a month of its original registration month.',
    },
  ]
}
