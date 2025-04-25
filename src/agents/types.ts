import { z, ZodSchema } from 'zod';

/**
 * Generic structure for agent input and output.
 * AgentInput remains a key/value map; AgentOutput can be any type, including primitives.
 */
export type AgentInput = Record<string, any>;
export type AgentOutput = unknown;

/**
 * Defines the common structure and capabilities for all agents.
 */
export interface Agent<TInput extends AgentInput, TOutput> {
  /** A unique identifier for the agent (e.g., 'weather', 'research'). */
  readonly name: string;

  /** A brief description of what the agent does, used for routing/selection. */
  readonly description: string;

  /** The Zod schema for validating the input arguments for the agent's execute method. */
  readonly inputSchema: ZodSchema<TInput>;

  /** The Zod schema for validating the output returned by the agent's execute method. */
  readonly outputSchema: ZodSchema<TOutput>;

  /**
   * Executes the agent's core logic.
   * @param args The validated input arguments for the agent.
   * @returns A promise resolving to the agent's output.
   */
  execute(args: TInput): Promise<TOutput>;
}
