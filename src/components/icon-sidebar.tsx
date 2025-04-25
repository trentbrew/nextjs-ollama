'use client';

import {
  MessageSquare,
  Settings,
  HelpCircle,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import type { View } from './app-shell';

interface IconSidebarProps {
  onNavigate: (view: View) => void;
  currentView: View;
}

export function IconSidebar({ onNavigate, currentView }: IconSidebarProps) {
  return (
    <div className="flex flex-col items-center space-y-4 p-4 h-full bg-muted/50 border-r">
      {/* TODO: Add logo/branding at the top if desired */}

      <Button
        variant={currentView === 'chat' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-10 w-10"
        title="Chats"
        onClick={() => onNavigate('chat')}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      <Button
        variant={currentView === 'settings' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-10 w-10"
        title="Settings"
        onClick={() => onNavigate('settings')}
      >
        <Settings className="h-5 w-5" />
      </Button>

      <Button
        variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-10 w-10"
        title="Dashboard"
        onClick={() => onNavigate('dashboard')}
      >
        <LayoutDashboard className="h-5 w-5" />
      </Button>

      {/* Add spacer or user icon at the bottom if needed */}
      <div className="mt-auto">{/* Optional bottom content */}</div>
    </div>
  );
}
