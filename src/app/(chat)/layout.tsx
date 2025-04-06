import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import SpeechInitializer from '../../components/speech-initializer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ollama UI',
  description: 'Ollama chatbot web interface',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased tracking-tight ${inter.className}`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <SpeechInitializer />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
