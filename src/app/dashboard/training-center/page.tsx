'use client';

import dynamic from 'next/dynamic';
import { Loader2, GraduationCap } from 'lucide-react';

/**
 * @fileOverview Executive Training Center Gateway.
 * Uses dynamic import with SSR disabled to prevent build-time Firebase initialization errors.
 */

const TrainingCenterContent = dynamic(
  () => import('@/components/dashboard/TrainingCenterContent').then(mod => mod.TrainingCenterContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }
);

export default function TrainingCenterPage() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline uppercase tracking-tight">Mogul Academy</h1>
                </div>
            </div>
            <TrainingCenterContent />
        </div>
    );
}
