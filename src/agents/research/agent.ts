import { z } from 'zod';
import { Agent, AgentInput, AgentOutput } from '@/agents/types';
import { agentRegistry } from '@/lib/agentRegistry';
import {
  executeSearchWeb,
  SearchInput,
  SearchResult,
  SearchInputSchema,
  SearchResultSchema,
} from '@/utils/tools';

// Define the specific Input and Output types for this Agent
export type ResearchAgentInput = SearchInput;
export type ResearchAgentOutput = SearchResult;

// Create the ResearchAgent instance implementing the new Agent interface
const researchAgent: Agent<ResearchAgentInput, ResearchAgentOutput> = {
  name: 'research',
  description:
    'Performs web searches to find current information, research topics, look up facts, and answer general knowledge questions.',
  inputSchema: SearchInputSchema,
  outputSchema: SearchResultSchema,

  async execute(input: ResearchAgentInput): Promise<ResearchAgentOutput> {
    console.log(`[Agent: ${researchAgent.name}] Executing with input:`, input);
    try {
      const searchResult = await executeSearchWeb(input);
      console.log(`[Agent: ${researchAgent.name}] Execution complete.`);
      return searchResult;
    } catch (error) {
      console.error(
        `[Agent: ${researchAgent.name}] Error during execution:`,
        error,
      );
      throw error;
    }
  },
};

// Register the agent instance with the registry
agentRegistry.register(researchAgent);

// Export the agent instance (optional)
export { researchAgent };
