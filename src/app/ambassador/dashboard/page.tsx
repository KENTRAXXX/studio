'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Ambassador Dashboard Bridge
 * Following the Bridge Pattern to isolate heavy Firebase logic from the build worker.
 */

export const dynamic = 'force-dynamic';

const AmbassadorDashboardContent = dynamic(
  () => import('@/components/ambassador/AmbassadorDashboardContent').then(mod => mod.AmbassadorDashboardContent),
  { 
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        </div>
    )
  }
);

export default function AmbassadorDashboardPage() {
  return (
    <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        </div>
    }>
      <AmbassadorDashboardContent />
    </Suspense>
  );
}
