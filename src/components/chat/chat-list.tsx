import React from 'react';
import ChatMessage from './chat-message';
import { ChatMessageList } from '../ui/chat/chat-message-list';
import { Loader2 } from 'lucide-react';
import { DisplayMessage } from './chat';

interface ChatListProps {
  messages: DisplayMessage[];
  isLoading: boolean;
  reload?: () => Promise<void>;
}

export default function ChatList({
  messages,
  isLoading,
  reload,
}: ChatListProps) {
  return (
    <div className="flex-1 w-full overflow-y-auto relative">
      <ChatMessageList>
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isLast={index === messages.length - 1}
            isLoading={isLoading}
            reload={
              reload
                ? async () => {
                    await reload();
                  }
                : undefined
            }
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-center items-center py-2 px-4 text-sm text-muted-foreground text-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Thinking...
          </div>
        )}
      </ChatMessageList>
    </div>
  );
}
