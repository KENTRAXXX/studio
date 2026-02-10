'use client';

import dynamic from 'next/dynamic';
import { Loader2, MessageSquare } from 'lucide-react';
import SomaLogo from '@/components/logo';

/**
 * @fileOverview Boutique Support Terminal.
 * Uses dynamic import with SSR disabled to prevent build-time Firebase initialization errors.
 */

const SupportPortalContent = dynamic(
  () => import('@/components/backstage/SupportPortalContent').then(mod => mod.SupportPortalContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }
);

export const dynamic = 'force-dynamic';

export default function BackstageSupportPage() {
    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-12 px-4">
            <div className="text-center">
                <SomaLogo className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Executive Support Portal</h1>
                <p className="mt-2 text-lg text-muted-foreground">Manage persistent client inquiries and boutique requests.</p>
            </div>
            <SupportPortalContent />
        </div>
    );
}
