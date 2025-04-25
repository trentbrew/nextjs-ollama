'use client';

import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '../ui/button';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { Sidebar } from '../sidebar';

interface ChatTopbarProps {
  isLoading: boolean;
  chatId?: string;
}

export default function ChatTopbar({ isLoading, chatId }: ChatTopbarProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const handleCloseSidebar = () => {
    setSheetOpen(false);
  };

  return (
    <div className="w-full flex px-4 py-6 items-center justify-between">
      <div className="flex items-center">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger>
            <HamburgerMenuIcon className="lg:hidden w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left">
            <Sidebar
              chatId={chatId || ''}
              isCollapsed={false}
              isMobile={false}
              closeSidebar={handleCloseSidebar}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center">
        {/* Keep this div for alignment if needed, or for other topbar buttons */}
      </div>
    </div>
  );
}
