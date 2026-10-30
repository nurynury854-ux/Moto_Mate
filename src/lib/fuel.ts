import type { FuelEntry } from './types'

export interface FuelSegment {
  entry: FuelEntry
  km: number
  kmPerLiter: number
  cost: number
}

export interface FuelStats {
  segments: FuelSegment[]
  totalKm: number
  totalLiters: number
  totalCost: number
  avgKmPerLiter: number
  costPerKm: number
}

export const fillCost = (e: FuelEntry) => e.liters * e.pricePerLiter

export function sortByOdometer(entries: FuelEntry[]): FuelEntry[] {
  return [...entries].sort((a, b) => a.odometer - b.odometer)
}

/**
 * Full-tank method: the fuel added at fill-up N was burned over the distance
 * since fill-up N-1, so the first entry only sets the starting point.
 */
export function fuelStats(entries: FuelEntry[]): FuelStats {
  const sorted = sortByOdometer(entries)
  const segments: FuelSegment[] = []
  for (let i = 1; i < sorted.length; i++) {
    const km = sorted[i].odometer - sorted[i - 1].odometer
    if (km <= 0 || sorted[i].liters <= 0) continue
    segments.push({ entry: sorted[i], km, kmPerLiter: km / sorted[i].liters, cost: fillCost(sorted[i]) })
  }
  const totalKm = segments.reduce((s, x) => s + x.km, 0)
  const totalLiters = segments.reduce((s, x) => s + x.entry.liters, 0)
  const segCost = segments.reduce((s, x) => s + x.cost, 0)
  return {
    segments,
    totalKm,
    totalLiters,
    totalCost: sorted.reduce((s, e) => s + fillCost(e), 0),
    avgKmPerLiter: totalLiters ? totalKm / totalLiters : 0,
    costPerKm: totalKm ? segCost / totalKm : 0,
  }
}

export function monthlySpend(entries: FuelEntry[]): { month: string; spend: number; liters: number }[] {
  const map = new Map<string, { spend: number; liters: number }>()
  for (const e of entries) {
    const key = e.date.slice(0, 7)
    const cur = map.get(key) ?? { spend: 0, liters: 0 }
    cur.spend += fillCost(e)
    cur.liters += e.liters
    map.set(key, cur)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }))
}
