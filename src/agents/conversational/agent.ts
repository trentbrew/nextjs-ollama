import { z } from 'zod';
import { Agent } from '@/agents/types';
import { agentRegistry } from '@/lib/agentRegistry';

// Define input schema accepting text and context (conversation history)
const ConversationalInputSchema = z.object({
  text: z.string(),
  context: z.array(z.object({ role: z.string(), content: z.string() })),
});
// Define output as string
const ConversationalOutputSchema = z.string();

type ConversationalInput = z.input<typeof ConversationalInputSchema>;
type ConversationalOutput = z.output<typeof ConversationalOutputSchema>;

/**
 * A simple agent for casual conversation, uses OpenAI Chat Completion API.
 * Now includes conversation history (context) in the request.
 */
const conversationalAgent: Agent<ConversationalInput, ConversationalOutput> = {
  name: 'conversational',
  description: 'Handles casual, free-form conversation.',
  inputSchema: ConversationalInputSchema,
  outputSchema: ConversationalOutputSchema,
  async execute({
    text,
    context,
  }: ConversationalInput): Promise<ConversationalOutput> {
    // Build messages array for OpenAI, include full history then the new user message
    const messagesForOpenAI = [
      ...context.map(({ role, content }) => ({ role, content })),
      { role: 'user', content: text },
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messagesForOpenAI,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Conversational agent error: ${response.status} ${err}`);
    }
    const data = await response.json();
    const choice = data.choices?.[0]?.message?.content;
    if (!choice) {
      throw new Error('No completion returned from OpenAI');
    }
    return choice;
  },
};

// Register this agent with the central registry
agentRegistry.register(conversationalAgent);

export { conversationalAgent };
