'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Boutique Support Terminal Gateway.
 * Applied "Nuclear" Isolation and force-dynamic to resolve Vercel build failures.
 */

const SupportDashboard = dynamic(
  () => import('@/components/backstage/SupportDashboard').then(mod => mod.SupportDashboard), 
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    )
  }
);

export const dynamic = 'force-dynamic';

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    }>
      <SupportDashboard />
    </Suspense>
  );
}
