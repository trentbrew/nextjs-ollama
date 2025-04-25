import { z } from 'zod';

// --- Return Type Schemas for Tools (optional but good practice) ---
export const SearchResultSchema = z.object({
  searchResult: z.string(),
  sources: z.array(z.string().url()).optional(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

export const WeatherResultSchema = z.object({
  location: z.string(),
  temperature: z.number(),
  unit: z.enum(['celsius', 'fahrenheit']),
  conditions: z.string(),
  // Add other relevant fields: windspeed, humidity, etc.
});
export type WeatherResult = z.infer<typeof WeatherResultSchema>;

// --- Tool Input Schemas (can also be defined here or within agents) ---
export const SearchInputSchema = z.object({ query: z.string() });
export type SearchInput = z.infer<typeof SearchInputSchema>;

export const WeatherInputSchema = z
  .object({
    location: z.string().optional(),
    unit: z.enum(['celsius', 'fahrenheit']).optional().default('fahrenheit'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .refine(
    (data) => !!data.location || (data.latitude && data.longitude),
    'Either location or both latitude and longitude must be provided.',
  );
export type WeatherInput = z.infer<typeof WeatherInputSchema>;

// --- Tool Implementations ---

/**
 * Executes a web search using the Perplexity API.
 */
export async function executeSearchWeb(
  input: SearchInput,
): Promise<SearchResult> {
  console.log(`[Tool] executeSearchWeb called with query: ${input.query}`);
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error('❌ [Tool] Perplexity API key not found.');
    throw new Error('Missing PERPLEXITY_API_KEY environment variable.');
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'sonar', // Use the model confirmed to work
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that provides concise search results based on the user query.',
          },
          { role: 'user', content: input.query },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `❌ [Tool] Perplexity API Error: ${response.status} ${response.statusText}`,
        errorBody,
      );
      throw new Error(
        `Perplexity API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    const citations = data.citations;

    if (!rawContent) {
      console.warn('⚠️ [Tool] No content found in Perplexity response.');
      return { searchResult: 'No meaningful result found.', sources: [] };
    }

    const cleanedContent = rawContent.replace(/\n{3,}/g, '\n\n');
    console.log('✅ [Tool] executeSearchWeb successful.');
    return {
      searchResult: cleanedContent,
      sources: citations || [],
    };
  } catch (error) {
    // Log the detailed error object
    console.error('❌ [Tool] Error during Perplexity API call:', error);
    // Re-throw a potentially more informative error if possible
    if (error instanceof Error) {
      throw new Error(`Perplexity fetch failed: ${error.message}`);
    } else {
      // Fallback for non-Error objects
      throw new Error('Perplexity fetch failed: Unknown error object');
    }
    // Original re-throw (less informative)
    // throw error; // Re-throw for the agent/handler to catch
  }
}

/**
 * Executes a weather lookup using the Open-Meteo API.
 */
export async function executeGetWeather(
  input: WeatherInput,
): Promise<WeatherResult> {
  let { location, unit = 'fahrenheit', latitude, longitude } = input;

  try {
    // Prioritize coordinates if provided
    if (latitude === undefined || longitude === undefined) {
      if (!location) {
        throw new Error('[Tool] Location name or coordinates required.');
      }
      // Sanitize location: remove trailing non-alphanumeric chars and trim
      location = location.replace(/[^a-zA-Z0-9\s,]+$/, '').trim();
      console.log(
        `[Tool] executeGetWeather called for sanitized: ${location} in ${unit}`,
      );
      // Geocode
      console.log('[Tool] Geocoding location...');
      const simpleLocation = location.split(',')[0].trim();
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        simpleLocation,
      )}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok)
        throw new Error(
          `[Tool] Geocoding API error: ${geoRes.status} ${geoRes.statusText}`,
        );
      const geoData = await geoRes.json();
      const place = geoData.results?.[0];
      if (!place) throw new Error(`[Tool] Location not found: ${location}`);
      latitude = place.latitude;
      longitude = place.longitude;
      location = place.name || location; // Use geocoded name if available
      console.log(`[Tool] Found coordinates: ${latitude}, ${longitude}`);
    } else {
      console.log(
        `[Tool] executeGetWeather called for coords: ${latitude}, ${longitude} in ${unit}`,
      );
      // If coords are provided, we don't have a location name yet
      // We could reverse-geocode here if needed, or pass coords directly
      location = `Coords: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`; // Placeholder name
    }

    // Fetch weather using coordinates
    console.log('[Tool] Fetching forecast...');
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${unit}`;
    const forecastRes = await fetch(forecastUrl);
    if (!forecastRes.ok)
      throw new Error(
        `[Tool] Forecast API error: ${forecastRes.status} ${forecastRes.statusText}`,
      );
    const forecastData = await forecastRes.json();
    const current = forecastData.current_weather;
    if (!current)
      throw new Error('[Tool] No current weather data in forecast response.');

    // Map code
    const codeMapping: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle' /* ... add more */,
    };
    const conditions = codeMapping[current.weathercode] || 'Unknown';

    console.log('✅ [Tool] executeGetWeather successful.');
    return {
      location: location || 'Unknown location', // Provide fallback
      temperature: current.temperature,
      unit,
      conditions,
    };
  } catch (error) {
    console.error('❌ [Tool] Error inside executeGetWeather:', error);
    throw error;
  }
}
