import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from './components/Layout'
import { useStore } from './lib/store'
import Dashboard from './pages/Dashboard'
import Garage from './pages/Garage'
import Ride from './pages/Ride'
import Diagnose from './pages/Diagnose'
import SettingsPage from './pages/Settings'

// Recharts is the heaviest dependency, so the charts page loads on demand.
const FuelPage = lazy(() => import('./pages/Fuel'))

/** `?demo` in any URL loads the sample data — handy for judges and screenshots. */
function DemoLoader() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { loadDemo } = useStore()
  useEffect(() => {
    if (params.has('demo')) {
      loadDemo()
      navigate({ search: '' }, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function App() {
  return (
    <>
      <DemoLoader />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="garage" element={<Garage />} />
          <Route
            path="fuel"
            element={
              <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
                <FuelPage />
              </Suspense>
            }
          />
          <Route path="ride" element={<Ride />} />
          <Route path="diagnose" element={<Diagnose />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </>
  )
}
