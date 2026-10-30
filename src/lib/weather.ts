import type { Place } from './types'
import type { HourWeather } from './rideScore'

export const TAIWAN_CITIES: Place[] = [
  { name: 'Taipei', lat: 25.033, lon: 121.565 },
  { name: 'New Taipei', lat: 25.012, lon: 121.465 },
  { name: 'Keelung', lat: 25.128, lon: 121.739 },
  { name: 'Taoyuan', lat: 24.993, lon: 121.301 },
  { name: 'Hsinchu', lat: 24.804, lon: 120.971 },
  { name: 'Taichung', lat: 24.148, lon: 120.674 },
  { name: 'Tainan', lat: 22.999, lon: 120.227 },
  { name: 'Kaohsiung', lat: 22.627, lon: 120.301 },
  { name: 'Yilan', lat: 24.757, lon: 121.753 },
  { name: 'Hualien', lat: 23.991, lon: 121.611 },
  { name: 'Taitung', lat: 22.756, lon: 121.144 },
  { name: 'Kenting', lat: 21.946, lon: 120.797 },
]

export interface Forecast {
  current: { temp: number; feelsLike: number; code: number; wind: number; humidity: number; aqi?: number; pm25?: number }
  hours: HourWeather[] // from the current hour onward
}

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

export async function fetchForecast(place: Place, signal?: AbortSignal): Promise<Forecast> {
  const common = `latitude=${place.lat}&longitude=${place.lon}&timezone=Asia%2FTaipei&forecast_days=2`
  const weatherReq = fetch(
    `${FORECAST_URL}?${common}` +
      '&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_gusts_10m,uv_index,is_day' +
      '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m',
    { signal },
  )
  // Air quality is a nice-to-have; the page still works if it fails.
  const airReq = fetch(`${AIR_URL}?${common}&hourly=pm2_5,us_aqi&current=pm2_5,us_aqi`, { signal })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)

  const res = await weatherReq
  if (!res.ok) throw new Error(`Weather service error (${res.status})`)
  const w = await res.json()
  const air = await airReq

  const airByTime = new Map<string, { aqi?: number; pm25?: number }>()
  if (air?.hourly?.time) {
    air.hourly.time.forEach((t: string, i: number) =>
      airByTime.set(t, { aqi: air.hourly.us_aqi?.[i] ?? undefined, pm25: air.hourly.pm2_5?.[i] ?? undefined }),
    )
  }

  const h = w.hourly
  const all: HourWeather[] = h.time.map((time: string, i: number) => ({
    time,
    temp: h.temperature_2m[i],
    feelsLike: h.apparent_temperature[i],
    rainProb: h.precipitation_probability[i] ?? 0,
    precip: h.precipitation[i] ?? 0,
    gusts: h.wind_gusts_10m[i] ?? 0,
    uv: h.uv_index[i] ?? 0,
    code: h.weather_code[i],
    isDay: h.is_day[i] === 1,
    ...airByTime.get(time),
  }))

  const currentHour = (w.current.time as string).slice(0, 13)
  const startIdx = Math.max(0, all.findIndex((x) => x.time.slice(0, 13) === currentHour))

  return {
    current: {
      temp: w.current.temperature_2m,
      feelsLike: w.current.apparent_temperature,
      code: w.current.weather_code,
      wind: w.current.wind_speed_10m,
      humidity: w.current.relative_humidity_2m,
      aqi: air?.current?.us_aqi ?? undefined,
      pm25: air?.current?.pm2_5 ?? undefined,
    },
    hours: all.slice(startIdx, startIdx + 24),
  }
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky'
  if (code <= 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code <= 48) return 'Fog'
  if (code <= 57) return 'Drizzle'
  if (code <= 67) return 'Rain'
  if (code <= 77) return 'Snow'
  if (code <= 82) return 'Rain showers'
  if (code <= 86) return 'Snow showers'
  return 'Thunderstorm'
}

export function nearestCity(lat: number, lon: number): Place {
  let best = TAIWAN_CITIES[0]
  let bestD = Infinity
  for (const c of TAIWAN_CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  return best
}
