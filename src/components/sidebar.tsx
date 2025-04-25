'use client';

import { MoreHorizontal, SquarePen, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import Image from 'next/image';
import { Suspense, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserSettings from './user-settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import type { Doc } from '@/../convex/_generated/dataModel';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import useChatStore from '@/app/hooks/useChatStore';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface SidebarProps {
  isCollapsed: boolean;
  isMobile: boolean;
  context: 'chat' | 'settings';
  closeSidebar?: () => void;
}

export function Sidebar({
  isCollapsed,
  isMobile,
  context,
  closeSidebar,
}: SidebarProps) {
  const router = useRouter();
  const setCurrentChatId = (useChatStore as any)(
    (state: any) => state.setCurrentChatId,
  );
  const currentChatId = (useChatStore as any)(
    (state: any) => state.currentChatId,
  );
  const createChatMutation = useMutation(api.chats.create);

  const chats = useQuery(api.chats.listUniqueChats);

  const handleNewChat = async () => {
    try {
      const newChatId = await createChatMutation({});
      setCurrentChatId(newChatId);
      if (closeSidebar) {
        closeSidebar();
      }
    } catch (error) {
      console.error('Failed to create new chat:', error);
      toast.error('Failed to create new chat.');
    }
  };

  const handleSelectChat = (id: string) => {
    setCurrentChatId(id);
    if (closeSidebar) {
      closeSidebar();
    }
  };

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative justify-between group lg:bg-accent/20 lg:dark:bg-card/35 flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      <div className=" flex flex-col justify-between p-2 max-h-fit overflow-y-auto">
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="flex justify-between w-full h-14 text-sm xl:text-lg font-normal items-center "
        >
          <div className="flex gap-3 items-center ">
            {!isCollapsed && !isMobile && (
              <Image
                src="/ollama.png"
                alt="AI"
                width={28}
                height={28}
                className="dark:invert hidden xl:block"
              />
            )}
            New chat
          </div>
          <SquarePen size={18} className="shrink-0 w-4 h-4" />
        </Button>

        <ScrollArea className="flex flex-col pt-10 gap-2 flex-grow">
          <p className="pl-4 text-xs text-muted-foreground">Your chats</p>
          <Suspense fallback={<p>Loading chats...</p>}>
            {chats &&
              chats.map(
                (chat: { id: string; title: string; createdAt: number }) => (
                  <Button
                    key={chat.id}
                    variant={
                      chat.id === currentChatId ? 'secondaryLink' : 'ghost'
                    }
                    onClick={() => handleSelectChat(chat.id)}
                    className={cn(
                      'flex justify-between w-full h-14 text-base font-normal items-center ',
                    )}
                  >
                    <div className="flex gap-3 items-center truncate">
                      <div className="flex flex-col">
                        <span className="text-xs font-normal ">
                          {chat.title || 'Untitled Chat'}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex justify-end items-center p-1 h-auto"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={15} className="shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-32">
                        <p className="p-2 text-xs text-muted-foreground">
                          Delete disabled
                        </p>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Button>
                ),
              )}
          </Suspense>
        </ScrollArea>
      </div>

      <div className="justify-end px-2 py-2 w-full border-t">
        <UserSettings />
      </div>
    </div>
  );
}
