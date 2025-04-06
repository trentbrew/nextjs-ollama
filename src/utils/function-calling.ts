import { Message } from 'ai/react';

// Define FunctionCall type since it may not be exported directly
export interface FunctionCall {
  name: string;
  arguments: string;
}

// Extend the Message type to include function call properties
export interface ExtendedMessage extends Message {
  function_call?: FunctionCall;
  function_call_result?: string;
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

// Define the available tools/functions for the AI
export const availableFunctions: Record<string, FunctionDefinition> = {
  getWeather: {
    name: 'getWeather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description:
            'The city and state or country, e.g. "San Francisco, CA"',
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'The unit of temperature',
        },
      },
      required: ['location'],
    },
  },
  searchWeb: {
    name: 'searchWeb',
    description: 'Search the web for information',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
  },
  // Add more function definitions as needed
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
      case 'getWeather':
        // Implement weather fetching logic
        const { location, unit = 'celsius' } = parsedArgs;
        console.log(`🌤️ Getting weather for ${location} in ${unit}`);

        // This would be replaced with an actual API call
        const weatherData = {
          location,
          temperature: unit === 'celsius' ? 22 : 72,
          conditions: 'Sunny',
          humidity: '45%',
        };

        console.log('🌤️ Weather data:', weatherData);
        return JSON.stringify(weatherData);

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
export function modelSupportsFunctionCalling(modelName: string): boolean {
  // This list would need to be updated as models evolve
  const supportedModels = [
    'llama3',
    'llama3.1',
    'llama3.2',
    'mixtral',
    'deepseek-r1',
    'qwen2',
  ];

  const isSupported = supportedModels.some((model) =>
    modelName.toLowerCase().includes(model.toLowerCase()),
  );

  console.log(
    `🤖 Model ${modelName} supports function calling: ${isSupported}`,
  );
  return isSupported;
}
