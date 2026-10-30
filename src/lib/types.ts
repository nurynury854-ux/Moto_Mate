export interface Bike {
  model: string
  nickname: string
  plate: string
  year: number
  purchaseDate: string // YYYY-MM-DD
  startOdometer: number // odometer reading when the bike was added
  odometer: number
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  intervalKm?: number
  intervalMonths?: number
  /** Interval for the very first service (e.g. break-in oil change). */
  firstKm?: number
  custom?: boolean
}

export interface ServiceRecord {
  id: string
  itemId: string
  date: string
  odometer: number
  cost: number
  notes: string
}

export interface FuelEntry {
  id: string
  date: string
  odometer: number
  liters: number
  pricePerLiter: number
}

export interface Reminder {
  id: string
  title: string
  dueDate: string
  note: string
}

export interface Place {
  name: string
  lat: number
  lon: number
}
