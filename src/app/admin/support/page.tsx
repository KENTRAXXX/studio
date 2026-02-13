
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Global Support Oversight.
 * Dynamic client-side wrapper to prevent build-time Firebase initialization conflicts.
 */

const SupportOversightTerminal = dynamic(
  () => import('@/components/admin/SupportOversightTerminal').then(mod => mod.SupportOversightTerminal), 
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    )
  }
);

export default function AdminSupportPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    }>
      <SupportOversightTerminal />
    </Suspense>
  );
}
