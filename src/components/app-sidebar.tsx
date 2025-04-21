'use client';

import * as React from 'react';
import { Command, SquarePen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useChatStore } from '@/app/hooks/useChatStore';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const chats = useChatStore((state) => state.chats);
  const { setOpen } = useSidebar();

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      {...props}
    >
      {/* First sidebar - Chat list */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <button
                  onClick={() => {
                    router.push('/');
                    setOpen(true);
                  }}
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">New Chat</span>
                    <span className="truncate text-xs">Start fresh</span>
                  </div>
                  <SquarePen size={18} className="shrink-0 w-4 h-4" />
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {Object.entries(chats)
                  .sort(
                    ([, a], [, b]) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map(([id, chat]) => (
                    <SidebarMenuItem key={id}>
                      <SidebarMenuButton
                        tooltip={{
                          children: chat.messages[0]?.content || 'New Chat',
                          hidden: false,
                        }}
                        onClick={() => {
                          router.push(`/c/${id}`);
                          setOpen(true);
                        }}
                        className="px-2.5 md:px-2"
                      >
                        <span className="truncate">
                          {chat.messages[0]?.content || 'New Chat'}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>

      {/* Second sidebar - Chat details */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              Chat History
            </div>
          </div>
          <SidebarInput placeholder="Search chats..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {Object.entries(chats).map(([id, chat]) => (
                <button
                  key={id}
                  onClick={() => router.push(`/c/${id}`)}
                  className="flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-left"
                >
                  <div className="flex w-full items-center gap-2">
                    <span className="truncate">
                      {chat.messages[0]?.content || 'New Chat'}
                    </span>
                    <span className="ml-auto text-xs">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
