import { useCallback, useEffect, useState } from 'react'
import { fetchForecast, type Forecast } from '../lib/weather'
import type { Place } from '../lib/types'

export function useForecast(place: Place) {
  const [data, setData] = useState<Forecast | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setLoading(true)
    setError(null)
    fetchForecast(place, ctrl.signal)
      .then(setData)
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message || 'Could not load weather')
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false)
      })
    return () => ctrl.abort()
  }, [place.lat, place.lon, nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => setNonce((n) => n + 1), [])
  return { data, error, loading, refresh }
}
