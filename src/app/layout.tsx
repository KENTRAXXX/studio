import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Script from 'next/script';
import { UserProfileProvider } from '@/firebase/user-profile-provider';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'SomaDS',
  description: 'The Ultimate Design System for E-commerce.',
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
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
      </head>
      <body className="font-body antialiased">
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
