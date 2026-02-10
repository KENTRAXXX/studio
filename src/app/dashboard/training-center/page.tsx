import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Executive Training Center Wrapper.
 * Dynamic loading prevents static build-time initialization of Firebase services.
 */

const TrainingCenterContent = dynamic(
  () => import('@/components/dashboard/TrainingCenterContent').then(mod => mod.TrainingCenterContent),
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

export default function TrainingCenterPage() {
    return <TrainingCenterContent />;
}