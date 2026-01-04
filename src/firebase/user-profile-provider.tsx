
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
  plan?: 'monthly' | 'lifetime';
  paidAt?: string;
  planTier?: 'MERCHANT' | 'MOGUL' | 'SCALER' | 'SELLER' | 'ENTERPRISE';
  completedLessons?: string[];
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
    const isLoginPage = pathname.startsWith('/signup') || pathname.startsWith('/plan-selection') || pathname === '/';
    const isLegalPage = pathname.startsWith('/legal');
    
    // If we have a user profile and they haven't accepted the terms,
    // and they are not already on the legal page or a public/login page, redirect them.
    if (userProfile && userProfile.hasAcceptedTerms === false && !isLegalPage && !isLoginPage) {
      router.push('/legal/terms');
    }
  }, [userProfile, pathname, router]);

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
