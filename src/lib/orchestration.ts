// @ts-nocheck
// Silence type errors for external dependencies

import { z } from 'zod';
import OpenAI from 'openai'; // Import OpenAI library
// @ts-ignore: zod missing types
import { OrchestratorDecision } from './types';
import { agentRegistry } from './agentRegistry'; // Import the registry
import { errorRegistry } from './errorRegistry'; // Import error logging registry
import { Agent, AgentInput, AgentOutput } from '@/agents/types';

// --- Ensure agents are loaded and registered ---
// By importing the modules, we trigger the registration logic within them.
import '@/agents/weather/agent';
import '@/agents/research/agent';
import '@/agents/conversational/agent';
import '@/agents/fs/agent'; // Register filesystem agent
import '@/agents/notes/agent'; // Register notes agent
// -------------------------------------------------

// Initialize OpenAI client (Ensure OPENAI_API_KEY is set in your environment)
const openai = new OpenAI();

// --- Manually define tool schemas for now ---
// (Ideally, generate this dynamically from agentRegistry.getAllAgents() and Zod schemas)
const availableTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'notes',
      description:
        'List existing notes or create a new note in the user journal.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'create'],
            description: 'Whether to list existing notes or create a new one.',
          },
          title: {
            type: 'string',
            description:
              'The title of the note to create (required if action is "create").',
          },
          content: {
            type: 'string',
            description:
              'The content of the note to create (required if action is "create").',
          },
        },
        required: ['action'], // Title/content conditionally required based on action
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'weather',
      description:
        'Provides current weather conditions for a specific location.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description:
              'The city or area to get the weather for (e.g., "San Francisco, CA").',
          },
          // We could add lat/lon here if needed
        },
        // Location might be optional if coords are provided later
        // required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'research',
      description: 'Performs web searches or looks up information on a topic.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query or topic to research.',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'filesystem',
      description: 'Lists files or directories within the project.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'The directory path to list (e.g., "src/app"). Defaults to ".".',
          },
          // Action is always 'list' for now, so not needed as param
        },
        // Path is optional, defaults handled later
      },
    },
  },
  // Note: We omit 'conversational' as a tool. The LLM will respond directly if no tool fits.
];

/**
 * Determines the appropriate action based on user input,
 * leveraging the AgentRegistry for dynamic routing.
 *
 * @param input The user's chat message.
 * @param embeddingModel Optional embedding provider and model string (e.g. 'openai:...').
 * @param conversation Optional conversation history.
 * @param coords Optional coordinates.
 * @returns OrchestratorDecision indicating delegation, direct response, or clarification.
 */
export async function routeUserInput(
  input: string,
  embeddingModel?: string, // Keep for potential future use, but not used in this routing
  conversation?: { role: string; content: string }[],
  coords?: { latitude: number; longitude: number }, // Pass to weather agent if needed
): Promise<OrchestratorDecision> {
  console.log(`[Orchestrator LLM] Routing input: "${input}"`);

  // Prepare messages for the LLM router
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a helpful assistant acting as a router. Based on the user's request, decide whether to call one of the available tools/functions or respond directly. If a tool is appropriate, call it with the necessary arguments extracted from the user's request. If unsure or no tool fits, respond directly to the user in a conversational manner. Available tools: ${availableTools
        .map((t) => t.function.name)
        .join(', ')}`,
    },
    // Add recent conversation history (optional, helps with context)
    ...(conversation?.slice(-5) || []).map((msg) => ({
      // Last 5 messages
      role: msg.role === 'assistant' ? 'assistant' : 'user', // Map roles if needed
      content: msg.content,
    })),
    { role: 'user', content: input }, // The current user input
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // Or gpt-3.5-turbo for speed/cost balance
      messages: messages,
      tools: availableTools,
      tool_choice: 'auto', // Let the model decide
    });

    const responseMessage = response.choices[0].message;

    // Check if the model wants to call a tool
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]; // Handle first tool call
      const agentName = toolCall.function.name;
      let args: AgentInput = {}; // Initialize args as AgentInput
      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error(
          `[Orchestrator LLM] Failed to parse tool arguments for ${agentName}:`,
          e,
        );
        return {
          type: 'clarify',
          question: `Sorry, I couldn't understand the parameters for the ${agentName} tool. Can you rephrase?`,
        };
      }

      // Special handling if needed (e.g., adding coords to weather)
      if (
        agentName === 'weather' &&
        coords?.latitude &&
        coords?.longitude &&
        !args.location // Only add coords if location wasn't parsed
      ) {
        args = {
          ...args,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      }
      // Special handling for filesystem default path
      if (agentName === 'filesystem') {
        args.action = 'list'; // Enforce list action
        if (!args.path) {
          args.path = '.'; // Default path if LLM didn't provide one
        }
      }

      console.log(
        `[Orchestrator LLM] Delegating to "${agentName}" with args:`,
        args,
      );
      // Ensure the agent exists in our registry before delegating
      if (agentRegistry.getAgentByName(agentName)) {
        return { type: 'delegate', agent: agentName, args };
      } else {
        console.error(
          `[Orchestrator LLM] LLM chose tool "${agentName}", but it's not registered.`,
        );
        return {
          type: 'clarify',
          question: `Sorry, I found a tool called ${agentName} but couldn't use it.`,
        };
      }
    } else if (responseMessage.content) {
      // The model chose to respond directly
      console.log(
        `[Orchestrator LLM] Responding directly: "${responseMessage.content}"`,
      );
      return { type: 'respond', message: responseMessage.content };
    } else {
      // Unexpected response from LLM
      console.warn(
        '[Orchestrator LLM] LLM response did not include a tool call or content.',
      );
      return {
        type: 'clarify',
        question: "I'm not sure how to proceed. Can you try again?",
      };
    }
  } catch (error: any) {
    console.error(
      '[Orchestrator LLM] Error calling OpenAI for routing:',
      error,
    );
    errorRegistry.addError('orchestrator-llm', error as Error);
    return {
      type: 'clarify',
      question: `Sorry, I encountered an error trying to understand your request: ${error.message}`,
    };
  }
}

/**
 * Executes the specified agent by name using the AgentRegistry,
 * validating input against the agent's schema before execution.
 *
 * @param agentName The name of the agent to execute.
 * @param args The arguments intended for the agent.
 * @returns Promise<AgentOutput> The structured output from the executed agent.
 * @throws Error if agent not found or input validation fails.
 */
export async function executeAgentByName(
  agentName: string,
  args: AgentInput,
): Promise<AgentOutput> {
  console.log(
    `▶️ [Orchestration Lib] Attempting to execute agent: "${agentName}"`,
  );
  const agent = agentRegistry.getAgentByName(agentName);

  if (!agent) {
    console.error(`❌ [Orchestration Lib] Agent not found: "${agentName}"`);
    errorRegistry.addError(
      agentName,
      new Error(`Agent not found: ${agentName}`),
    );
    throw new Error(`Agent not found: ${agentName}`);
  }

  try {
    // Validate the provided args against the agent's specific input schema
    console.log(
      `[Orchestration Lib] Validating args for "${agentName}":`,
      args,
    );
    const validatedArgs = agent.inputSchema.parse(args);
    console.log(
      `[Orchestration Lib] Args validated successfully for "${agentName}". Executing...`,
    );

    // Execute the agent with validated arguments
    const output = await agent.execute(validatedArgs);

    return output; // Return raw output for now
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      errorRegistry.addError(agentName, error as Error);
      console.error(
        `❌ [Orchestration Lib] Input validation failed for agent "${agentName}":`,
        error.errors,
      );
      throw new Error(
        `Input validation failed for agent ${agentName}: ${error.errors
          .map((e: any) => `${e.path.join('.')} (${e.message})`)
          .join(', ')}`,
      );
    } else {
      errorRegistry.addError(agentName, error as Error);
      console.error(
        `❌ [Orchestration Lib] Error during execution of agent "${agentName}":`,
        error,
      );
      throw error;
    }
  }
}
