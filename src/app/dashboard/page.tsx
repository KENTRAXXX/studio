
'use client';

import { useUserProfile } from '@/firebase/user-profile-provider';
import { Loader2 } from 'lucide-react';
import DashboardController from './dashboard-controller';

export default function DashboardOverview() {
    const { userProfile, loading } = useUserProfile();

    if (loading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!userProfile) {
        // This can happen briefly or if there's an error fetching the profile
        return (
             <div className="flex h-96 w-full items-center justify-center">
                <p>Could not load user profile.</p>
            </div>
        )
    }

    return <DashboardController planTier={userProfile.planTier} />;
}
