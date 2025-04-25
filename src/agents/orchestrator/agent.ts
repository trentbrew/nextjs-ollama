console.log('Loading Orchestrator Agent Definition...'); // Test log

import { z } from 'zod';
import { tool } from 'ai';

// --- Orchestrator System Prompt ---
export const orchestratorSystemPrompt = `You are an expert task orchestrator AI.
Your goal is to analyze the user's request and delegate it to the appropriate specialist agent or handle it directly if no specialist is suitable.

You have access to the following specialist agents via tools:

1.  **Research Agent:**
    - **Tool:** \`delegateToResearchAgent(query: string)\`
    - **Capabilities:** Use this agent for requests requiring web searches, finding current information, or answering general knowledge questions about recent events, specific topics, etc.
    - **Example:** User asks "What's the latest news about AI?" -> Call \`delegateToResearchAgent(query: "latest news about AI")\`

2.  **Weather Agent:** (Note: We haven't created a separate Weather Agent file yet, but we describe it here for the orchestrator)
    - **Tool:** \`delegateToWeatherAgent(location: string, unit: 'celsius' | 'fahrenheit' = 'fahrenheit')\`
    - **Capabilities:** Use this agent *only* for requests specifically asking for the current weather in a particular location.
    - **Example:** User asks "What's the weather in London?" -> Call \`delegateToWeatherAgent(location: "London")\`

**Your Process:**
1.  Analyze the user's latest message.
2.  Determine if the request fits the capabilities of the Research Agent or Weather Agent.
3.  If it matches a specialist agent, call the corresponding delegation tool with the extracted parameters (e.g., the search query or location).
4.  If the request is conversational, does not require specific tools (like weather or search), or asks for creative writing/general assistance, respond directly to the user without using a delegation tool.
5.  Only call one delegation tool per user request.
`;

// --- Delegation Tool Schemas ---

const delegateToResearchSchema = z.object({
  query: z
    .string()
    .describe('The specific search query to pass to the research agent'),
});

const delegateToWeatherSchema = z.object({
  location: z
    .string()
    .describe(
      'The city and state or country for the weather request, e.g., "San Francisco, CA"',
    ),
  unit: z
    .enum(['celsius', 'fahrenheit'])
    .optional()
    .default('fahrenheit')
    .describe('Temperature unit'),
});

// --- Orchestrator Tool Definitions ---
// Note: The 'execute' functions for these tools won't actually *run* the agent here.
// They simply return a marker or the parameters, signaling to the API route handler which agent to call next.
// The API route will contain the logic to invoke the *actual* specialist agent.

export const orchestratorTools = {
  delegateToResearchAgent: tool({
    description:
      'Delegate a request requiring web search or current information to the Research Agent.',
    parameters: delegateToResearchSchema,
    execute: async (args) => {
      console.log(
        'Orchestrator: Delegating to Research Agent with args:',
        args,
      );
      // Return marker object to signal delegation
      return { _isDelegation: true, agent: 'research', args };
    },
  }),
  delegateToWeatherAgent: tool({
    description: 'Delegate a request for current weather to the Weather Agent.',
    parameters: delegateToWeatherSchema,
    execute: async (args) => {
      console.log('Orchestrator: Delegating to Weather Agent with args:', args);
      // Return marker object to signal delegation
      return { _isDelegation: true, agent: 'weather', args };
    },
  }),
};
