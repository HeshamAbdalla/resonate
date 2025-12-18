import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Layout/Navbar';
import Sidebar from '@/components/Layout/Sidebar';
import FlyonuiScript from '@/components/FlyonuiScript';
import IntersectObserver from '@/components/IntersectObserver';
import MobileDrawer, { DrawerProvider } from '@/components/Layout/MobileDrawer';
import { MessagePanelProvider } from '@/contexts/MessagePanelContext';
import MessageSidePanel from '@/components/Messages/MessageSidePanel';

export const metadata: Metadata = {
  title: {
    default: 'Resonate - Community, Clarified',
    template: '%s | Resonate',
  },
  description: 'High-signal conversations, not viral noise. Join communities where reputation matters and quality rises.',
  keywords: ['community', 'discussion', 'forum', 'social', 'conversations', 'resonate'],
  authors: [{ name: 'Resonate' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Resonate',
    title: 'Resonate - Community, Clarified',
    description: 'High-signal conversations, not viral noise. Join communities where reputation matters.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resonate - Community, Clarified',
    description: 'High-signal conversations, not viral noise. Join communities where reputation matters.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://resonate.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-base-200 min-h-screen">
        <MessagePanelProvider>
          <DrawerProvider>
            <Navbar />

            {/* Mobile Drawer */}
            <MobileDrawer>
              <Sidebar />
            </MobileDrawer>

            {/* Main Layout Shell */}
            <div className="pt-20 min-h-screen max-w-[1920px] mx-auto">
              <div className="lg:grid lg:grid-cols-[320px_1fr]">

                {/* Sidebar Column (Hidden on Mobile, Fixed on Desktop) */}
                <aside className="hidden lg:block fixed top-20 left-0 w-[320px] h-[calc(100vh-5rem)] overflow-y-auto border-r border-base-content/10 pb-10 z-30">
                  <Sidebar />
                </aside>

                {/* Sidebar Placeholder for Grid Flow */}
                <div className="hidden lg:block w-[320px]"></div>

                {/* Main Content Area */}
                <main className="px-4 pb-20 w-full">
                  <div className="w-full max-w-7xl mx-auto flex justify-center">
                    {children}
                  </div>
                </main>

              </div>
            </div>

            {/* Message Side Panel */}
            <MessageSidePanel />

            <FlyonuiScript />
            <IntersectObserver />
          </DrawerProvider>
        </MessagePanelProvider>
      </body>
    </html>
  );
}
