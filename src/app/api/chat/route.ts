import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { vertex } from '@ai-sdk/google-vertex/edge';
import {
  streamText,
  convertToCoreMessages,
  UserContent,
  tool,
  StreamData,
  TextStreamPart,
} from 'ai';
import {
  availableTools,
  modelSupportsToolCalling,
} from '@/utils/function-calling';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('📝 Chat API request received');
  try {
    // Destructure request data
    const { messages, selectedModel, data } = await req.json();
    console.log(`🤖 Using model: ${selectedModel}`);
    console.log(`💬 Messages count: ${messages.length}`);

    // Determine provider and model ID from selectedModel (e.g. "openai:gpt-4o")
    const [providerName, modelName] = selectedModel.split(':');
    let providerModel;
    switch (providerName) {
      case 'openai':
        providerModel = openai(modelName);
        break;
      case 'google':
        providerModel = vertex(modelName);
        break;
      case 'anthropic':
        providerModel = anthropic(modelName);
        break;
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }

    const initialMessages = messages.slice(0, -1);
    const currentMessage = messages[messages.length - 1];
    console.log(
      `🔤 Current message: ${currentMessage.content.substring(0, 100)}${
        currentMessage.content.length > 100 ? '...' : ''
      }`,
    );

    // Create a StreamData instance to send additional data with the response
    const streamData = new StreamData();

    // Define the system prompt again
    const systemPrompt = `You are a helpful assistant. You have access to the following tools:
      - getWeather: Get the current weather for a location. Use this when the user asks for the weather.
      - searchWeb: Search the web for information. Use this for general knowledge or current events questions.
      Respond to the user's request using the available tools when appropriate.`;

    // Build message content array, including images if present
    const messageContent: UserContent = [
      { type: 'text', text: currentMessage.content },
    ];
    if (data?.images?.length) {
      console.log(`🖼️ Adding ${data.images.length} images to the message`);
      data.images.forEach((imageUrl: string) => {
        try {
          const image = new URL(imageUrl);
          messageContent.push({ type: 'image', image });
        } catch (e) {
          console.warn(`Skipping invalid image URL: ${imageUrl}`);
        }
      });
    }

    // Stream text using the selected provider model
    console.log('🔄 Starting stream text process');
    const result = await streamText({
      model: providerModel,
      system: systemPrompt,
      maxSteps: 5,
      messages: [
        ...convertToCoreMessages(initialMessages),
        { role: 'user', content: messageContent },
      ],
      // Only add tools if the model supports them
      ...(modelSupportsToolCalling(selectedModel)
        ? {
            tools: availableTools,
            toolChoice: 'auto',
          }
        : {}),
      // Add the onChunk callback to intercept stream parts
      onChunk: async ({
        chunk,
      }: {
        chunk: TextStreamPart<typeof availableTools>;
      }) => {
        // Check if the chunk is a tool call start
        if (chunk.type === 'tool-call') {
          // Log that we are appending the tool call start annotation
          console.log(
            `💡 Appending tool_call_start: ${chunk.toolName} (${chunk.toolCallId})`,
          );
          // Append custom data to signal tool usage to the client
          streamData.append({
            type: 'tool_call_start',
            toolName: chunk.toolName,
            toolCallId: chunk.toolCallId,
          });
        }
      },
      // Add onFinish to close the StreamData
      onFinish: () => {
        streamData.close();
      },
    });
    console.log('✅ Stream text process completed');

    // Return the response stream with the appended data
    return result.toDataStreamResponse({ data: streamData });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('❌ Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
