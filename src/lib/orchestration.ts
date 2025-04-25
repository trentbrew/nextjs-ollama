import { z } from 'zod';
import { OrchestratorDecision } from './types';
import { agentRegistry } from './agentRegistry'; // Import the registry
import { errorRegistry } from './errorRegistry'; // Import error logging registry
import { Agent, AgentInput, AgentOutput } from '@/agents/types';
import { selectAgentByEmbedding } from './agentEmbeddingSelector';

// --- Ensure agents are loaded and registered ---
// By importing the modules, we trigger the registration logic within them.
import '@/agents/weather/agent';
import '@/agents/research/agent';
import '@/agents/conversational/agent';
import '@/agents/fs/agent'; // Register filesystem agent
// -------------------------------------------------

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
  embeddingModel?: string,
  conversation?: { role: string; content: string }[],
  coords?: { latitude: number; longitude: number },
): Promise<OrchestratorDecision> {
  const lowerInput = input.toLowerCase();

  // --- Direct Responses & Meta Questions (Keep as is) ---
  if (/\b(hi|hello|hey|greetings)\b/.test(lowerInput)) {
    return { type: 'respond', message: 'Hi there! How can I help you today?' };
  }
  if (/\b(thanks|thank you|thx)\b/.test(lowerInput)) {
    return { type: 'respond', message: "You're welcome!" };
  }
  if (/\b(bye|goodbye|see ya)\b/.test(lowerInput)) {
    return { type: 'respond', message: 'Goodbye!' };
  }
  if (/what can you do|capabilities|what are your abilities/.test(lowerInput)) {
    let message =
      'I can help with various tasks. Currently, I have agents for:';
    agentRegistry.getAllAgents().forEach((agent) => {
      message += `\n- ${agent.name}: ${agent.description}`;
    });
    return { type: 'respond', message };
  }

  // --- Agent Delegation using Registry ---
  console.log(`[Orchestrator] Finding agent for input: "${input}"`);
  // 1) Keyword-based agent matching
  let matchedAgent = agentRegistry.findAgentForInput(input);
  // 2) If no keyword match, try embedding-based routing
  if (!matchedAgent && embeddingModel) {
    console.log(
      '[Orchestrator] No keyword match, attempting embedding-based routing',
    );
    matchedAgent = await selectAgentByEmbedding(input, embeddingModel);
    if (matchedAgent) {
      console.log(
        `[Orchestrator] Embedding-based matched agent: "${matchedAgent.name}"`,
      );
    }
  }

  if (matchedAgent) {
    console.log(`[Orchestrator] Matched agent: "${matchedAgent.name}"`);
    let args: AgentInput = {};

    // --- Argument Extraction Logic (Simplified) ---
    // This section needs refinement for robust argument handling based on agent needs.
    if (matchedAgent.name === 'weather') {
      // Prioritize coordinates if available
      if (coords?.latitude && coords?.longitude) {
        args = { latitude: coords.latitude, longitude: coords.longitude };
      } else {
        // Otherwise, parse location from text
        const weatherMatch = lowerInput.match(
          /weather in (.*)|forecast for (.*)|temperature in (.*)/i,
        );
        const location = (
          weatherMatch?.[1] ||
          weatherMatch?.[2] ||
          weatherMatch?.[3]
        )?.trim();

        if (location) {
          const cleanedLocation = location.replace(/[^\w\s]+$/, '').trim();
          args = { location: cleanedLocation };
        } else {
          // No coords and no location in text: Clarify
          console.log(
            '[Orchestrator] Weather agent matched, but no location/coords provided. Clarifying.',
          );
          return {
            type: 'clarify',
            question: 'Which location would you like the weather for?',
          };
        }
      }
    } else if (matchedAgent.name === 'research') {
      // Use the full input as the query for the research agent
      args = { query: input };
    } else if (matchedAgent.name === 'conversational') {
      // Use the full input and conversation history for the conversational agent
      args = {
        text: input,
        context: conversation || [],
      };
    } else if (matchedAgent.name === 'filesystem') {
      // Parse filesystem command, default to list action
      // e.g. "ls src/app" or "list files in src/app"
      const fsMatch = input.match(
        /(?:^ls\s+|list files? in\s+|show files? in\s+|list directory\s+|show directory\s+|list folder\s+|show folder\s+)(.+)/i,
      );
      const dir = fsMatch ? fsMatch[1].trim() : '.';
      args = { action: 'list', path: dir };
    } else {
      // Default behavior if specific arg extraction isn't defined
      // This might need adjustment based on future agents
      console.warn(
        `[Orchestrator] Agent "${matchedAgent.name}" matched, but no specific argument extraction logic defined. Passing raw input. Define extraction logic if needed.`,
      );
      // Attempt to pass raw input, assuming a common input structure might exist
      // or the agent handles raw input.
      // This might fail validation later if the agent expects specific fields.
      args = { input: input }; // Or potentially just pass empty args: {}
    }
    // ---------------------------------------------

    console.log(
      `[Orchestrator] Delegating to "${matchedAgent.name}" with args:`,
      args,
    );
    return { type: 'delegate', agent: matchedAgent.name, args };
  } else {
    // --- Fallback if no agent matches (including conversational) ---
    console.log(
      '[Orchestrator] No specific agent matched, and no fallback conversational agent found or matched. Routing to clarification.',
    );
    return {
      type: 'clarify',
      question:
        "I'm not sure how to help with that. Could you please rephrase your request or provide more details?",
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
  agentName: string, // Allow any string, validation happens next
  args: AgentInput, // Arguments passed from the router
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
  } catch (error) {
    if (error instanceof z.ZodError) {
      errorRegistry.addError(agentName, error);
      console.error(
        `❌ [Orchestration Lib] Input validation failed for agent "${agentName}":`,
        error.errors,
      );
      throw new Error(
        `Input validation failed for agent ${agentName}: ${error.errors
          .map((e) => `${e.path.join('.')} (${e.message})`)
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
