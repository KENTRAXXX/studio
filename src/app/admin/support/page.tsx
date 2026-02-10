'use client';

import dynamic from 'next/dynamic';
import { Loader2, Headset } from 'lucide-react';

/**
 * @fileOverview Global Support Oversight.
 * Uses dynamic import with SSR disabled to prevent build-time Firebase initialization errors.
 */

const GlobalSupportContent = dynamic(
  () => import('@/components/admin/GlobalSupportContent').then(mod => mod.GlobalSupportContent),
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

export default function AdminGlobalSupport() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
                        <Headset className="h-8 w-8" />
                        Global Support Oversight
                    </h1>
                    <p className="text-muted-foreground mt-1">Platform-wide telemetry for boutique client inquiries.</p>
                </div>
            </header>
            <GlobalSupportContent />
        </div>
    );
}
