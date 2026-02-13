
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview SOMA Executive Provisioning (Thin Shell)
 * Enforces Nuclear Isolation Strategy to prevent build-time hydration bailouts.
 */

export const dynamic = 'force-dynamic';

const SignUpFormContent = dynamic(
  () => import('@/components/signup/SignUpFormContent'),
  { 
    ssr: false,
    loading: () => (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        </div>
    )
  }
);

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black gold-mesh-gradient p-4 sm:p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-headline mt-4 text-white tracking-tight">Executive Provisioning</h1>
        <p className="mt-2 text-lg text-muted-foreground">Synchronize your identity with the SOMA ecosystem.</p>
      </div>
      <Suspense fallback={null}>
         <SignUpFormContent />
      </Suspense>
    </div>
  );
}
