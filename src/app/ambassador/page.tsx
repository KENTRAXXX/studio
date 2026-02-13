'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Ambassador Landing Bridge
 * Following the Bridge Pattern to isolate landing page visuals from build logic.
 */

export const dynamic = 'force-dynamic';

const AmbassadorLandingContent = dynamic(
  () => import('@/components/ambassador/AmbassadorLandingContent').then(mod => mod.AmbassadorLandingContent),
  { 
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-black">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        </div>
    )
  }
);

export default function AmbassadorLandingPage() {
  return (
    <Suspense fallback={null}>
      <AmbassadorLandingContent />
    </Suspense>
  );
}
