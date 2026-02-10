import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Boutique Support Terminal Wrapper.
 * Server Component that dynamically loads client logic to resolve build-time Firebase errors.
 */

const SupportPortalContent = dynamic(
  () => import('@/components/backstage/SupportPortalContent').then(mod => mod.SupportPortalContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }
);

export const dynamic = 'force-dynamic';

export default function BackstageSupportPage() {
    return <SupportPortalContent />;
}