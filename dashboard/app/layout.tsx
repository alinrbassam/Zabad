import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Zabad Seafood • Live Dashboard',
  description: 'Owner Read-Only Mobile Dashboard for Zabad POS',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Zabad Live',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f766e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-teal-500 selection:text-white">
        <main className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-xl flex flex-col relative pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}
