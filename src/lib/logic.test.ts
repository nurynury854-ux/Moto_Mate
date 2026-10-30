import { describe, expect, it } from 'vitest'
import { fuelStats, monthlySpend } from './fuel'
import { serviceDue, WILD_WOLF_SCHEDULE } from './schedule'
import { bestWindow, gearTips, scoreHour, type HourWeather } from './rideScore'
import { rankCauses, SYMPTOMS } from './diagnose'
import { buildDemoData } from './demoData'
import { addMonths } from './date'
import type { Bike } from './types'

const hour = (o: Partial<HourWeather> = {}): HourWeather => ({
  time: '2026-10-30T10:00', temp: 24, feelsLike: 24, rainProb: 0, precip: 0,
  gusts: 10, uv: 3, code: 0, isDay: true, aqi: 30, ...o,
})

describe('fuel', () => {
  it('uses the full-tank method', () => {
    const s = fuelStats([
      { id: 'b', date: '2026-10-05', odometer: 200, liters: 5, pricePerLiter: 30 },
      { id: 'a', date: '2026-10-01', odometer: 0, liters: 8, pricePerLiter: 30 },
    ])
    expect(s.avgKmPerLiter).toBe(40)
    expect(s.costPerKm).toBe(0.75)
    expect(s.totalCost).toBe(390)
  })
  it('groups spend by month', () => {
    const m = monthlySpend([
      { id: 'a', date: '2026-09-30', odometer: 0, liters: 2, pricePerLiter: 30 },
      { id: 'b', date: '2026-10-01', odometer: 10, liters: 1, pricePerLiter: 30 },
    ])
    expect(m.map((x) => x.month)).toEqual(['2026-09', '2026-10'])
  })
})

describe('service schedule', () => {
  const bike: Bike = { model: '', nickname: '', plate: '', year: 2026, purchaseDate: '2026-10-01', startOdometer: 0, odometer: 950 }
  const oil = WILD_WOLF_SCHEDULE.find((i) => i.id === 'oil')!
  it('uses the break-in interval for the first oil change', () => {
    const d = serviceDue(oil, [], bike, '2026-10-10')
    expect(d.dueKm).toBe(1000)
    expect(d.status).toBe('soon')
  })
  it('uses the regular interval after a service', () => {
    const d = serviceDue(oil, [{ id: 'r', itemId: 'oil', date: '2026-10-09', odometer: 1000, cost: 0, notes: '' }], { ...bike, odometer: 4200 }, '2026-10-10')
    expect(d.dueKm).toBe(4000)
    expect(d.status).toBe('overdue')
  })
  it('handles month overflow', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
  })
})

describe('ride score', () => {
  it('scores perfect weather 100', () => {
    expect(scoreHour(hour()).score).toBe(100)
  })
  it('punishes thunderstorms heavily', () => {
    const s = scoreHour(hour({ code: 95, rainProb: 90, precip: 3 }))
    expect(s.score).toBeLessThan(40)
    expect(s.tone).toBe('bad')
  })
  it('finds the best window and suggests rain gear', () => {
    const hours = [hour({ rainProb: 90 }), hour(), hour(), hour({ rainProb: 80, precip: 2 })]
    expect(bestWindow(hours)?.start).toBe(1)
    expect(gearTips(hours).some((t) => t.id === 'rain')).toBe(true)
  })
})

describe('diagnose', () => {
  it('ranks battery first for a click-only no-start', () => {
    const s = SYMPTOMS.find((x) => x.id === 'no-start')!
    expect(rankCauses(s, [0, 0, 0])[0].id).toBe('battery')
  })
  it('confidences sum to ~100', () => {
    for (const s of SYMPTOMS) {
      const total = rankCauses(s, s.questions.map(() => 0)).reduce((a, c) => a + c.confidence, 0)
      expect(Math.abs(total - 100)).toBeLessThanOrEqual(s.questions.length + Object.keys(s.causes).length)
    }
  })
})

describe('demo data', () => {
  it('is consistent', () => {
    const d = buildDemoData('2026-10-30')
    expect(d.fuel.length).toBeGreaterThan(10)
    expect(d.bike.odometer).toBeGreaterThan(d.fuel[d.fuel.length - 1].odometer)
    const avg = fuelStats(d.fuel).avgKmPerLiter
    expect(avg).toBeGreaterThan(35)
    expect(avg).toBeLessThan(47)
  })
})
