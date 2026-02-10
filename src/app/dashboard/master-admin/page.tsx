'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { Loader2 } from "lucide-react";

/**
 * @fileOverview Redirection gateway for the Master Admin.
 * Ensures that any access to the legacy dashboard path is funneled to the
 * high-fidelity Executive Pulse dashboard.
 */
export default function MasterAdminPage() {
    const { userProfile, loading } = useUserProfile();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (userProfile?.userRole === 'ADMIN') {
                router.replace('/admin');
            } else {
                router.replace('/dashboard');
            }
        }
    }, [userProfile, loading, router]);

    return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}
