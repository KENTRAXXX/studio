'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs, increment, updateDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

type SignUpCredentials = {
  fullName: string;
  email: string;
  password: string;
  planTier: 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND' | 'ADMIN' | 'AMBASSADOR';
  plan: 'monthly' | 'yearly' | 'lifetime' | 'free';
  referralCode?: string;
  // Metadata & Role specific
  phoneNumber?: string;
  storeName?: string;
  desiredSubdomain?: string;
  niche?: string;
  ambassadorCode?: string;
  socialHandle?: string;
  targetAudience?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  governmentId?: string;
  metadata?: any;
};

type UseSignUpOptions = {
  onSuccess?: (userCredential: UserCredential) => void;
  onError?: (error: Error) => void;
};

function generateReferralCode(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useSignUp() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (
    credentials: SignUpCredentials,
    options?: UseSignUpOptions
  ) => {
    if (!auth || !firestore) {
      const err = new Error('Firebase not initialized');
      setError(err);
      options?.onError?.(err);
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      let referredBy: string | null = null;
      if (credentials.referralCode) {
        const referralQuery = query(collection(firestore, 'users'), where('referralCode', '==', credentials.referralCode.toUpperCase()));
        const querySnapshot = await getDocs(referralQuery);
        if (!querySnapshot.empty) {
            referredBy = querySnapshot.docs[0].id;
            // Record the successful lead conversion for the ambassador
            const referrerRef = doc(firestore, 'users', referredBy);
            await updateDoc(referrerRef, {
                "ambassadorData.referralSignups": increment(1)
            }).catch(console.error);
        }
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      
      // Determine Role
      let userRole: 'ADMIN' | 'SELLER' | 'MOGUL' | 'AMBASSADOR';
      if (credentials.planTier === 'ADMIN') {
        userRole = 'ADMIN';
      } else if (credentials.planTier === 'AMBASSADOR') {
        userRole = 'AMBASSADOR';
      } else if (credentials.planTier === 'SELLER' || credentials.planTier === 'BRAND') {
        userRole = 'SELLER';
      } else {
        userRole = 'MOGUL';
      }
      
      const isFreeTier = (credentials.planTier === 'SELLER' && credentials.plan === 'free') || credentials.planTier === 'ADMIN' || credentials.planTier === 'AMBASSADOR';

      // Default status mapping
      const statusMap = {
          ADMIN: 'approved',
          MOGUL: 'approved',
          MERCHANT: 'approved',
          SCALER: 'approved',
          ENTERPRISE: 'approved',
          SELLER: 'pending_review',
          BRAND: 'pending_review',
          AMBASSADOR: 'approved'
      };

      const newUserProfile: any = {
        fullName: credentials.fullName,
        email: user.email,
        hasAccess: isFreeTier,
        hasAcceptedTerms: false,
        userRole: userRole,
        planTier: credentials.planTier,
        plan: credentials.plan,
        referralCode: credentials.ambassadorCode?.toUpperCase() || generateReferralCode(6),
        status: statusMap[credentials.planTier as keyof typeof statusMap] || 'approved',
        createdAt: new Date().toISOString(),
        systemMetadata: credentials.metadata || {},
      };

      if (referredBy) {
        newUserProfile.referredBy = referredBy;
        newUserProfile.referralStatus = 'pending';
      }

      // Add role specific data
      if (userRole === 'AMBASSADOR') {
          newUserProfile.ambassadorData = {
              socialHandle: credentials.socialHandle || '',
              targetAudience: credentials.targetAudience || '',
              governmentId: credentials.governmentId || '',
              payoutDetails: {
                  bankName: credentials.bankName || '',
                  accountNumber: credentials.accountNumber || '',
                  accountHolderName: credentials.accountHolderName || ''
              },
              referralClicks: 0,
              referralSignups: 0
          };
      } else {
          newUserProfile.businessData = {
              phoneNumber: credentials.phoneNumber || '',
              storeName: credentials.storeName || '',
              desiredSubdomain: credentials.desiredSubdomain || '',
              niche: credentials.niche || 'Luxury'
          };
      }

      await setDoc(userDocRef, newUserProfile);

      options?.onSuccess?.(userCredential);
      return userCredential;
    } catch (err: any) {
      setError(err);
      options?.onError?.(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, error };
}
