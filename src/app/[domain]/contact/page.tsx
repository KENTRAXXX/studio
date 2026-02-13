
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Branded Boutique Contact Gateway.
 * Refactored with 'ssr: false' to ensure build-time stability.
 */

const ContactFormContent = dynamic(
  () => import('@/components/store/ContactFormContent').then(mod => mod.ContactFormContent), 
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    )
  }
);

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    }>
      <ContactFormContent />
    </Suspense>
  );
}
