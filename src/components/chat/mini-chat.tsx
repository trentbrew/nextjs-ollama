'use client';

import React, {
  useState,
  useCallback,
  FormEvent,
  useRef,
  useEffect,
} from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import remarkGfm from 'remark-gfm';
import { api } from '@/../convex/_generated/api';
import useChatStore, { ChatStore } from '@/app/hooks/useChatStore';
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { Button } from '@/components/ui/button';
import {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
} from '@/components/ui/chat/expandable-chat';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import CodeDisplayBlock from '@/components/code-display-block';

// Dynamically import ReactMarkdown default export so TS treats it as a valid component
const Markdown = dynamic(
  () => import('react-markdown').then((mod) => mod.default as React.ComponentType<any>),
  { ssr: false }
);

export default function MiniChat() {
  const currentChatId = (useChatStore as any)(
    (state: ChatStore) => state.currentChatId,
  );
  const chatInput = (useChatStore as any)(
    (state: ChatStore) =>
      (currentChatId ? state.chatInputs[currentChatId] : '') || '',
  );
  const setChatInput = (useChatStore as any)(
    (state: ChatStore) => state.setChatInput,
  );

  const messages = useQuery(
    api.messages.listByChat,
    currentChatId ? { chatId: currentChatId } : 'skip',
  );
  const addMessageMutation = useMutation(api.messages.add);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Pre-fetch store values to avoid calling hooks inside event handlers
  const currentCoords = useChatStore((state: ChatStore) => state.coords);
  const currentEmbeddingModel = useChatStore((state: ChatStore) => state.embeddingModel);
  const selectedModel = useChatStore((state: ChatStore) => state.selectedModel);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentChatId || !chatInput.trim() || isLoading) return;

    const currentInput = chatInput;
    setChatInput(currentChatId, '');

    // Generate embedding for user message if model selected
    let userEmbedding: number[] | undefined;
    if (currentEmbeddingModel) {
      const embedRes = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentInput, embeddingModel: currentEmbeddingModel }),
      });
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        userEmbedding = embedData.embedding;
      } else {
        console.error('Error generating embedding for user message', await embedRes.text());
      }
    }

    try {
      await addMessageMutation({
        chatId: currentChatId,
        role: 'user',
        content: currentInput,
        embedding: userEmbedding,
      });
    } catch (mutationError) {
      console.error('User message mutation error:', mutationError);
      setError('Failed to send message. Please try again.');
      setChatInput(currentChatId, currentInput);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentMessagesFromConvex = messages || [];
      const messagesForApi = [
        ...currentMessagesFromConvex
          .filter((m) => m.role && m.content)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: currentInput },
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesForApi,
          embeddingModel: currentEmbeddingModel,
          coords: currentCoords,
          model: selectedModel,
          chatId: currentChatId,
        }),
      });

      if (!res.ok) {
        let errorMsg = `HTTP Error: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.error || errorData.details || errorMsg;
        } catch (jsonError) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      let assistantContent: string;
      let sources: string[] | undefined = undefined;
      let agentName: string | undefined = data.agentName || 'unknown';

      if (typeof data.result === 'string') {
        assistantContent = data.result;
        if (!data.agentName) {
          agentName = data.result.startsWith('✅ Note') ? 'notes' : 'conversational';
        }
      } else if (typeof data.result === 'object' && data.result !== null) {
        if (agentName === 'research' && data.result.searchResult) {
          assistantContent = data.result.searchResult;
          sources = data.result.sources;
        } else if (agentName === 'weather' && data.result.temperature !== undefined) {
          assistantContent = `The current weather in ${data.result.location} is ${data.result.temperature}°${data.result.unit} and ${data.result.conditions}.`;
        } else if (agentName === 'filesystem' && data.result.path && Array.isArray(data.result.entries)) {
          assistantContent = `Directory listing for ${data.result.path || '.'}:
${data.result.entries.map((e: any) => `${e.isDirectory ? '📁' : '📄'} ${e.name}`).join('\n')}`;
        } else {
          assistantContent = JSON.stringify(data.result);
        }
      } else {
        assistantContent = 'Received unexpected response format.';
        console.warn('Unexpected API response format:', data);
        agentName = 'error';
      }

      // Generate embedding for assistant message if model selected
      let assistantEmbedding: number[] | undefined;
      if (currentEmbeddingModel) {
        const embedRes2 = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: assistantContent, embeddingModel: currentEmbeddingModel }),
        });
        if (embedRes2.ok) {
          const embedData2 = await embedRes2.json();
          assistantEmbedding = embedData2.embedding;
        } else {
          console.error('Error generating embedding for assistant message', await embedRes2.text());
        }
      }

      await addMessageMutation({
        chatId: currentChatId,
        role: 'assistant',
        content: assistantContent,
        sources: sources,
        agentName: agentName,
        embedding: assistantEmbedding,
      });
    } catch (err: any) {
      console.error('[MiniChat] Submit Error:', err);
      setError(err.message || 'An error occurred');
      await addMessageMutation({
        chatId: currentChatId,
        role: 'assistant',
        content: `Error processing request: ${err.message || 'Unknown error'}`,
        agentName: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isLoading || !chatInput.trim() || !currentChatId) return;
      formRef.current?.requestSubmit();
    }
  };

  let chatBodyContent;
  if (!currentChatId) {
    chatBodyContent = (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4 text-center">
        <p>
          Click "New Chat" to start a conversation or select an existing one
          from the main sidebar.
        </p>
      </div>
    );
  } else if (messages === undefined) {
    chatBodyContent = (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Loading messages...</p>
      </div>
    );
  } else if (messages.length === 0 && !isLoading) {
    chatBodyContent = (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4 text-center">
        <p>No messages yet. How can I help you?</p>
      </div>
    );
  } else {
    chatBodyContent = (
      <ChatMessageList>
        {messages.map((message) => (
          <ChatBubble
            key={message._id}
            variant={message.role === 'user' ? 'sent' : 'received'}
          >
            <ChatBubbleAvatar
              fallback={message.role === 'user' ? '👤' : '🤖'}
            />
            <ChatBubbleMessage>
              {message.content
                .split('```')
                .map((part: string, index: number) => {
                  if (index % 2 === 0) {
                    return (
                      <Markdown key={index} remarkPlugins={[remarkGfm]}>
                        {part}
                      </Markdown>
                    );
                  } else {
                    return (
                      <pre className="pt-2" key={index}>
                        <CodeDisplayBlock code={part} />
                      </pre>
                    );
                  }
                })}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">...</div>
              )}
              {message.agentName &&
                message.agentName !== 'conversational' &&
                message.agentName !== 'unknown' &&
                message.agentName !== 'error' && (
                  <div className="mt-1 text-xs italic text-muted-foreground/80">
                    ...
                  </div>
                )}
            </ChatBubbleMessage>
          </ChatBubble>
        ))}
        {isLoading && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar fallback={'🤖'} />
            <ChatBubbleMessage isLoading>Thinking...</ChatBubbleMessage>
          </ChatBubble>
        )}
        <div ref={messagesEndRef} />
      </ChatMessageList>
    );
  }

  return (
    <ExpandableChat size="lg" position="bottom-right">
      <ExpandableChatHeader className="flex-col text-center justify-center bg-muted/60">
        <h1 className="text-xl font-semibold">Assistant Chat ✨</h1>
        <p className="text-sm text-muted-foreground">Reflecting current chat</p>
      </ExpandableChatHeader>
      <ScrollArea className="h-full w-full bg-background">
        <ExpandableChatBody className="p-0">
          {chatBodyContent}
          {error && (
            <p className="text-red-500 px-4 py-2 text-center text-xs sticky bottom-0 bg-background/90">
              {' '}
              Error: {error}{' '}
            </p>
          )}
        </ExpandableChatBody>
      </ScrollArea>
      <ExpandableChatFooter className="bg-muted/60">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex w-full items-center gap-2"
        >
          <ChatInput
            value={chatInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              currentChatId && setChatInput(currentChatId, e.target.value)
            }
            onKeyDown={onKeyDown}
            placeholder={
              currentChatId ? 'Type your message...' : 'Select a chat first'
            }
            disabled={!currentChatId || isLoading}
            className="flex-1 min-h-12 bg-background"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!currentChatId || isLoading || !chatInput.trim()}
          >
            <Send className="size-4" />
          </Button>
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}
