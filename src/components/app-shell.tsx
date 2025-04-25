'use client';

import { useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for shallow routing
import { IconSidebar } from './icon-sidebar'; // Assuming this is the correct path
import ChatView from './views/chat-view';
import SettingsView from './views/settings-view';
import MiniChat from '@/components/chat/mini-chat';
// Import other views as needed (e.g., DashboardView)

// Define the possible views
export type View = 'chat' | 'settings' | 'dashboard'; // Add other views here

interface AppShellProps {
  children?: ReactNode; // Accept children, although we might not use them directly
}

export default function AppShell({ children }: AppShellProps) {
  const [activeView, setActiveView] = useState<View>('chat'); // Default view
  // Log activeView on change for debugging
  useEffect(() => {
    console.log('[AppShell] activeView changed to:', activeView);
  }, [activeView]);

  const router = useRouter();

  // Handler for navigation clicks from the sidebar
  const handleNavigate = (view: View) => {
    console.log('[AppShell] navigate to:', view);
    setActiveView(view);
    // Optional: Update URL with shallow routing
    // router.push(`/${view}`, undefined, { shallow: true }); // Adjust path as needed
    console.log(`Navigating to: ${view}`);
  };

  // Function to render the active view component
  const renderActiveView = () => {
    switch (activeView) {
      case 'chat':
        // Pass necessary props if ChatView needs them (e.g., initialChatId from URL if handling deep links)
        return <ChatView />;
      case 'settings':
        return <SettingsView />;
      // case 'dashboard':
      //   return <DashboardView />;
      default:
        return <div>Unknown View</div>; // Fallback
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Pass the navigation handler to the sidebar */}
      <IconSidebar onNavigate={handleNavigate} currentView={activeView} />

      {/* Render the currently active view */}
      <main className="flex-1 overflow-auto bg-background">
        {renderActiveView()}
        {/* Note: The {children} prop from RootLayout is available here if needed,
            but typically the AppShell controls the main content area directly. */}
        {/* {children} */}
      </main>
      {/* Show persistent MiniChat on all pages except the main chat view */}
      {/* {activeView != 'chat' && <MiniChat />} */}
    </div>
  );
}
