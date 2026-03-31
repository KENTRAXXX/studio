'use client';

import { useState, useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Branded Boutique Contact Gateway.
 * Applied "Hard-Kill" Isolation to break build-time circular dependencies.
 */

export const dynamic = 'force-dynamic';

export default function ContactPage() {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    // Only import the component once we are safely in the browser
    import('@/components/store/ContactFormContent').then((mod) => {
      setComponent(() => mod.ContactFormContent);
    });
  }, []);

  if (!Component) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <Component />
    </Suspense>
  );
}
