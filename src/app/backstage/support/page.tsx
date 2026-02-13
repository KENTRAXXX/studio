'use client';

import { useState, useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Boutique Support Terminal Gateway.
 * Applied "Hard-Kill" Isolation to break build-time circular dependencies.
 * Components are imported inside useEffect to hide them from the server-side module graph.
 */

export const dynamic = 'force-dynamic';

export default function SupportPage() {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    // Only import the component once we are safely in the browser
    import('@/components/backstage/SupportDashboard').then((mod) => {
      setComponent(() => mod.SupportDashboard);
    });
  }, []);

  if (!Component) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
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
