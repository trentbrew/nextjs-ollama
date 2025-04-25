/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeatherAgent, weatherAgentInputSchema } from '../agent';
import type { WeatherAgentInput, WeatherAgentOutput } from '../agent';
import * as tools from '@/utils/tools';

describe('WeatherAgent', () => {
  const spyExecuteGetWeather = vi.spyOn(tools, 'executeGetWeather');

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('executes the weather tool and returns its output', async () => {
    const input: WeatherAgentInput = { location: 'Paris, FR', unit: 'celsius' };
    const fakeOutput: WeatherAgentOutput = {
      location: 'Paris, FR',
      temperature: 25,
      unit: 'celsius',
      conditions: 'Clear sky',
    };
    spyExecuteGetWeather.mockResolvedValue(fakeOutput);

    // Validate input schema works
    const parsed = weatherAgentInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);

    const result = await WeatherAgent.execute(input);
    expect(spyExecuteGetWeather).toHaveBeenCalledWith(input);
    expect(result).toBe(fakeOutput);
  });

  it('propagates errors from the weather tool', async () => {
    const input: WeatherAgentInput = {
      location: 'Nowhere',
      unit: 'fahrenheit',
    };
    const error = new Error('weather API failed');
    spyExecuteGetWeather.mockRejectedValue(error);

    await expect(WeatherAgent.execute(input)).rejects.toThrow(
      'weather API failed',
    );
  });

  it('fails validation on invalid input', () => {
    // Missing location
    const invalid = { unit: 'celsius' } as any;
    const parsed = weatherAgentInputSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
