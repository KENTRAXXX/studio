
'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';

type UserProfile = {
  id?: string;
  email: string;
  hasAccess: boolean;
  hasAcceptedTerms?: boolean;
  isAdmin?: boolean;
  plan?: 'monthly' | 'yearly' | 'lifetime' | 'free';
  paidAt?: string;
  planTier?: 'MERCHANT' | 'MOGUL' | 'SCALER' | 'SELLER' | 'ENTERPRISE';
  completedLessons?: string[];
  isDisabled?: boolean;
  referralCode?: string;
  referredBy?: string;
};

interface UserProfileContextValue {
  userProfile: UserProfile | null;
  loading: boolean;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  userProfile: null,
  loading: true,
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (profileLoading) return;

    // Public/Auth routes that don't require checks
    const isPublicRoute = pathname.startsWith('/signup') || pathname.startsWith('/plan-selection') || pathname === '/' || pathname.startsWith('/store');
    const isLegalPage = pathname.startsWith('/legal');
    const isAccessDeniedPage = pathname === '/access-denied';

    if (userProfile) {
       // 1. Check if account is disabled
       if (userProfile.isDisabled && !isAccessDeniedPage) {
         router.push('/access-denied');
         return;
       }
      
       // 2. Check if terms have been accepted
       if (userProfile.hasAcceptedTerms === false && !isLegalPage && !isPublicRoute) {
         router.push('/legal/terms');
         return;
       }
    }

  }, [userProfile, profileLoading, pathname, router]);

  const value = useMemo(() => ({
    userProfile: userProfile ? { ...userProfile, id: user?.uid } : null,
    loading: userLoading || profileLoading,
  }), [userProfile, userLoading, profileLoading, user]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
