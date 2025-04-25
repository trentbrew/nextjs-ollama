import { Agent, AgentInput, AgentOutput } from '@/agents/types';

/**
 * A central registry for managing and accessing available agents.
 * Implemented as a Singleton pattern.
 */
class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, Agent<any, any>> = new Map();

  private constructor() {
    // Private constructor ensures singleton instance
  }

  /**
   * Gets the singleton instance of the AgentRegistry.
   */
  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Registers an agent with the registry.
   * Throws an error if an agent with the same name is already registered.
   * @param agent The agent instance to register.
   */
  public register<TInput extends AgentInput, TOutput extends AgentOutput>(
    agent: Agent<TInput, TOutput>,
  ): void {
    if (this.agents.has(agent.name)) {
      console.warn(
        `⚠️ [AgentRegistry] Agent with name "${agent.name}" already registered. Overwriting.`,
      );
      // Optionally throw an error instead of overwriting:
      // throw new Error(`Agent with name "${agent.name}" already registered.`);
    }
    this.agents.set(agent.name, agent);
    console.log(`[AgentRegistry] Registered agent: "${agent.name}"`);
  }

  /**
   * Retrieves an agent by its unique name.
   * @param name The name of the agent to retrieve.
   * @returns The agent instance, or undefined if not found.
   */
  public getAgentByName(name: string): Agent<any, any> | undefined {
    return this.agents.get(name);
  }

  /**
   * Gets a list of all registered agents.
   * @returns An array of all registered agent instances.
   */
  public getAllAgents(): Agent<any, any>[] {
    return Array.from(this.agents.values());
  }

  /**
   * Finds an agent whose input likely matches its purpose.
   * This implementation uses simple keyword matching based on agent names and common triggers.
   * It prioritizes specific agents over the general conversational agent.
   * @param inputText The user's input text.
   * @returns The best matching agent instance, or undefined if no suitable agent found.
   */
  public findAgentForInput(inputText: string): Agent<any, any> | undefined {
    const lowerInput = inputText.toLowerCase();

    // Define keyword triggers for specific agents
    const weatherTriggers = [
      'weather',
      'forecast',
      'temperature',
      'conditions',
    ];
    const researchTriggers = [
      'search',
      'find',
      'look up',
      'research',
      'news',
      'latest',
      'what is',
      'who is',
      'tell me about',
    ];

    // Check specific agents first
    const weatherAgent = this.getAgentByName('weather');
    if (
      weatherAgent &&
      weatherTriggers.some((trigger) => lowerInput.includes(trigger))
    ) {
      return weatherAgent;
    }

    const researchAgent = this.getAgentByName('research');
    if (
      researchAgent &&
      researchTriggers.some((trigger) => lowerInput.includes(trigger))
    ) {
      return researchAgent;
    }

    // Filesystem agent triggers: list or show files/directories
    const fsAgent = this.getAgentByName('filesystem');
    const fsTriggers = [
      'list files',
      'show files',
      'list directory',
      'show directory',
      'list folder',
      'show folder',
    ];
    if (fsAgent) {
      // support 'ls ' at the start of the command or explicit list keywords
      if (
        lowerInput.startsWith('ls ') ||
        fsTriggers.some((t) => lowerInput.includes(t))
      ) {
        return fsAgent;
      }
    }

    // Notes agent triggers: create, add, show, list notes
    const notesAgent = this.getAgentByName('notes');
    const notesTriggers = [
      'note', // Catch general note references
      'add note',
      'create note',
      'show notes',
      'list notes',
    ];
    if (notesAgent && notesTriggers.some((t) => lowerInput.includes(t))) {
      return notesAgent;
    }

    // If no specific agent matched, fall back to the conversational agent
    const conversationalAgent = this.getAgentByName('conversational');
    if (conversationalAgent) {
      return conversationalAgent;
    }

    // If even the conversational agent isn't registered, return undefined
    return undefined;
  }
}

// Export the singleton instance
export const agentRegistry = AgentRegistry.getInstance();
