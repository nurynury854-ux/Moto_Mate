import type { Bike, FuelEntry, ServiceRecord } from './types'
import { addMonths, parseISODate, toISODate } from './date'

/** Deterministic pseudo-random so the demo looks the same every time. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

export interface DemoData {
  bike: Bike
  fuel: FuelEntry[]
  services: ServiceRecord[]
}

export function buildDemoData(today: string): DemoData {
  const rand = rng(150)
  const purchaseDate = addMonths(today, -4)
  const start = parseISODate(purchaseDate)
  const end = parseISODate(today)

  const fuel: FuelEntry[] = []
  let odo = 12
  let day = new Date(start)
  let i = 0
  fuel.push({ id: `f${i++}`, date: toISODate(day), odometer: odo, liters: 9.5, pricePerLiter: 30.4 })
  for (;;) {
    day = new Date(day.getTime() + (4 + Math.floor(rand() * 4)) * 86_400_000)
    if (day >= end) break
    const km = 150 + Math.round(rand() * 90)
    const kmPerL = 37 + rand() * 9
    odo += km
    const price = Math.round((29.6 + rand() * 1.6) * 10) / 10
    fuel.push({ id: `f${i++}`, date: toISODate(day), odometer: odo, liters: Math.round((km / kmPerL) * 100) / 100, pricePerLiter: price })
  }
  const currentOdo = odo + 64

  const at = (km: number) => {
    const f = fuel.find((x) => x.odometer >= km) ?? fuel[fuel.length - 1]
    return { date: f.date, odometer: f.odometer }
  }
  const breakIn = at(800)
  const services: ServiceRecord[] = [
    { id: 's1', itemId: 'oil', ...breakIn, cost: 350, notes: 'Break-in oil change at the SYM dealer (free labor).' },
    { id: 's2', itemId: 'chain', ...at(600), cost: 0, notes: 'Lubed with Motul chain lube.' },
    { id: 's3', itemId: 'chain', ...at(1200), cost: 0, notes: 'Lube + slack adjusted to 25 mm.' },
    { id: 's4', itemId: 'tires', ...at(1500), cost: 0, notes: 'Pressure topped up at the gas station.' },
    { id: 's5', itemId: 'chain', ...at(Math.max(1800, currentOdo - 700)), cost: 0, notes: 'Cleaned after a rainy week.' },
    { id: 's6', itemId: 'oil', ...at(Math.max(breakIn.odometer + 300, currentOdo - 2750)), cost: 380, notes: 'Motul 3000 10W-40.' },
  ]

  return {
    bike: {
      model: 'SYM Wild Wolf 150',
      nickname: 'Little Wolf',
      plate: 'MKT-1503',
      year: start.getFullYear(),
      purchaseDate,
      startOdometer: 0,
      odometer: currentOdo,
    },
    fuel,
    services,
  }
}
