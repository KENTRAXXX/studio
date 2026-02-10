'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Branded Boutique Contact Gateway.
 * Uses dynamic import with SSR disabled to ensure Firebase logic runs strictly on the client.
 */

const ContactFormContent = dynamic(
  () => import('@/components/store/ContactFormContent').then(mod => mod.ContactFormContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }
);

export const dynamic = 'force-dynamic';

export default function TenantContactPage() {
    return <ContactFormContent />;
}
