'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useUserProfile } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Loader2, Crown, Rocket } from 'lucide-react';
import SomaLogo from '@/components/logo';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function BackstageReturnPage() {
  const { user, loading: userLoading } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [statusMessage, setStatusMessage] = useState('Verifying payment integrity...');
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Determine the friendly label for the user's role
  const tierLabel = useMemo(() => {
    if (!userProfile) return 'Mogul';
    if (userProfile.userRole === 'ADMIN') return 'Administrator';
    if (userProfile.planTier === 'BRAND') return 'Brand';
    if (userProfile.planTier === 'SELLER') return 'Seller';
    return 'Mogul';
  }, [userProfile]);

  useEffect(() => {
    if (userLoading || !user || !firestore) return;

    const userRef = doc(firestore, 'users', user.uid);
    
    // Listen for real-time updates to the hasAccess field
    const unsubscribe = onSnapshot(
      userRef, 
      (snapshot) => {
        const data = snapshot.data();
        if (data?.hasAccess) {
          setIsFinalizing(true);
          setStatusMessage(`${tierLabel} access granted. Welcome to the elite.`);
          
          // Trigger gold confetti celebration
          const duration = 3 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval: any = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
              return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
              colors: ['#DAA520', '#FFD700', '#F0E68C'],
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
              colors: ['#DAA520', '#FFD700', '#F0E68C'],
            });
          }, 250);

          // Redirect to appropriate dashboard based on role/tier
          let destination = '/dashboard';
          if (data.userRole === 'ADMIN') {
              destination = '/admin';
          } else if (data.planTier === 'SELLER' || data.planTier === 'BRAND') {
              destination = '/backstage';
          }

          setTimeout(() => {
            router.push(destination);
          }, 3000);
        } else {
            // Progress simulation for better UX
            setTimeout(() => setStatusMessage(`Finalizing your ${tierLabel} status...`), 2000);
            setTimeout(() => setStatusMessage('Syncing Master Catalog permissions...'), 4000);
        }
      },
      async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'get',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      }
    );

    return () => unsubscribe();
  }, [user, userLoading, firestore, router, tierLabel, userProfile]);

  const isLoading = userLoading || profileLoading;

  if (isLoading && !isFinalizing) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black gold-mesh-gradient text-white p-4">
      <div className="flex items-center gap-2 mb-12">
        <SomaLogo className="h-10 w-10 text-primary" />
        <span className="font-headline text-3xl font-bold text-primary tracking-widest">SOMA</span>
      </div>

      <div className="relative flex flex-col items-center max-w-md w-full text-center">
        <AnimatePresence mode="wait">
          {!isFinalizing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-8"
            >
              <div className="relative">
                <motion.div
                  className="h-32 w-32 rounded-full border-4 border-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-0 h-32 w-32 rounded-full border-4 border-dashed border-primary/60"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Crown className="h-12 w-12 text-primary animate-pulse" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-3xl font-bold font-headline text-primary">Provisioning Access</h1>
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-lg font-medium">{statusMessage}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-primary/10 rounded-full p-6 w-fit mx-auto border border-primary/30">
                <Rocket className="h-16 w-16 text-primary" />
              </div>
              <h1 className="text-4xl font-bold font-headline text-primary drop-shadow-lg">Access Finalized</h1>
              <p className="text-xl text-muted-foreground tracking-wide">Redirecting to your Dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-xs uppercase tracking-widest text-primary/40 font-semibold">SOMA Strategic Assets Group</p>
      </div>
    </div>
  );
}