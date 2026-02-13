
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview SOMA Ambassador Command Center (Thin Shell)
 * Applies Nuclear Isolation Strategy to prevent build-time circular dependency loops.
 */

export const dynamic = 'force-dynamic';

const AmbassadorDashboardContent = dynamic(
  () => import('@/components/ambassador/AmbassadorDashboardContent'),
  { 
    ssr: false,
    loading: () => (
        <div className="flex h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        </div>
    )
  }
);

export default function AmbassadorDashboardPage() {
  return (
    <Suspense fallback={null}>
      <AmbassadorDashboardContent />
    </Suspense>
  );
}
