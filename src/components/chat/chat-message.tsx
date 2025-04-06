import React, { memo, useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from 'ai/react';
import { ChatRequestOptions } from 'ai';
import {
  CheckIcon,
  CopyIcon,
  Volume2,
  RefreshCcw,
  PauseIcon,
  PlayIcon,
} from 'lucide-react';
import { AudioLinesIcon, type AudioLinesIconHandle } from '../icons/audio';
import Image from 'next/image';
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '../ui/chat/chat-bubble';
import ButtonWithTooltip from '../button-with-tooltip';
import { Button } from '../ui/button';
import CodeDisplayBlock from '../code-display-block';
import {
  speakText,
  pauseSpeech,
  resumeSpeech,
  stopSpeech,
} from '../../utils/text-to-speech';
import { useVoiceStore } from '../../utils/voice-store';
import { FunctionCallResult } from '../function-call-result';
import { ExtendedMessage } from '../../utils/function-calling';

export type ChatMessageProps = {
  message: ExtendedMessage;
  isLast: boolean;
  isLoading: boolean | undefined;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
};

const MOTION_CONFIG = {
  initial: { opacity: 0, scale: 1, y: 20, x: 0 },
  animate: { opacity: 1, scale: 1, y: 0, x: 0 },
  exit: { opacity: 0, scale: 1, y: 20, x: 0 },
  transition: {
    opacity: { duration: 0.1 },
    layout: {
      type: 'spring',
      bounce: 0.3,
      duration: 0.2,
    },
  },
};

function ChatMessage({ message, isLast, isLoading, reload }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const { voiceSettings } = useVoiceStore();
  const audioIconRef = useRef<AudioLinesIconHandle>(null);

  // Cleanup speech on component unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        stopSpeech();
      }
    };
  }, [isSpeaking]);

  // Extract "think" content from Deepseek R1 models and clean message (rest) content
  const { thinkContent, cleanContent } = useMemo(() => {
    const getThinkContent = (content: string) => {
      const match = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
      return match ? match[1].trim() : null;
    };

    return {
      thinkContent:
        message.role === 'assistant' ? getThinkContent(message.content) : null,
      cleanContent: message.content
        .replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '')
        .trim(),
    };
  }, [message.content, message.role]);

  const contentParts = useMemo(() => cleanContent.split('```'), [cleanContent]);

  // Extract function call and result if present
  const functionCall = message.function_call;
  const functionCallResult = message.function_call_result;

  // Log when function calls are present
  useEffect(() => {
    if (functionCall && functionCallResult) {
      console.log('🎯 Message contains function call:', {
        messageId: message.id,
        functionName: functionCall.name,
        hasResult: !!functionCallResult,
      });
    }
  }, [message.id, functionCall, functionCallResult]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  const handleSpeak = async () => {
    try {
      setIsSpeaking(true);
      setIsPaused(false);
      if (audioIconRef.current) {
        audioIconRef.current.startAnimation();
      }
      await speakText(cleanContent, voiceSettings.selectedVoice);
      setIsSpeaking(false);
    } catch (error) {
      console.error('Failed to speak text:', error);
    } finally {
      if (audioIconRef.current) {
        audioIconRef.current.stopAnimation();
      }
    }
  };

  const handlePause = () => {
    pauseSpeech();
    setIsPaused(true);
    if (audioIconRef.current) {
      audioIconRef.current.stopAnimation();
    }
  };

  const handleResume = () => {
    resumeSpeech();
    setIsPaused(false);
    if (audioIconRef.current) {
      audioIconRef.current.startAnimation();
    }
  };

  const handleStop = () => {
    stopSpeech();
    setIsSpeaking(false);
    setIsPaused(false);
    if (audioIconRef.current) {
      audioIconRef.current.stopAnimation();
    }
  };

  const renderAttachments = () => (
    <div className="flex gap-2">
      {message.experimental_attachments
        ?.filter((attachment) => attachment.contentType?.startsWith('image/'))
        .map((attachment, index) => (
          <Image
            key={`${message.id}-${index}`}
            src={attachment.url}
            width={200}
            height={200}
            alt="attached image"
            className="rounded-md object-contain"
          />
        ))}
    </div>
  );

  const renderThinkingProcess = () =>
    thinkContent &&
    message.role === 'assistant' && (
      <details className="mb-2 text-sm" open>
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Thinking process
        </summary>
        <div className="mt-2 text-muted-foreground">
          <Markdown remarkPlugins={[remarkGfm]}>{thinkContent}</Markdown>
        </div>
      </details>
    );

  const renderContent = () =>
    contentParts.map((part, index) =>
      index % 2 === 0 ? (
        <Markdown key={index} remarkPlugins={[remarkGfm]}>
          {part}
        </Markdown>
      ) : (
        <pre className="whitespace-pre-wrap" key={index}>
          <CodeDisplayBlock code={part} />
        </pre>
      ),
    );

  const renderActionButtons = () =>
    message.role === 'assistant' && (
      <div className="pt-2 flex gap-1 items-center text-muted-foreground">
        {!isLoading && (
          <>
            <ButtonWithTooltip side="bottom" toolTipText="Copy">
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="icon"
                className="h-4 w-4"
              >
                {isCopied ? (
                  <CheckIcon className="w-3.5 h-3.5 transition-all" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5 transition-all" />
                )}
              </Button>
            </ButtonWithTooltip>

            {!isSpeaking ? (
              <ButtonWithTooltip side="bottom" toolTipText="Text to Speech">
                <Button
                  onClick={handleSpeak}
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                >
                  <Volume2 className="w-3.5 h-3.5 transition-all" />
                </Button>
              </ButtonWithTooltip>
            ) : isPaused ? (
              <ButtonWithTooltip side="bottom" toolTipText="Resume Speech">
                <Button
                  onClick={handleResume}
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                >
                  <PlayIcon className="w-3.5 h-3.5 transition-all text-primary" />
                </Button>
              </ButtonWithTooltip>
            ) : (
              <ButtonWithTooltip side="bottom" toolTipText="Pause Speech">
                <Button
                  onClick={handlePause}
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                >
                  <AudioLinesIcon
                    ref={audioIconRef}
                    size={32}
                    className="text-primary scale-[2]"
                  />
                </Button>
              </ButtonWithTooltip>
            )}

            {isSpeaking && (
              <ButtonWithTooltip side="bottom" toolTipText="Stop Speech">
                <Button
                  onClick={handleStop}
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                </Button>
              </ButtonWithTooltip>
            )}
          </>
        )}
        {!isLoading && isLast && (
          <ButtonWithTooltip side="bottom" toolTipText="Regenerate">
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => reload()}
            >
              <RefreshCcw className="w-3.5 h-3.5 scale-100 transition-all" />
            </Button>
          </ButtonWithTooltip>
        )}
      </div>
    );

  return (
    <motion.div
      {...MOTION_CONFIG}
      className="flex flex-col gap-2 whitespace-pre-wrap"
    >
      <ChatBubble variant={message.role === 'user' ? 'sent' : 'received'}>
        <ChatBubbleAvatar
          src={message.role === 'assistant' ? '/ollama.png' : ''}
          width={6}
          height={6}
          className="object-contain dark:invert"
          fallback={message.role === 'user' ? 'US' : ''}
        />
        <ChatBubbleMessage>
          {renderThinkingProcess()}
          {renderAttachments()}
          {renderContent()}

          {/* Display function call result if present */}
          {functionCall && functionCallResult && (
            <FunctionCallResult
              functionCall={functionCall}
              result={functionCallResult}
            />
          )}

          {renderActionButtons()}
        </ChatBubbleMessage>
      </ChatBubble>
    </motion.div>
  );
}

export default memo(ChatMessage, (prevProps, nextProps) => {
  if (nextProps.isLast) return false;
  return (
    prevProps.isLast === nextProps.isLast &&
    prevProps.message === nextProps.message
  );
});
