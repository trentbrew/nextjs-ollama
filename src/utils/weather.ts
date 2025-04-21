export interface WeatherData {
  location: string;
  latitude: number;
  longitude: number;
  temperature: number;
  windspeed: number;
  winddirection: number;
  weathercode: number;
  conditions: string;
  time: string;
  unit: 'celsius' | 'fahrenheit';
}

interface CacheEntry {
  data: WeatherData;
  expiry: number;
}

// Simple in-memory cache (TTL in milliseconds)
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchWeather(
  location: string,
  unit: 'celsius' | 'fahrenheit' = 'celsius',
): Promise<WeatherData> {
  const key = `${location}-${unit}`;
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiry > now) {
    return entry.data;
  }

  // Geocode the location using Open-Meteo geocoding API
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      location,
    )}&count=1`,
  );
  if (!geoRes.ok) {
    throw new Error(`Geocoding API error: ${geoRes.status}`);
  }
  const geoData = await geoRes.json();
  const place = geoData.results?.[0];
  if (!place) {
    throw new Error(`Location not found: ${location}`);
  }
  const { latitude, longitude } = place;

  // Fetch current weather from Open-Meteo forecast API
  const forecastRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${
      unit === 'fahrenheit' ? 'fahrenheit' : 'celsius'
    }`,
  );
  if (!forecastRes.ok) {
    throw new Error(`Forecast API error: ${forecastRes.status}`);
  }
  const forecastData = await forecastRes.json();
  const current = forecastData.current_weather;

  // Map weather code to human-readable description
  const codeMapping: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    // add more codes as needed
  };
  const conditions = codeMapping[current.weathercode] || 'Unknown';

  const result: WeatherData = {
    location,
    latitude,
    longitude,
    temperature: current.temperature,
    windspeed: current.windspeed,
    winddirection: current.winddirection,
    weathercode: current.weathercode,
    conditions,
    time: current.time,
    unit,
  };

  // Cache the result
  cache.set(key, { data: result, expiry: now + CACHE_TTL });

  return result;
}

export function clearWeatherCache(): void {
  cache.clear();
}
