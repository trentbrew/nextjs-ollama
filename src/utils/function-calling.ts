import { Message } from 'ai/react';
import { z } from 'zod';
// Remove tool import
// import { tool } from 'ai';
// Import our specific schema - REMOVED
// import { searchWebSchema } from './tool-schemas';
// Import only the weather schema now
// import { GetWeatherParameters } from './tool-schemas';

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

// Keep schema only if needed elsewhere, otherwise remove
// export const GetWeatherParameters = z.object({ ... });

// SearchWebParameters is now defined in the research agent file
// export type SearchWebParameters = z.infer<typeof searchWebSchema>;

// --- Tool Implementations ---
// executeGetWeather removed - moved to tools.ts

// executeSearchWeb is now defined in the research agent file
// export async function executeSearchWeb({ query }: SearchWebParameters) { ... }

// --- Tool Definitions ---
// availableTools removed - no longer needed here

// --- Utility Functions ---
export function modelSupportsToolCalling(modelName: string): boolean {
  // ... implementation ...
  const isProviderModel = /^(openai|google|anthropic):/.test(
    modelName.toLowerCase(),
  );
  const supportedLocalModels: string[] = [];
  const isSupportedLocalModel = supportedLocalModels.some((model) =>
    modelName.toLowerCase().includes(model.toLowerCase()),
  );
  const isSupported = isProviderModel || isSupportedLocalModel;
  console.log(
    `🤖 [Util] Model ${modelName} supports tool calling: ${isSupported}`,
  );
  return isSupported;
}

// Note: The old FunctionCallHandler is intentionally left out as it needs redesign.
