import { createContext, useContext, type ReactNode } from 'react'
import { usePersistentState } from '../hooks/usePersistentState'
import type { Bike, FuelEntry, Place, Reminder, ServiceItem, ServiceRecord } from './types'
import { WILD_WOLF_SCHEDULE } from './schedule'
import { defaultReminders } from './reminders'
import { buildDemoData } from './demoData'
import { todayISO } from './date'
import { TAIWAN_CITIES } from './weather'

const defaultBike = (): Bike => ({
  model: 'SYM Wild Wolf 150',
  nickname: 'My Wolf',
  plate: '',
  year: new Date().getFullYear(),
  purchaseDate: todayISO(),
  startOdometer: 0,
  odometer: 0,
})

function useStoreState() {
  const [bike, setBike] = usePersistentState<Bike>('bike', defaultBike)
  const [items, setItems] = usePersistentState<ServiceItem[]>('items', WILD_WOLF_SCHEDULE)
  const [services, setServices] = usePersistentState<ServiceRecord[]>('services', [])
  const [fuel, setFuel] = usePersistentState<FuelEntry[]>('fuel', [])
  const [reminders, setReminders] = usePersistentState<Reminder[]>('reminders', () => defaultReminders(defaultBike(), todayISO()))
  const [place, setPlace] = usePersistentState<Place>('place', TAIWAN_CITIES[0])

  /** Raise the odometer if a new log entry has a higher reading. */
  const bumpOdometer = (km: number) => setBike((b) => (km > b.odometer ? { ...b, odometer: km } : b))

  const loadDemo = () => {
    const demo = buildDemoData(todayISO())
    setBike(demo.bike)
    setItems(WILD_WOLF_SCHEDULE)
    setServices(demo.services)
    setFuel(demo.fuel)
    setReminders(defaultReminders(demo.bike, todayISO()))
  }

  const resetAll = () => {
    const b = defaultBike()
    setBike(b)
    setItems(WILD_WOLF_SCHEDULE)
    setServices([])
    setFuel([])
    setReminders(defaultReminders(b, todayISO()))
  }

  return {
    bike, setBike, items, setItems, services, setServices, fuel, setFuel,
    reminders, setReminders, place, setPlace, bumpOdometer, loadDemo, resetAll,
  }
}

type Store = ReturnType<typeof useStoreState>
const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  return <StoreContext.Provider value={useStoreState()}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
