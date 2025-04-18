'use client';

import ChatTopbar from './chat-topbar';
import ChatList from './chat-list';
import ChatBottombar from './chat-bottombar';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { BytesOutputParser } from '@langchain/core/output_parsers';
import { Attachment, ChatRequestOptions, generateId } from 'ai';
import { Message, useChat } from 'ai/react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import useChatStore from '@/app/hooks/useChatStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ExtendedMessage,
  modelSupportsFunctionCalling,
} from '@/utils/function-calling';

export interface ChatProps {
  id: string;
  initialMessages: ExtendedMessage[] | [];
  isMobile?: boolean;
}

export default function Chat({ initialMessages, id, isMobile }: ChatProps) {
  const {
    messages: rawMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    setInput,
    reload,
  } = useChat({
    id,
    initialMessages,
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false);
      }
    },
    onFinish: (message) => {
      const endTime = Date.now();
      const responseTime = requestStartTime
        ? endTime - requestStartTime
        : undefined;
      setRequestStartTime(null); // Reset start time

      const savedMessages = getMessagesById(id);

      // Debug message contents for function calls
      console.log('🔍 Message received from API:', {
        messageId: message.id,
        role: message.role,
        hasContent: !!message.content,
        contentLength: message.content?.length || 0,
        hasFunctionCall: !!(message as any).function_call,
        hasFunctionResult: !!(message as any).function_call_result,
        messageKeys: Object.keys(message),
        message: message, // Include the full message in the log
      });

      // Handle the case where the message is a function call result
      // Note: This is a workaround as the Vercel AI SDK doesn't fully support function calls yet
      const extendedMessage = message as ExtendedMessage;

      // Add debug info to the assistant message
      if (extendedMessage.role === 'assistant') {
        extendedMessage.responseTime = responseTime;
        extendedMessage.modelName =
          selectedModel === null ? undefined : selectedModel; // Convert null to undefined
      }

      saveMessages(id, [...savedMessages, extendedMessage]);

      setLoadingSubmit(false);
      router.replace(`/c/${id}`);
    },
    onError: (error) => {
      setRequestStartTime(null); // Reset start time on error too
      setLoadingSubmit(false);
      router.replace('/');
      console.error(error.message);
      console.error(error.cause);
    },
  });

  // Cast messages to ExtendedMessage type
  const messages = rawMessages as ExtendedMessage[];

  const [loadingSubmit, setLoadingSubmit] = React.useState(false);
  const [requestStartTime, setRequestStartTime] = useState<number | null>(null); // Add state for start time
  const formRef = useRef<HTMLFormElement>(null);
  const base64Images = useChatStore((state) => state.base64Images);
  const setBase64Images = useChatStore((state) => state.setBase64Images);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const saveMessages = useChatStore((state) => state.saveMessages);
  const getMessagesById = useChatStore((state) => state.getMessagesById);
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.history.replaceState({}, '', `/c/${id}`);

    if (!selectedModel) {
      toast.error('Please select a model');
      return;
    }

    // Record start time before sending the request
    setRequestStartTime(Date.now());

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
    };

    setLoadingSubmit(true);

    const attachments: Attachment[] = base64Images
      ? base64Images.map((image) => ({
          contentType: 'image/base64',
          url: image,
        }))
      : [];

    // Check if the model supports function calling
    const supportsFunctionCalling = modelSupportsFunctionCalling(selectedModel);

    const requestOptions: ChatRequestOptions = {
      body: {
        selectedModel: selectedModel,
      },
      ...(base64Images && {
        data: {
          images: base64Images,
        },
        experimental_attachments: attachments,
      }),
    };

    handleSubmit(e, requestOptions);
    saveMessages(id, [...messages, userMessage]);
    setBase64Images(null);
  };

  const removeLatestMessage = () => {
    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    saveMessages(id, updatedMessages);
    return updatedMessages;
  };

  const handleStop = () => {
    stop();
    saveMessages(id, [...messages]);
    setLoadingSubmit(false);
  };

  // Add a function to test function calling capabilities
  const testFunctionCalling = () => {
    if (!selectedModel) {
      toast.error('Please select a model');
      return;
    }

    console.log('🧪 Testing function calling capabilities...');

    // Create a prompt designed to trigger function calling
    const testPrompt =
      'I need to know the current weather in San Francisco. Also, can you search for information about climate change?';

    // Set the input
    setInput(testPrompt);

    // Create a user message to submit
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: testPrompt,
    };

    // Wait for the state to update
    setTimeout(() => {
      console.log('🧪 Submitting test prompt manually...');

      setLoadingSubmit(true);

      const requestOptions: ChatRequestOptions = {
        body: {
          selectedModel: selectedModel,
        },
      };

      // Submit message using the AI SDK's handleSubmit
      handleSubmit(
        new Event('submit') as unknown as React.FormEvent<HTMLFormElement>,
        requestOptions,
      );

      // Save the message to chat history
      saveMessages(id, [...messages, userMessage]);
    }, 100);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl h-full">
      <div className="flex justify-between items-center">
        <ChatTopbar
          isLoading={isLoading}
          chatId={id}
          messages={messages}
          setMessages={setMessages}
        />
        <button
          onClick={testFunctionCalling}
          className="mr-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
          disabled={isLoading}
        >
          Test Functions
        </button>
      </div>

      {messages.length === 0 ? (
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
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
          />
        </div>
      ) : (
        <>
          <ChatList
            messages={messages}
            isLoading={isLoading}
            loadingSubmit={loadingSubmit}
            reload={async () => {
              removeLatestMessage();

              const requestOptions: ChatRequestOptions = {
                body: {
                  selectedModel: selectedModel,
                },
              };

              setLoadingSubmit(true);
              return reload(requestOptions);
            }}
          />
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
          />
        </>
      )}
    </div>
  );
}
