'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

type SignUpCredentials = {
  email: string;
  password: string;
  planTier: string;
  plan: 'monthly' | 'lifetime' | 'free';
};

type UseSignUpOptions = {
  onSuccess?: (userCredential: UserCredential) => void;
  onError?: (error: Error) => void;
};

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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const userRole = credentials.planTier === 'SELLER' ? 'SELLER' : 'MOGUL';

      await setDoc(userDocRef, {
        email: user.email,
        hasAccess: false,
        userRole: userRole,
        planTier: credentials.planTier,
        plan: credentials.plan,
      });

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
