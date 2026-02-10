'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Global Support Oversight Wrapper.
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

export default function AdminGlobalSupport() {
    return <GlobalSupportContent />;
}