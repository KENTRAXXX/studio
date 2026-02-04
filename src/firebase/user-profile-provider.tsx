'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useUser } from './auth/use-user';
import { useFirestore } from './provider';
import { useDoc } from './firestore/use-doc';
import { useMemoFirebase } from '../lib/use-memo-firebase';

type UserProfile = {
  id?: string;
  email: string;
  displayName?: string;
  hasAccess: boolean;
  hasAcceptedTerms?: boolean;
  userRole?: 'ADMIN' | 'MOGUL' | 'SELLER';
  plan?: 'monthly' | 'yearly' | 'lifetime' | 'free';
  paidAt?: string;
  planTier?: 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND';
  status?: 'pending_review' | 'approved' | 'rejected' | 'action_required';
  completedLessons?: string[];
  isDisabled?: boolean;
  referralCode?: string;
  referredBy?: string;
  verificationFeedback?: string;
  brandBio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  socialLinks?: {
    instagram?: string;
    x?: string;
  };
  preferences?: {
    emailOnNewSales?: boolean;
    emailOnConciergeReplies?: boolean;
    weeklyPerformanceReports?: boolean;
  };
  verificationData?: {
    legalBusinessName: string;
    warehouseAddress: string;
    structuredAddress?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    taxId: string;
    contactPhone: string;
    governmentIdUrl: string;
    isPhoneVerified: boolean;
    feedback?: string;
  };
  legalAgreements?: {
    termsAccepted: boolean;
    acceptedAt: any;
    termsVersion: string;
  };
  termsAcceptedAt?: any;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    iban?: string;
    swiftBic?: string;
  };
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
    if (userLoading || profileLoading) return;

    // Routes that are accessible without being logged in
    const isPublicRoute = 
      pathname === '/' || 
      pathname === '/login' ||
      pathname.startsWith('/signup') || 
      pathname.startsWith('/plan-selection') || 
      pathname.startsWith('/store') || 
      pathname.startsWith('/api');
      
    const isLegalPage = pathname.startsWith('/legal');
    const isAccessDeniedPage = pathname === '/access-denied';
    const isPendingReviewPage = pathname === '/backstage/pending-review';
    const isReturnPage = pathname === '/backstage/return';

    // 1. AUTH GUARD: If not logged in and not on a public or legal route, redirect to home
    if (!user && !isPublicRoute && !isLegalPage) {
      router.push('/');
      return;
    }

    if (userProfile) {
       // 2. Check if account is disabled
       if (userProfile.isDisabled && !isAccessDeniedPage) {
         router.push('/access-denied');
         return;
       }
      
       // 3. Check if terms have been accepted (bypass for Admins)
       if (userProfile.userRole !== 'ADMIN' && userProfile.hasAcceptedTerms === false && !isLegalPage && !isPublicRoute && !isPendingReviewPage && !isReturnPage) {
         router.push('/legal/terms');
         return;
       }

       // 4. Status Guard: If pending review, lock to the status page
       const isDashboardOrBackstage = pathname.startsWith('/dashboard') || pathname.startsWith('/backstage');
       if (userProfile.status === 'pending_review' && isDashboardOrBackstage && !isPendingReviewPage && !isPublicRoute && !isLegalPage && !isReturnPage) {
          router.push('/backstage/pending-review');
          return;
       }
    }

  }, [user, userLoading, userProfile, profileLoading, pathname, router]);

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
