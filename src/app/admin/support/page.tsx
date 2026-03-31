'use client';

import { useState, useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Global Support Oversight Terminal.
 * Applied "Hard-Kill" Isolation to break build-time circular dependencies.
 */

export const dynamic = 'force-dynamic';

export default function AdminSupportPage() {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    // Only import the component once we are safely in the browser
    import('@/components/admin/SupportOversightTerminal').then((mod) => {
      setComponent(() => mod.SupportOversightTerminal);
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
