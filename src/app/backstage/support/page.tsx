'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Boutique Support Terminal Wrapper.
 * Uses dynamic import with SSR disabled to prevent build-time Firebase initialization errors.
 * All UI and logic are isolated within the dynamic component.
 */

const SupportPortalContent = dynamic(
  () => import('@/components/backstage/SupportPortalContent').then(mod => mod.SupportPortalContent),
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

export default function BackstageSupportPage() {
    return <SupportPortalContent />;
}
