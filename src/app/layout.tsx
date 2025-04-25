import './globals.css';
import { ReactNode } from 'react';
import { ThemeProvider } from '@/providers/theme-provider'; // Adjusted path
import { ConvexClientProvider } from '@/providers/convex-client-provider'; // Adjusted path
import AppShell from '@/components/app-shell';
import { Toaster } from '@/components/ui/sonner'; // Added Toaster here for global scope

// Define metadata if needed, though it can also live in AppShell or specific views
// export const metadata = {
//   title: 'App Name',
//   description: 'A persistent, seamless user experience',
// };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning><body>
      {/* Wrap providers around AppShell */}
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <ConvexClientProvider>
          {/* AppShell will now manage rendering the correct view, including children from routes if necessary, though often children might not be used directly here */}
          <AppShell>{children}</AppShell>
          {/* Passing children, though AppShell might ignore them initially */}
          <Toaster /> {/* Global Toaster */}
        </ConvexClientProvider>
      </ThemeProvider>
    </body></html>
  );
}
