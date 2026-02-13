'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Executive Training Center Gateway.
 * Applied "Nuclear" Isolation fix to break build-time circular dependencies.
 * ssr: false ensures this component skips the server build process entirely.
 */

const TrainingCenterContent = dynamic(
  () => import('@/components/dashboard/TrainingCenterContent').then(mod => mod.TrainingCenterContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    )
  }
);

export const dynamic = 'force-dynamic';

export default function TrainingCenterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    }>
      <TrainingCenterContent />
    </Suspense>
  );
}
