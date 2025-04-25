// @ts-nocheck
'use client';

import ChatTopbar from './chat-topbar';
import ChatList from './chat-list';
import ChatBottombar from './chat-bottombar';
import { generateId } from 'ai';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import useChatStore, { ChatStore } from '@/app/hooks/useChatStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ExtendedMessage,
  modelSupportsToolCalling,
} from '@/utils/function-calling';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import type { Doc } from '@/../convex/_generated/dataModel';

export interface DisplayMessage extends Doc<'messages'> {
  // Retain DisplayMessage if it adds value beyond Doc, otherwise just use Doc
  // id: string; // Already in Doc as _id
  // role: 'user' | 'assistant' ... // Already in Doc
  // content: string | any; // Already in Doc
  // sources?: string[]; // Already in Doc
}

export interface ChatProps {
  id: string; // This is the chatId
  // initialMessages is no longer needed, data comes from Convex
  isMobile?: boolean;
}

export default function Chat({
  id: chatId, // Rename prop to chatId for clarity
  isMobile,
}: ChatProps) {
  // Get input state and setter from Zustand store, specific to this chatId
  const chatInput = useChatStore(
    (state: ChatStore) => state.chatInputs[chatId] || '',
  );
  const setChatInput = useChatStore((state: ChatStore) => state.setChatInput);

  // Fetch messages using Convex useQuery
  const messages = useQuery(api.messages.listByChat, { chatId });
  // Get Convex mutation function
  const addMessageMutation = useMutation(api.messages.add);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const setCoords = useChatStore((state: ChatStore) => state.setCoords);
  const coords = useChatStore((state: ChatStore) => state.coords);
  const selectedModel = useChatStore((state: ChatStore) => state.selectedModel);

  // Ref for the scrollable chat area
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages are loaded or changed
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    const success = (position: GeolocationPosition) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setCoords({ latitude, longitude });
      toast.success('Location fetched successfully!');
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let message = 'Unable to retrieve location.';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message =
            'Location permission denied. Please check browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable. Check network/GPS.';
          break;
        case error.TIMEOUT:
          message = 'Location request timed out.';
          break;
        default:
          message = `An unknown location error occurred (Code: ${error.code}).`;
          break;
      }
      toast.error(message);
      setCoords(null); // Clear coords on any error
    };

    console.log('[Chat] Requesting geolocation...');
    navigator.geolocation.getCurrentPosition(success, errorCallback);
  }, [setCoords]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Use chatInput from store
    if (!chatInput.trim()) return;

    const currentInput = chatInput;
    setChatInput(chatId, '');
    // Get the selected embedding model from store
    const embeddingModelSelected = (useChatStore.getState() as ChatStore).embeddingModel;

    // Prepare user message object (consistent with Convex schema)
    const userMessageForApi = {
      role: 'user' as const,
      content: currentInput,
    };
    // Generate embedding for user message if model selected
    let userEmbedding: number[] | undefined;
    if (embeddingModelSelected) {
      const embedRes = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ text: currentInput, embeddingModel: embeddingModelSelected })
      });
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        userEmbedding = embedData.embedding;
      } else {
        console.error('Error generating embedding for user message', await embedRes.text());
      }
    }

    // Add user message via Convex mutation
    try {
      await addMessageMutation({
        chatId: chatId,
        role: userMessageForApi.role,
        content: userMessageForApi.content,
        embedding: userEmbedding,
      });
    } catch (mutationError) {
      console.error(
        '[Chat Component] User message mutation error:',
        mutationError,
      );
      setError('Failed to send message. Please try again.');
      setChatInput(chatId, currentInput); // Restore input in store if send failed
      return; // Don't proceed if user message failed
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch from API route
      const currentMessagesFromConvex = messages || []; // Get messages from useQuery
      // Construct messages for API: Convex history + the new user message
      const messagesForApi = [
        ...currentMessagesFromConvex.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        userMessageForApi, // Add the message we just submitted
      ];

      const currentCoords = (useChatStore.getState() as ChatStore).coords;
      const currentEmbeddingModel = (useChatStore.getState() as ChatStore)
        .embeddingModel;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForApi, // Send combined list
          embeddingModel: currentEmbeddingModel,
          coords: currentCoords,
        }),
      });

      if (!res.ok) {
        let errorMsg = `HTTP Error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch (jsonError) {
          // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      // --- Process the response data ---
      let assistantContent: string;
      let sources: string[] | undefined = undefined;
      let agentName: string | undefined = undefined;

      if (typeof data.result === 'string') {
        assistantContent = data.result;
        // Infer agent name if possible (e.g., conversational or direct response)
        agentName = 'conversational'; // Or potentially extract from routing decision if returned
      } else if (typeof data.result === 'object' && data.result !== null) {
        // Agent outputs
        if (data.result.searchResult) {
          assistantContent = data.result.searchResult;
          sources = data.result.sources;
          agentName = 'research';
        } else if (data.result.temperature !== undefined) {
          assistantContent = `The current weather in ${data.result.location} is ${data.result.temperature}°${data.result.unit} and ${data.result.conditions}.`;
          agentName = 'weather';
        } else if (data.result.name && Array.isArray(data.result.entries)) {
          // Filesystem agent output
          assistantContent = `Directory listing for ${data.result.path || '.'}:
${data.result.entries.map((e: any) => `${e.isDirectory ? '📁' : '📄'} ${e.name}`).join('\n')}`;
          agentName = 'filesystem';
        } else {
          assistantContent = JSON.stringify(data.result);
          agentName = 'unknown';
        }
      } else {
        assistantContent = 'Received unexpected response format.';
        console.warn('Unexpected API response format:', data);
      }

      // Add assistant message via Convex mutation
      // Generate embedding for assistant message if model selected
      let assistantEmbedding: number[] | undefined;
      if (embeddingModelSelected) {
        const embedRes2 = await fetch('/api/embeddings', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ text: assistantContent, embeddingModel: embeddingModelSelected })
        });
        if (embedRes2.ok) {
          const embedData2 = await embedRes2.json();
          assistantEmbedding = embedData2.embedding;
        } else {
          console.error('Error generating embedding for assistant message', await embedRes2.text());
        }
      }
      await addMessageMutation({
        chatId: chatId,
        role: 'assistant',
        content: assistantContent,
        sources: sources,
        agentName: agentName,
        embedding: assistantEmbedding,
      });
    } catch (err: any) {
      console.error('[Chat Component] Submit Error:', err);
      setError(err.message || 'An error occurred');
      // Optionally add error to Convex too
      // await addMessageMutation({ chatId: chatId, role: 'assistant', content: `Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // testFunctionCalling needs adaptation for Convex
  const testFunctionCalling = async () => {
    if (!selectedModel) {
      toast.error('Please select a model');
      return;
    }
    console.log('🧪 Testing function calling capabilities...');
    const testPrompt =
      'I need to know the current weather in San Francisco. Also, can you search for information about climate change?';
    setChatInput(chatId, testPrompt); // Set input so handleSubmit picks it up
    // Simulate form submission
    const fakeEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>;
    await handleSubmit(fakeEvent);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* <div className="flex justify-between items-center">
        <ChatTopbar
          isLoading={isLoading}
          chatId={chatId}
          // messages prop removed from ChatTopbar as it gets data internally now
          // setMessages prop removed
        />
        <button
          onClick={getLocation}
          className="mr-2 p-2 rounded-full hover:bg-muted"
          title="Use current location"
          disabled={isLoading}
        >
          📍
        </button>
        <button
          onClick={testFunctionCalling}
          className="mr-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
          disabled={isLoading}
        >
          Test Functions
        </button>
      </div> */}

      <div
        className="flex-1 w-full overflow-y-auto relative"
        ref={chatScrollRef}
      >
        {messages === undefined && <p>Loading messages...</p>}{' '}
        {/* Loading state */}
        {messages && messages.length === 0 && !isLoading ? (
          <div className="flex flex-col h-full w-full items-center gap-4 justify-center">
            <Image
              src="/ollama.png"
              alt="AI"
              width={40}
              height={40}
              className="h-16 w-14 object-contain dark:invert"
            />
            <p className="text-center text-base text-muted-foreground">
              How can I help you today?
            </p>
          </div>
        ) : (
          <ChatList
            messages={messages || []} // Pass messages from useQuery
            isLoading={isLoading}
            // reload prop might not be needed or needs Convex adaptation
            reload={async (): Promise<undefined> => {
              return undefined;
            }}
          />
        )}
      </div>

      {/* Error display (always possible) */}
      {error && (
        <p className="text-red-500 px-4 py-2 text-center">Error: {error}</p>
      )}

      {/* Bottom bar (always rendered) */}
      <ChatBottombar
        // Pass value and handler connected to Zustand store
        input={chatInput}
        handleInputChange={(e) => setChatInput(chatId, e.target.value)}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        stop={() => setIsLoading(false)} // Simplified stop
        setInput={(newInput) => setChatInput(chatId, newInput)} // Update store via setInput prop
      />
    </div>
  );
}
