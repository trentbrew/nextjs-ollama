'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { IconSidebar } from './icon-sidebar';
import MiniChat from '@/components/chat/mini-chat';

// Define the possible views for sidebar navigation
export type View = 'chat' | 'settings' | 'notes';

interface AppShellProps {
  children?: ReactNode; // Accept children for page rendering
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine when to show MiniChat: hide on main chat route '/'
  const showMiniChat = pathname !== '/';

  // Handler for sidebar navigation: update the route
  const handleNavigate = (view: View) => {
    const path = view === 'chat' ? '/' : `/${view}`;
    // Navigate to the new route (shallow routing not supported in app-router)
    router.push(path);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar navigation */}
      <IconSidebar onNavigate={handleNavigate} currentView={
        // Derive currentView from pathname for active styling
        pathname === '/' ? 'chat' : (pathname.slice(1) as View)
      } />

      {/* Main content area */}
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>

      {/* Floating MiniChat on all pages except main chat */}
      {showMiniChat && <MiniChat />}
    </div>
  );
}
