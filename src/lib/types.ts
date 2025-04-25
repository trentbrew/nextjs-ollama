import { ZodSchema } from 'zod';

// Defines the possible outcomes of the orchestrator's routing logic
export type OrchestratorDecision =
  | {
      type: 'delegate';
      agent: string;
      args: Record<string, unknown>;
    }
  | { type: 'respond'; message: string }
  | { type: 'clarify'; question: string };

// Defines the common interface for all specialist agents
export interface AgentContract<TInput, TOutput> {
  name: string;
  // Descriptions or keywords indicating agent capability (used by orchestrator)
  responsibilities: string[];
  // List of tool names this agent is allowed to use
  toolNames: string[];
  // Zod schema for validating the input arguments for the agent
  inputSchema: ZodSchema<TInput>;
  // The core execution logic for the agent
  execute: (input: TInput) => Promise<TOutput>;
}
