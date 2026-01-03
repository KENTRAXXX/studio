'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

type SignUpCredentials = {
  email: string;
  password: string;
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
      await setDoc(userDocRef, {
        email: user.email,
        hasAccess: false,
      });

      options?.onSuccess?.(userCredential);
    } catch (err: any) {
      setError(err);
      options?.onError?.(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, error };
}
