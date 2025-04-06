import { createOllama } from 'ollama-ai-provider';
import { streamText, convertToCoreMessages, UserContent } from 'ai';
import {
  availableFunctions,
  functionCallHandler,
  modelSupportsFunctionCalling,
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

    const ollamaUrl = process.env.OLLAMA_URL;
    console.log(`🔗 Ollama URL: ${ollamaUrl}`);

    const initialMessages = messages.slice(0, -1);
    const currentMessage = messages[messages.length - 1];
    console.log(
      `🔤 Current message: ${currentMessage.content.substring(0, 100)}${
        currentMessage.content.length > 100 ? '...' : ''
      }`,
    );

    const ollama = createOllama({ baseURL: ollamaUrl + '/api' });
    console.log('✅ Ollama client created');

    // Build message content array directly
    const messageContent: UserContent = [
      { type: 'text', text: currentMessage.content },
    ];

    // Add images if they exist
    if (data?.images?.length) {
      console.log(`🖼️ Adding ${data.images.length} images to the message`);
      data.images.forEach((imageUrl: string) => {
        const image = new URL(imageUrl);
        messageContent.push({ type: 'image', image });
      });
    }

    // Check if the selected model supports function calling
    const supportsFunctionCalling = modelSupportsFunctionCalling(selectedModel);

    // Stream text using the ollama model
    console.log('🔄 Starting stream text process');
    const result = await streamText({
      model: ollama(selectedModel),
      messages: [
        ...convertToCoreMessages(initialMessages),
        { role: 'user', content: messageContent },
      ],
      // Only add functions if the model supports them
      ...(supportsFunctionCalling
        ? {
            functions: Object.values(availableFunctions),
            functionCall: 'auto',
            experimental_onFunctionCall: async (
              functionCall: any,
              chatMessages: any,
            ) => {
              console.log('⚡ Function call detected in response');
              console.log(`🔍 Function name: ${functionCall.name}`);

              try {
                const result = await functionCallHandler(
                  functionCall,
                  chatMessages,
                );
                console.log(
                  `✅ Function call successful, result length: ${result.length} characters`,
                );
                return result;
              } catch (err) {
                console.error('❌ Function call handler error:', err);
                throw err;
              }
            },
          }
        : {}),
    });
    console.log('✅ Stream text process completed');

    return result.toDataStreamResponse();
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
