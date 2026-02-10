
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * @fileOverview Secure Firebase SDK Orchestrator.
 * Isolated from the main barrel file to prevent circular dependencies
 * and build-time initialization conflicts.
 */

export function initializeFirebase() {
  const isBuildEnvironment = typeof window === 'undefined' && process.env.NODE_ENV === 'production';

  if (!getApps().length) {
    let firebaseApp: FirebaseApp;
    
    try {
      // Attempt initialization via App Hosting context
      firebaseApp = initializeApp();
    } catch (e) {
      if (!isBuildEnvironment) {
        console.warn('Manual configuration fallback engaged for Firebase initialization.');
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
