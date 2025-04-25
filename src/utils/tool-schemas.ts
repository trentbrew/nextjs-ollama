import { z } from 'zod';

// Schema for the searchWeb tool - REMOVED
// export const searchWebSchema = z.object({ ... });
// export type SearchWebTool = typeof searchWebSchema;

// You can add schemas for other tools here as needed
export const getWeatherSchema = z.object({
  location: z
    .string()
    .describe('The city and state or country, e.g. "San Francisco, CA"'),
  unit: z
    .enum(['celsius', 'fahrenheit'])
    .optional()
    .default('fahrenheit')
    .describe('The unit of temperature'),
});

export type GetWeatherTool = typeof getWeatherSchema;
