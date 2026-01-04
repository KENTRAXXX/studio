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
      // Check if user already exists
      // Note: This is a client-side check. A more secure way is with a server-side check.
      // But createUserWithEmailAndPassword handles this by throwing auth/email-already-in-use
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const user = userCredential.user;
      
      const userDocRef = doc(firestore, 'users', user.uid);
      // Create user profile but hold off on access until payment
      await setDoc(userDocRef, {
        email: user.email,
        hasAccess: false,
        userRole: 'MOGUL', // Default role for new sign-ups
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
