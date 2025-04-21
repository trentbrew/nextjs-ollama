import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeather, clearWeatherCache, WeatherData } from '@/utils/weather';

// Mock data
const mockGeoData = {
  results: [
    {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  ],
};

const mockForecastDataCelsius = {
  current_weather: {
    temperature: 15.0,
    windspeed: 10.0,
    winddirection: 270,
    weathercode: 2,
    time: '2024-07-27T12:00',
  },
};

const mockForecastDataFahrenheit = {
  current_weather: {
    temperature: 59.0,
    windspeed: 6.2, // Assuming conversion for example
    winddirection: 270,
    weathercode: 2,
    time: '2024-07-27T12:00',
  },
};

// Helper to create mock fetch responses
const createMockResponse = (data: any, ok = true, status = 200) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);
};

describe('Weather Utils', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearWeatherCache();
    // Reset mocks before each test
    vi.resetAllMocks();
    // Use fake timers for cache testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
  });

  it('should fetch weather data successfully (Celsius)', async () => {
    const mockFetch = vi.spyOn(global, 'fetch');
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGeoData),
      } as Response) // Geocoding
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockForecastDataCelsius),
      } as Response); // Forecast

    const location = 'San Francisco';
    const data = await fetchWeather(location, 'celsius');

    expect(data).toEqual<WeatherData>({
      location,
      latitude: 37.7749,
      longitude: -122.4194,
      temperature: 15.0,
      windspeed: 10.0,
      winddirection: 270,
      weathercode: 2,
      conditions: 'Partly cloudy', // Based on codeMapping
      time: '2024-07-27T12:00',
      unit: 'celsius',
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        location,
      )}&count=1`,
    );
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current_weather=true&temperature_unit=celsius`,
    );
  });

  it('should fetch weather data successfully (Fahrenheit)', async () => {
    const mockFetch = vi.spyOn(global, 'fetch');
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGeoData),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockForecastDataFahrenheit),
      } as Response);

    const location = 'San Francisco';
    const data = await fetchWeather(location, 'fahrenheit');

    expect(data.unit).toBe('fahrenheit');
    expect(data.temperature).toBe(59.0);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current_weather=true&temperature_unit=fahrenheit`,
    );
  });

  it('should throw error if geocoding API fails', async () => {
    const mockFetch = vi.spyOn(global, 'fetch');
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    } as Response); // Geocoding fails

    const location = 'Invalid Location';
    await expect(fetchWeather(location)).rejects.toThrow(
      'Geocoding API error: 500',
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should throw error if location not found', async () => {
    const mockFetch = vi.spyOn(global, 'fetch');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ results: [] }),
    } as Response); // Geocoding returns no results

    const location = 'Unknown Place';
    await expect(fetchWeather(location)).rejects.toThrow(
      `Location not found: ${location}`,
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should throw error if forecast API fails', async () => {
    const mockFetch = vi.spyOn(global, 'fetch');
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGeoData),
      } as Response) // Geocoding succeeds
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response); // Forecast fails

    const location = 'San Francisco';
    await expect(fetchWeather(location)).rejects.toThrow(
      'Forecast API error: 500',
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should use cache for subsequent calls within TTL', async () => {
    const mockFetch = vi.spyOn(global, 'fetch');
    mockFetch.mockImplementation((url: string | URL | Request) => {
      if (url.toString().includes('geocoding-api')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockGeoData),
        } as Response);
      }
      if (url.toString().includes('api.open-meteo.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockForecastDataCelsius),
        } as Response);
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    const location = 'Test Cache';
    // First call - should fetch
    await fetchWeather(location);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Second call - should hit cache
    vi.advanceTimersByTime(1000); // Advance time slightly, still within TTL
    await fetchWeather(location);
    expect(mockFetch).toHaveBeenCalledTimes(2); // No new fetch calls
  });

  it('should not use cache after TTL expires', async () => {
    const mockFetch = vi.spyOn(global, 'fetch');
    mockFetch.mockImplementation((url: string | URL | Request) => {
      if (url.toString().includes('geocoding-api')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockGeoData),
        } as Response);
      }
      if (url.toString().includes('api.open-meteo.com')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockForecastDataCelsius),
        } as Response);
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    const location = 'Test Cache TTL';

    // First call - should fetch
    await fetchWeather(location);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Advance time beyond TTL (5 minutes + 1 second)
    vi.advanceTimersByTime(5 * 60 * 1000 + 1000);

    // Second call - should fetch again
    await fetchWeather(location);
    expect(mockFetch).toHaveBeenCalledTimes(4); // Two new fetch calls
  });
});
