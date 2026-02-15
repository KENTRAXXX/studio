'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useUser } from './auth/use-user';
import { useFirestore } from './provider';
import { useDoc } from './firestore/use-doc';
import { useMemoFirebase } from '../lib/use-memo-firebase';
import { getTier } from '@/lib/tiers';

type UserProfile = {
  id?: string;
  email: string;
  displayName?: string;
  professionalTitle?: string;
  bio?: string;
  showBioOnStorefront?: boolean;
  hasAccess: boolean;
  hasAcceptedTerms?: boolean;
  userRole?: 'ADMIN' | 'MOGUL' | 'SELLER';
  plan?: 'monthly' | 'yearly' | 'lifetime' | 'free';
  paidAt?: string;
  planTier?: 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND' | 'ADMIN';
  status?: 'pending_review' | 'approved' | 'rejected' | 'action_required';
  walletStatus?: 'under_review' | 'active' | 'flagged';
  completedLessons?: string[];
  isDisabled?: boolean;
  live?: boolean;
  referralCode?: string;
  referredBy?: string;
  verificationFeedback?: string;
  brandBio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  photoURL?: string;
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

    // 1. PUBLIC ROUTE WHITELIST
    const isPublicRoute = 
      pathname === '/' || 
      pathname === '/login' ||
      pathname.startsWith('/signup') || 
      pathname.startsWith('/plan-selection') || 
      pathname.startsWith('/store') || 
      pathname.startsWith('/brand') || 
      pathname.startsWith('/api') ||
      pathname.startsWith('/product') ||
      pathname.startsWith('/checkout') ||
      pathname === '/payout-confirmed' ||
      pathname === '/access-denied';
      
    const isLegalPage = pathname.startsWith('/legal');
    const isReturnPage = pathname === '/backstage/return';
    
    // Shared support path for both portals
    const isSupportRoute = pathname === '/backstage/concierge';

    // 2. AUTH GUARD
    if (!user && !isPublicRoute && !isLegalPage) {
      router.push('/');
      return;
    }

    if (userProfile) {
       // 3. ACCOUNT DISABILITY LOCK
       if (userProfile.isDisabled && pathname !== '/access-denied') {
         router.push('/access-denied');
         return;
       }

       // 4. ADMIN BYPASS
       if (userProfile.userRole === 'ADMIN') {
           if (pathname.startsWith('/dashboard') || pathname.startsWith('/backstage')) {
               router.push('/admin');
           }
           return;
       }
      
       // 5. SUBSCRIPTION & PAYMENT GATELOCK
       if (!userProfile.hasAccess && !isPublicRoute && !isLegalPage && !isReturnPage) {
           const tier = getTier(userProfile.planTier);
           const portalRoot = `/${tier.portal}`;
           if (pathname !== portalRoot) {
               router.push(portalRoot);
               return;
           }
       }

       // 6. PORTAL SENTINEL: HARD RBAC ISOLATION
       const tierConfig = getTier(userProfile.planTier);
       const isAtCorrectPortal = pathname.startsWith(`/${tierConfig.portal}`);
       
       if (userProfile.hasAccess && !isAtCorrectPortal && !isPublicRoute && !isLegalPage && !isReturnPage && !isSupportRoute) {
           router.push(`/${tierConfig.portal}`);
           return;
       }

       // 7. TERMS GATELOCK
       if (userProfile.hasAcceptedTerms === false && !isLegalPage && !isPublicRoute && !isReturnPage) {
         router.push('/legal/terms');
         return;
       }

       // 8. STATUS GUARD (Supplier Verification Queue)
       if (userProfile.status === 'pending_review' && !isReturnPage && !isPublicRoute && !isLegalPage) {
          const isAtPendingPage = pathname === '/backstage/pending-review';
          if (!isAtPendingPage) {
              router.push('/backstage/pending-review');
          }
          return;
       }
    }

  }, [user, userLoading, userProfile, profileLoading, pathname, router]);

  const value = useMemo(() => ({
    userProfile: userProfile ? { ...userProfile, id: user?.uid } : null,
    loading: userLoading || profileLoading,
  }), [userProfile, userLoading, profileLoading, user]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
        <UserProfileContext.Provider value={value}>
        {children}
        </UserProfileContext.Provider>
    </div>
  );
}

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};