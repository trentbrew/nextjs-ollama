import { NextRequest, NextResponse } from 'next/server';
import { routeUserInput, executeAgentByName } from '@/lib/orchestration';
import { Message } from 'ai'; // Keep for request body type
// Remove direct agent imports if no longer needed for schema checks here
// import { ResearchAgent } from '@/agents/research/agent';
// import { WeatherAgent } from '@/agents/weather/agent';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * Handles chat requests, routes them based on intent, executes the
 * appropriate agent (if necessary), and returns the result.
 * This version uses a simplified, non-streaming approach for the MVP.
 */
export async function POST(req: NextRequest) {
  console.log('📝 [API Route] Chat request received');
  try {
    // Extract messages and optional embeddingModel from the request body
    const body = await req.json();
    const messages: Message[] = body.messages;
    const embeddingModel: string | undefined = body.embeddingModel;
    const coords: { latitude: number; longitude: number } | undefined =
      body.coords;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 },
      );
    }

    // Get the latest user message
    const currentUserMessage = messages[messages.length - 1];
    if (currentUserMessage.role !== 'user') {
      // For simplicity, only process the last user message
      // A more robust solution might handle assistant turns differently
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 },
      );
    }
    const userInput = currentUserMessage.content;
    console.log(`👤 [API Route] User Input: ${userInput}`);

    // --- 1. Orchestration: Route the input (include conversation context and coords) ---
    const conversation = messages.map(({ role, content }) => ({
      role,
      content,
    }));
    const routing = await routeUserInput(
      userInput,
      embeddingModel,
      conversation,
      coords,
    );
    console.log(`🚦 [API Route] Routing Decision:`, routing);

    // --- 2. Execute based on routing ---
    switch (routing.type) {
      case 'respond':
        console.log('✅ [API Route] Responding directly.');
        // Return simple JSON, client needs to handle display
        return NextResponse.json({ result: routing.message });

      case 'clarify':
        console.log('🤔 [API Route] Requesting clarification.');
        return NextResponse.json({ result: `🤔 ${routing.question}` });

      case 'delegate': {
        console.log(`🚚 [API Route] Delegating to agent: ${routing.agent}`);
        try {
          const output = await executeAgentByName(
            routing.agent, // This is now string, which executeAgentByName accepts
            routing.args, // Pass raw args; validation occurs in executeAgentByName
          );

          console.log(
            `✅ [API Route] Agent ${routing.agent} execution successful.`,
          );
          // Return the structured output from the agent
          // Client side will need to format this appropriately
          return NextResponse.json({ result: output });
        } catch (agentError: unknown) {
          console.error(
            `❌ [API Route] Error during agent ${routing.agent} execution:`,
            agentError,
          );
          const errorMessage =
            agentError instanceof Error
              ? agentError.message
              : 'Unknown agent error';
          return NextResponse.json(
            { error: `Agent execution failed: ${errorMessage}` },
            { status: 500 },
          );
        }
      }

      default:
        console.error('❌ [API Route] Unknown routing result type:', routing);
        // Teach TypeScript the routing type is exhaustive
        const exhaustiveCheck: never = routing;
        return NextResponse.json(
          { error: 'Internal server error: Unknown routing type' },
          { status: 500 },
        );
    }
  } catch (err: unknown) {
    console.error('❌ [API Route] Top-level error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 },
    );
  }
}
