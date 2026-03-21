'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { doc, DocumentReference } from 'firebase/firestore';
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
  entityType?: 'INDIVIDUAL' | 'BUSINESS';
  businessRole?: 'OWNER' | 'OPERATIONS' | 'ANALYST' | 'FINANCE' | 'MARKETING';
  parentId?: string; // Links seat members to their primary Business account 
  paidAt?: string;
  planTier?: 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND' | 'ADMIN' | 'AMBASSADOR';
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
  twoFactorEnabled?: boolean;
  twoFactorMethod?: 'authenticator' | 'email';
  totpSecret?: string;
  tempEmailOtpExpiry?: number;
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
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [firestore, user]);

  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(userDocRef);

  const parentDocRef = useMemoFirebase(() => {
    if (!firestore || !userProfile?.parentId) return null;
    return doc(firestore, 'users', userProfile.parentId) as DocumentReference<UserProfile>;
  }, [firestore, userProfile?.parentId]);

  const { data: parentProfile, loading: parentLoading } = useDoc<UserProfile>(parentDocRef);

  // Inherit properties from parent if this is a seat member
  const compositeProfile = useMemo(() => {
    if (!userProfile) return null;
    if (!userProfile.parentId || !parentProfile) return { ...userProfile, id: user?.uid };
    
    return {
      ...userProfile,
      id: user?.uid,
      // Inherit business-wide properties
      planTier: parentProfile.planTier,
      plan: parentProfile.plan,
      hasAccess: parentProfile.hasAccess,
      // Retain individual properties
      // status (KYC) is individual
      // businessRole is individual (assigned by owner)
    };
  }, [userProfile, parentProfile, user]);

  const loading = userLoading || profileLoading || (!!userProfile?.parentId && parentLoading);

  useEffect(() => {
    if (loading) return;
    const profile = compositeProfile;

    // 1. PUBLIC ROUTE WHITELIST
    const isPublicRoute = 
      pathname === '/' || 
      pathname === '/login' ||
      pathname.startsWith('/signup') || 
      pathname.startsWith('/plan-selection') || 
      pathname.startsWith('/store') || 
      pathname.startsWith('/brand') || 
      pathname.startsWith('/api') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/product') ||
      pathname.startsWith('/checkout') ||
      pathname === '/payout-confirmed' ||
      pathname === '/access-denied';
      
    const isLegalPage = pathname.startsWith('/legal');
    const isCheckoutPage = pathname.startsWith('/checkout');
    const isReturnPage = pathname === '/backstage/return';
    
    // WHITELIST: Allow all users to access the support concierge
    const isSupportConcierge = pathname.startsWith('/backstage/concierge');

    // 2. AUTH GUARD: Basic presence
    if (!user && !isPublicRoute && !isLegalPage) {
      router.push('/');
      return;
    }

    if (profile) {
       // 3. ACCOUNT DISABILITY LOCK
       if (profile.isDisabled && pathname !== '/access-denied') {
         router.push('/access-denied');
         return;
       }

       // 4. ADMIN BYPASS
       if (profile.userRole === 'ADMIN') {
           if (pathname.startsWith('/dashboard') || pathname.startsWith('/backstage')) {
               router.push('/admin');
           }
           return;
       }
      
       // 5. SUBSCRIPTION & PAYMENT GATELOCK
       if (!profile.hasAccess && !isPublicRoute && !isLegalPage && !isReturnPage) {
           const tier = getTier(profile.planTier);
           const portalRoot = `/${tier.portal}`;
           if (pathname !== portalRoot) {
               router.push(portalRoot);
               return;
           }
       }

       // 6. PORTAL SENTINEL: HARD RBAC ISOLATION
       const tierConfig = getTier(profile.planTier);
       const isAtCorrectPortal = pathname.startsWith(`/${tierConfig.portal}`);
       
       if (profile.hasAccess && !isAtCorrectPortal && !isPublicRoute && !isLegalPage && !isReturnPage && !isSupportConcierge) {
           if (typeof window !== 'undefined') {
               sessionStorage.removeItem('soma_just_launched');
           }
           router.push(`/${tierConfig.portal}`);
           return;
       }

       // 7. TERMS GATELOCK
       if (profile.hasAcceptedTerms === false && !isLegalPage && !isPublicRoute && !isReturnPage) {
         router.push('/legal/terms');
         return;
       }

       // 8. STATUS GUARD (Identity & Supplier Verification Queue)
       // Seats must be 'approved' just like Owners
       if (profile.status === 'pending_review' && !isReturnPage && !isPublicRoute && !isLegalPage) {
          const isAtPendingPage = pathname === '/backstage/pending-review';
          if (!isAtPendingPage) {
              router.push('/backstage/pending-review');
          }
          return;
       }
    }

  }, [user, loading, compositeProfile, pathname, router]);

  const value = useMemo(() => ({
    userProfile: compositeProfile,
    loading,
  }), [compositeProfile, loading]);

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
