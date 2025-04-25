import { z } from 'zod';
import { Agent, AgentInput, AgentOutput } from '@/agents/types'; // Import new Agent interface
import { agentRegistry } from '@/lib/agentRegistry'; // Import registry
import {
  executeGetWeather, // Import the tool function
  WeatherInputSchema,
  WeatherResultSchema, // Need this for output schema
  WeatherResult, // Keep this type for output
} from '@/utils/tools';

// Define the specific Input type for this Agent using z.output
// This correctly infers the type *after* parsing, including defaults
export type WeatherAgentInput = z.output<typeof WeatherInputSchema>;

// Define the specific Output type for this Agent
export type WeatherAgentOutput = WeatherResult;

// Create the WeatherAgent instance implementing the new Agent interface
const weatherAgent: Agent<WeatherAgentInput, WeatherAgentOutput> = {
  name: 'weather',
  description:
    'Provides current weather conditions and temperature forecasts for a specific location.',
  inputSchema: WeatherInputSchema, // The schema used for parsing
  outputSchema: WeatherResultSchema, // The schema for the expected output

  async execute(input: WeatherAgentInput): Promise<WeatherAgentOutput> {
    // Use agent name from the instance context
    console.log(`[Agent: ${weatherAgent.name}] Executing with input:`, input);
    try {
      // Input is already validated and typed correctly by the orchestrator
      // The 'unit' field will be present due to the schema's default
      const weatherResult = await executeGetWeather(input);
      console.log(`[Agent: ${weatherAgent.name}] Execution complete.`);
      return weatherResult;
    } catch (error) {
      console.error(
        `[Agent: ${weatherAgent.name}] Error during execution:`,
        error,
      );
      // Re-throw the error to be handled by the orchestrator or API route
      throw error;
    }
  },
};

// Register the agent instance with the registry when this module is loaded
agentRegistry.register(weatherAgent);

// Export the agent instance if it needs to be imported elsewhere (optional)
export { weatherAgent };
