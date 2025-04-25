// @ts-nocheck
'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import SpeechInitializer from './speech-initializer';

interface MainLayoutProps {
  children: React.ReactNode;
  chatId?: string; // Current chat ID for highlighting
  sidebarContext?: 'chat' | 'settings' | 'notes'; // Determine sidebar content
}

export function MainLayout({
  children,
  chatId = '',
  sidebarContext = 'chat', // Default to chat context
}: MainLayoutProps) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full items-stretch flex-1"
    >
      <ResizablePanel
        defaultSize={20}
        maxSize={30}
        minSize={15}
        className="hidden lg:block"
      >
        <Sidebar
          chatId={chatId}
          context={sidebarContext}
          isMobile={false}
          isCollapsed={false}
        />
      </ResizablePanel>
      <ResizableHandle withHandle className="hidden lg:flex" />
      <ResizablePanel defaultSize={80}>
        <SpeechInitializer />
        {children}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
