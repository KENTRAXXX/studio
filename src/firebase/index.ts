'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // Guard for serverless build environments where environment variables might be missing
  const isBuildEnvironment = typeof window === 'undefined' && process.env.NODE_ENV === 'production';

  if (!getApps().length) {
    let firebaseApp: FirebaseApp;
    
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      // In build environments, this will likely fail and fall back to the config object
      firebaseApp = initializeApp();
    } catch (e) {
      if (!isBuildEnvironment) {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './user-profile-provider';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
