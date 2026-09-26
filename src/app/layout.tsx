import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'MarketLens — Live FX & Crypto Dashboard',
  description:
    'Real-time currency conversion, live cryptocurrency prices, and interactive 7-day market trend charts.',
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
  openGraph: {
    title: 'MarketLens — Live FX & Crypto Dashboard',
    description: 'Real-time FX conversion and crypto market tracking with interactive charts.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
