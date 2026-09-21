import { z } from 'zod'
import { fetchJson, type FetchOptions } from '../fetchers'

export interface City {
  name: string
  latitude: number
  longitude: number
}

/** Default location for weather demos (snapshots are captured for this city). */
const DEFAULT_CITY: City = { name: 'London', latitude: 51.51, longitude: -0.13 }

const forecastResponse = z.object({
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    apparent_temperature: z.number(),
    wind_speed_10m: z.number(),
    surface_pressure: z.number(),
    cloud_cover: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number().nullable()),
  }),
})

export const weatherNowSchema = z.object({
  city: z.string(),
  timezone: z.string(),
  time: z.string(),
  temperature: z.number(),
  humidity: z.number(),
  apparentTemperature: z.number(),
  windSpeed: z.number(),
  pressure: z.number(),
  cloudCover: z.number(),
  hourly: z.array(z.object({ time: z.string(), temperature: z.number() })),
})
export type WeatherNow = z.infer<typeof weatherNowSchema>

export async function fetchWeatherNow(
  city: City = DEFAULT_CITY,
  options?: FetchOptions,
): Promise<WeatherNow> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,surface_pressure,cloud_cover',
    hourly: 'temperature_2m',
    forecast_days: '2',
    timezone: 'auto',
  })
  const res = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    forecastResponse,
    options,
  )
  return {
    city: city.name,
    timezone: res.timezone,
    time: res.current.time,
    temperature: res.current.temperature_2m,
    humidity: res.current.relative_humidity_2m,
    apparentTemperature: res.current.apparent_temperature,
    windSpeed: res.current.wind_speed_10m,
    pressure: res.current.surface_pressure,
    cloudCover: res.current.cloud_cover,
    hourly: res.hourly.time
      .map((time, i) => ({ time, temperature: res.hourly.temperature_2m[i] }))
      .filter(
        (d): d is { time: string; temperature: number } =>
          d.temperature != null,
      )
      .slice(0, 36),
  }
}

const archiveResponse = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
  }),
})

export const temperatureYearSchema = z.object({
  city: z.string(),
  year: z.number().int(),
  days: z.array(
    z.object({ date: z.string(), max: z.number(), min: z.number() }),
  ),
})
export type TemperatureYear = z.infer<typeof temperatureYearSchema>

/** The most recent complete calendar year (the archive lags a few days). */
function lastFullYear(now = new Date()): number {
  return now.getUTCFullYear() - 1
}

export async function fetchTemperatureYear(
  year = lastFullYear(),
  city: City = DEFAULT_CITY,
  options?: FetchOptions,
): Promise<TemperatureYear> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    start_date: `${year}-01-01`,
    end_date: `${year}-12-31`,
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
  })
  const res = await fetchJson(
    `https://archive-api.open-meteo.com/v1/archive?${params}`,
    archiveResponse,
    options,
  )
  const { time, temperature_2m_max: max, temperature_2m_min: min } = res.daily
  return {
    city: city.name,
    year,
    days: time.flatMap((date, i) => {
      const hi = max[i]
      const lo = min[i]
      return hi == null || lo == null ? [] : [{ date, max: hi, min: lo }]
    }),
  }
}
