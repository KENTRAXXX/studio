'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from "lucide-react";

/**
 * @fileOverview Plan Selection Bridge
 * Following the "Bridge Pattern" to isolate useSearchParams() from the build worker.
 */

export const dynamic = 'force-dynamic';

const PlanSelectionContent = dynamic(
  () => import('@/components/plan-selection/PlanSelectionContent').then(mod => mod.PlanSelectionContent),
  { 
    ssr: false,
    loading: () => (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        </div>
    )
  }
);

export default function PlanSelectionPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            </div>
        }>
            <PlanSelectionContent />
        </Suspense>
    );
}
