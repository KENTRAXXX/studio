import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { UserProfileProvider } from '@/firebase/user-profile-provider';
import { SkipToContent } from '@/components/skip-to-content';

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
