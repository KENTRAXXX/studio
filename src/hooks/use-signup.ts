'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword, UserCredential, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs, increment, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { getTier } from '@/lib/tiers';

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
  entityType?: 'INDIVIDUAL' | 'BUSINESS';
  legalBusinessName?: string;
  taxId?: string;
  businessDocumentUrl?: string;
  governmentId?: string;
  parentId?: string;
  businessRole?: 'OWNER' | 'OPERATIONS' | 'ANALYST' | 'FINANCE' | 'MARKETING';
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
      
      // Dispatch verification email internally
      await sendEmailVerification(user).catch(console.error);

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

      // Universal KYC: All users except Admins are placed into pending_review
      const statusMap = {
          ADMIN: 'approved',
          MOGUL: 'pending_review',
          MERCHANT: 'pending_review',
          SCALER: 'pending_review',
          ENTERPRISE: 'pending_review',
          SELLER: 'pending_review',
          BRAND: 'pending_review',
          AMBASSADOR: 'pending_review'
      };

      const tierConfig = getTier(credentials.planTier);

      const newUserProfile: any = {
        fullName: credentials.fullName,
        email: user.email,
        hasAccess: isFreeTier,
        hasAcceptedTerms: false,
        userRole: userRole,
        planTier: credentials.planTier,
        plan: credentials.plan,
        aiCredits: credentials.entityType === 'BUSINESS' ? Math.floor(tierConfig.aiCreditsMonthly * 1.5) : tierConfig.aiCreditsMonthly, 
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
              governmentIdUrl: credentials.governmentId || '', 
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

      newUserProfile.entityType = credentials.entityType || 'INDIVIDUAL';
      newUserProfile.parentId = credentials.parentId || null;
      newUserProfile.businessRole = credentials.businessRole || (newUserProfile.entityType === 'BUSINESS' ? 'OWNER' : null);
      
      newUserProfile.verificationData = credentials.entityType === 'BUSINESS' ? {
          governmentIdUrl: credentials.governmentId || '',
          legalBusinessName: credentials.legalBusinessName || '',
          taxId: credentials.taxId || '',
          businessDocumentUrl: credentials.businessDocumentUrl || '',
      } : {
          governmentIdUrl: credentials.governmentId || '',
      };

      await setDoc(userDocRef, newUserProfile);

      // Mark invitation as accepted if applicable
      if (credentials.parentId) {
          const inviteQuery = query(
              collection(firestore, 'invitations'),
              where('parentId', '==', credentials.parentId),
              where('email', '==', credentials.email),
              where('status', '==', 'pending')
          );
          const inviteSnap = await getDocs(inviteQuery);
          if (!inviteSnap.empty) {
              await updateDoc(doc(firestore, 'invitations', inviteSnap.docs[0].id), {
                  status: 'accepted',
                  acceptedAt: new Date().toISOString()
              });
          }
      }

      options?.onSuccess?.(userCredential);
      return userCredential;
    } catch (err: any) {
      setError(err);
      options?.onError?.(err);
    } finally {
      setIsPending(false);
    }
  };

  const mutateWithGoogle = async (
    credentials: Omit<SignUpCredentials, 'fullName' | 'email' | 'password'>,
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
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const user = userCredential.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
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

        // Default status mapping: Ambassadors now require review for KYC/Vetting
        const statusMap = {
            ADMIN: 'approved',
            MOGUL: 'approved',
            MERCHANT: 'approved',
            SCALER: 'approved',
            ENTERPRISE: 'approved',
            SELLER: 'pending_review',
            BRAND: 'pending_review',
            AMBASSADOR: 'pending_review'
        };

        const tierConfig = getTier(credentials.planTier);

        const newUserProfile: any = {
          fullName: user.displayName || 'Google User',
          email: user.email,
          hasAccess: isFreeTier,
          hasAcceptedTerms: true,
          userRole: userRole,
          planTier: credentials.planTier,
          plan: credentials.plan,
          aiCredits: credentials.entityType === 'BUSINESS' ? Math.floor(tierConfig.aiCreditsMonthly * 1.5) : tierConfig.aiCreditsMonthly,
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
                governmentIdUrl: credentials.governmentId || '', 
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
        
        newUserProfile.entityType = credentials.entityType || 'INDIVIDUAL';
        newUserProfile.parentId = credentials.parentId || null;
        newUserProfile.businessRole = credentials.businessRole || (newUserProfile.entityType === 'BUSINESS' ? 'OWNER' : null);
        newUserProfile.verificationData = credentials.entityType === 'BUSINESS' ? {
            governmentIdUrl: credentials.governmentId || '',
            legalBusinessName: credentials.legalBusinessName || '',
            taxId: credentials.taxId || '',
            businessDocumentUrl: credentials.businessDocumentUrl || '',
        } : {
            governmentIdUrl: credentials.governmentId || '',
        };

        await setDoc(userDocRef, newUserProfile);
      }

      options?.onSuccess?.(userCredential);
      return userCredential;
    } catch (err: any) {
      setError(err);
      options?.onError?.(err);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, mutateWithGoogle, isPending, error };
}
