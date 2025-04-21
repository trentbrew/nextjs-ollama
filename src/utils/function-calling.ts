import { Message } from 'ai/react';
import { z } from 'zod';
import { tool } from 'ai';

// Define FunctionCall type since it may not be exported directly
export interface FunctionCall {
  name: string;
  arguments: string;
}

// Extend the Message type to include function call properties
export interface ExtendedMessage extends Message {
  function_call?: FunctionCall;
  function_call_result?: string;
  // Add fields for debug info
  responseTime?: number; // in milliseconds
  tokenCount?: number;
  modelName?: string;
  experimental_streamData?: ReadableStream<Uint8Array>;
}

// Define function definition type since it may not be exported directly
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Define Zod schemas for tool parameters for validation
const GetWeatherParameters = z.object({
  location: z
    .string()
    .describe('The city and state or country, e.g. "San Francisco, CA"'),
  unit: z
    .enum(['celsius', 'fahrenheit'])
    .optional()
    .default('fahrenheit')
    .describe('The unit of temperature'),
});

const SearchWebParameters = z.object({
  query: z.string().describe('The search query'),
});

// --- Tool Implementations ---

async function executeGetWeather({
  location,
  unit,
}: z.infer<typeof GetWeatherParameters>) {
  console.log(`🌤️ Getting weather for ${location} in ${unit}`);
  try {
    // Geocode the location
    console.log('🔄 Geocoding location...');
    // Simplify location query to just the primary name (e.g., city)
    const simpleLocation = location.split(',')[0].trim();
    console.log(
      `🔄 Using simplified location for geocoding: ${simpleLocation}`,
    );
    // Construct URL using only the simplified name and adding explicit defaults
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      simpleLocation,
    )}&count=1&language=en&format=json`;

    const geoRes = await fetch(geoUrl);
    console.log(`✅ Geocoding response status: ${geoRes.status}`);
    if (!geoRes.ok) {
      throw new Error(
        `Geocoding API error: ${geoRes.status} - ${geoRes.statusText}`,
      );
    }
    const geoData = await geoRes.json();
    console.log('✅ Geocoding data parsed.');

    // Log the raw geocoding data for debugging
    console.log('📍 Raw Geocoding Data:', JSON.stringify(geoData, null, 2));

    const place = geoData.results?.[0];
    if (!place) {
      throw new Error(`Location not found: ${location}`);
    }
    const { latitude, longitude } = place;
    console.log(`🌍 Found coordinates: ${latitude}, ${longitude}`);

    // Fetch current weather
    console.log('🔄 Fetching forecast...');
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=${
      unit === 'fahrenheit' ? 'fahrenheit' : 'celsius'
    }`;
    const forecastRes = await fetch(forecastUrl);
    console.log(`✅ Forecast response status: ${forecastRes.status}`);
    if (!forecastRes.ok) {
      throw new Error(
        `Forecast API error: ${forecastRes.status} - ${forecastRes.statusText}`,
      );
    }
    const forecastData = await forecastRes.json();
    console.log('✅ Forecast data parsed.');

    const current = forecastData.current_weather;
    if (!current) {
      throw new Error('No current weather data found in forecast response.');
    }

    // Map weather code
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
      // Add more codes as needed based on WMO Weather interpretation codes
      // https://open-meteo.com/en/docs#weathervariables
    };
    const conditions =
      codeMapping[current.weathercode] || 'Unknown weather code';

    const resultData = {
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
    console.log('🌤️ Weather data successfully prepared:', resultData);
    return resultData;
  } catch (error) {
    console.error('❌ Error inside executeGetWeather:', error);
    // Re-throw the error so the SDK knows the tool execution failed
    throw error;
  }
}

async function executeSearchWeb({
  query,
}: z.infer<typeof SearchWebParameters>) {
  console.log(`🔎 Searching for: ${query}`);

  // This would be replaced with an actual API call
  const searchResults = [
    {
      title: 'Example result 1',
      url: 'https://example.com/1',
      snippet: 'This is an example search result.',
    },
    {
      title: 'Example result 2',
      url: 'https://example.com/2',
      snippet: 'This is another example search result.',
    },
  ];

  console.log('🔎 Search results:', searchResults);
  return JSON.stringify(searchResults);
}

// --- Tool Definitions (using Vercel AI SDK `tool` helper) ---

export const availableTools = {
  getWeather: tool({
    description: 'Get the current weather for a location',
    parameters: GetWeatherParameters,
    execute: executeGetWeather,
  }),
  searchWeb: tool({
    description: 'Search the web for information',
    parameters: SearchWebParameters,
    execute: executeSearchWeb,
  }),
  // Add more tool definitions as needed
};

// Function handler type
export type FunctionCallHandler = (
  functionCall: FunctionCall,
  chatMessages: Message[],
) => Promise<string>;

// Function implementations
export const functionCallHandler: FunctionCallHandler = async (
  functionCall: FunctionCall,
  chatMessages: Message[],
) => {
  console.log('🔍 Function call triggered:', functionCall.name);
  console.log('📝 Function arguments:', functionCall.arguments);

  // Extract the function name and arguments
  const { name, arguments: args } = functionCall;

  try {
    // Parse the arguments
    const parsedArgs = JSON.parse(args);
    console.log('✅ Arguments parsed successfully:', parsedArgs);

    // Process based on the function name
    switch (name) {
      case 'getWeather': {
        const { location, unit = 'fahrenheit' } = parsedArgs;
        console.log(`🌤️ Getting weather for ${location} in ${unit}`);
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
        const resultData = {
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
        console.log('🌤️ Weather data:', resultData);
        return JSON.stringify(resultData);
      }
      case 'searchWeb':
        // Implement web search logic
        const { query } = parsedArgs;
        console.log(`🔎 Searching for: ${query}`);

        // This would be replaced with an actual API call
        const searchResults = [
          {
            title: 'Example result 1',
            url: 'https://example.com/1',
            snippet: 'This is an example search result.',
          },
          {
            title: 'Example result 2',
            url: 'https://example.com/2',
            snippet: 'This is another example search result.',
          },
        ];

        console.log('🔎 Search results:', searchResults);
        return JSON.stringify(searchResults);

      default:
        console.error(`❌ Function ${name} not implemented`);
        throw new Error(`Function ${name} not implemented`);
    }
  } catch (error) {
    console.error('❌ Function call error:', error);
    throw error;
  }
};

// Utility function to check if the model supports function calling
export function modelSupportsToolCalling(modelName: string): boolean {
  // Vercel AI SDK handles tool calling for supported providers
  // Check if it's a provider model (e.g., openai:..., google:..., anthropic:...)
  const isProviderModel = /^(openai|google|anthropic):/.test(
    modelName.toLowerCase(),
  );

  // Add local models known to support Ollama's function calling API if needed
  const supportedLocalModels: string[] = [
    // 'llama3', // Add specific local model names if you use them
  ];

  const isSupportedLocalModel = supportedLocalModels.some((model) =>
    modelName.toLowerCase().includes(model.toLowerCase()),
  );

  const isSupported = isProviderModel || isSupportedLocalModel;

  console.log(`🤖 Model ${modelName} supports tool calling: ${isSupported}`);
  return isSupported;
}
