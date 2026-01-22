'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

type SignUpCredentials = {
  email: string;
  password: string;
  planTier: 'MERCHANT' | 'MOGUL' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND';
  plan: 'monthly' | 'yearly' | 'lifetime' | 'free';
  referralCode?: string;
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
        if (querySnapshot.empty) {
            throw new Error('Invalid referral code.');
        }
        referredBy = querySnapshot.docs[0].id;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const userRole = (credentials.planTier === 'SELLER' || credentials.planTier === 'BRAND') ? 'SELLER' : 'MOGUL';
      
      const newUserProfile: any = {
        email: user.email,
        hasAccess: false,
        hasAcceptedTerms: false,
        userRole: userRole,
        planTier: credentials.planTier,
        plan: credentials.plan,
        referralCode: generateReferralCode(6),
      };

      if (referredBy) {
        newUserProfile.referredBy = referredBy;
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
