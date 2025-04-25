import { Agent } from '@/agents/types';
import { getEmbedding, cosine } from './embeddings';
import { agentRegistry } from './agentRegistry';

let agentEmbeddings: { agent: Agent<any, any>; vector: number[] }[] = [];

/**
 * Initializes embeddings for all registered agents.
 */
export async function initAgentEmbeddings(providerModel?: string) {
  const agents = agentRegistry.getAllAgents();
  agentEmbeddings = await Promise.all(
    agents.map(async (agent) => ({
      agent,
      vector: await getEmbedding(
        `${agent.name}: ${agent.description}`,
        providerModel,
      ),
    })),
  );
}

/**
 * Selects the best agent based on embedding similarity.
 * Returns the agent if similarity exceeds a threshold.
 */
export async function selectAgentByEmbedding(
  input: string,
  providerModel?: string,
): Promise<Agent<any, any> | undefined> {
  if (agentEmbeddings.length === 0) {
    await initAgentEmbeddings(providerModel);
  }
  const inputVec = await getEmbedding(input, providerModel);
  let bestScore = -1;
  let bestAgent: Agent<any, any> | undefined;
  for (const { agent, vector } of agentEmbeddings) {
    const score = cosine(inputVec, vector);
    if (score > bestScore) {
      bestScore = score;
      bestAgent = agent;
    }
  }
  // Only return if above threshold
  return bestScore > 0.7 ? bestAgent : undefined;
}
