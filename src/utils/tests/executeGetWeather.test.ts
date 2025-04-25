/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeGetWeather } from '../tools';

// Mock global fetch
vi.stubGlobal('fetch', vi.fn());

interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<any>;
  text: () => Promise<string>;
}

function createResponse(
  data: any,
  ok = true,
  status = 200,
  statusText = 'OK',
): FetchResponse {
  return {
    ok,
    status,
    statusText,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe('executeGetWeather', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns weather data on successful geocode and forecast', async () => {
    const location = 'Paris, France';
    const simple = 'Paris';
    const geoData = { results: [{ latitude: 48.8566, longitude: 2.3522 }] };
    const forecastData = {
      current_weather: { temperature: 20, weathercode: 0 },
    };

    (fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createResponse(geoData))
      .mockResolvedValueOnce(createResponse(forecastData));

    const result = await executeGetWeather({ location, unit: 'fahrenheit' });

    // Verify URLs
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0],
    ).toContain(
      `geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        simple,
      )}`,
    );
    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1][0],
    ).toContain('temperature_unit=fahrenheit');

    expect(result).toEqual({
      location,
      temperature: 20,
      unit: 'fahrenheit',
      conditions: 'Clear sky',
    });
  });

  it('uses celsius unit when provided', async () => {
    const location = 'London';
    const geoData = { results: [{ latitude: 51.5074, longitude: -0.1278 }] };
    const forecastData = {
      current_weather: { temperature: 15, weathercode: 1 },
    };

    (fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createResponse(geoData))
      .mockResolvedValueOnce(createResponse(forecastData));

    const result = await executeGetWeather({ location, unit: 'celsius' });

    expect(
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1][0],
    ).toContain('temperature_unit=celsius');
    expect(result.unit).toBe('celsius');
    expect(result.conditions).toBe('Mainly clear');
  });

  it('maps unknown weather codes to Unknown', async () => {
    const location = 'Nowhere';
    const geoData = { results: [{ latitude: 0, longitude: 0 }] };
    const forecastData = {
      current_weather: { temperature: 0, weathercode: 999 },
    };

    (fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createResponse(geoData))
      .mockResolvedValueOnce(createResponse(forecastData));

    const result = await executeGetWeather({ location, unit: 'fahrenheit' });
    expect(result.conditions).toBe('Unknown');
  });

  it('throws on geocode API non-OK', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      createResponse({}, false, 500, 'Error'),
    );
    await expect(
      executeGetWeather({ location: 'X', unit: 'fahrenheit' }),
    ).rejects.toThrow(/Geocoding API error/);
  });

  it('throws if geocode results empty', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      createResponse({ results: [] }),
    );
    await expect(
      executeGetWeather({ location: 'Unknown', unit: 'fahrenheit' }),
    ).rejects.toThrow(/Location not found/);
  });

  it('throws on forecast API non-OK', async () => {
    const geoData = { results: [{ latitude: 1, longitude: 1 }] };
    (fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createResponse(geoData))
      .mockResolvedValueOnce(createResponse({}, false, 502, 'Bad Gateway'));

    await expect(
      executeGetWeather({ location: 'City', unit: 'fahrenheit' }),
    ).rejects.toThrow(/Forecast API error/);
  });

  it('throws if current_weather missing', async () => {
    const geoData = { results: [{ latitude: 2, longitude: 2 }] };
    (fetch as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(createResponse(geoData))
      .mockResolvedValueOnce(createResponse({}));

    await expect(
      executeGetWeather({ location: 'City', unit: 'fahrenheit' }),
    ).rejects.toThrow(/No current weather data/);
  });

  it('bubbles up network errors', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network Down'),
    );
    await expect(
      executeGetWeather({ location: 'Anywhere', unit: 'fahrenheit' }),
    ).rejects.toThrow('Network Down');
  });
});
