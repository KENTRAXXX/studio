import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { UserProfileProvider } from '@/firebase/user-profile-provider';
import { SkipToContent } from '@/components/skip-to-content';

export const viewport: Viewport = {
  themeColor: '#DAA520',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'SomaDS | The Ultimate Design System for Luxury E-commerce',
    template: '%s | SomaDS',
  },
  description: 'Launch your luxury e-commerce empire instantly with SOMA. High-fidelity boutiques, global catalog synchronization, and integrated financial processing.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : 'https://somatoday.com'),
  keywords: ['e-commerce', 'luxury', 'dropshipping', 'design system', 'boutique', 'SOMA', 'Mogul'],
  authors: [{ name: 'SOMA Strategic Assets Group' }],
  creator: 'SOMA',
  publisher: 'SOMA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'SOMA Executive Platform',
    title: 'SomaDS | Luxury E-commerce Architecture',
    description: 'The Ultimate Design System for E-commerce.',
    images: [
      {
        url: 'https://picsum.photos/seed/soma-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'SOMA Executive Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SomaDS | Luxury E-commerce',
    description: 'Launch your luxury boutique instantly.',
    images: ['https://picsum.photos/seed/soma-og/1200/630'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="soma-platform-verification" content="true" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" crossOrigin="anonymous" />
      </head>
      <body className="font-body antialiased">
        <SkipToContent />
        <FirebaseClientProvider>
          <UserProfileProvider>
            {children}
          </UserProfileProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
