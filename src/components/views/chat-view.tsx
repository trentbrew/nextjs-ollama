'use client'; // ChatView needs to be a client component to use hooks

import React from 'react';
import { MainLayout } from '@/components/main-layout';
import Chat from '@/components/chat/chat'; // Import the main Chat component
import useChatStore from '@/app/hooks/useChatStore'; // Import the store to get currentChatId

export default function ChatView() {
  // Get the currently active chatId from the Zustand store
  // Use the type assertion workaround for now
  const currentChatId = (useChatStore as any)(
    (state: any) => state.currentChatId,
  );

  return (
    // Use MainLayout to provide the chat-specific sidebar/resizable structure
    // Pass the currentChatId from the store to MainLayout
    <MainLayout chatId={currentChatId || ''} sidebarContext="chat">
      {/* Render the main Chat component if a chat is selected */}
      {currentChatId ? (
        <Chat id={currentChatId} />
      ) : (
        // Optionally, render a placeholder if no chat is selected yet
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">
            Select a chat from the sidebar or create a new one.
          </p>
        </div>
      )}
    </MainLayout>
  );
}
