
'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';

type UserProfile = {
  id?: string;
  email: string;
  hasAccess: boolean;
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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userDocRef);

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
