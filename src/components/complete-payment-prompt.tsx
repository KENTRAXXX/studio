'use client';

import { usePaystack } from '@/hooks/use-paystack';
import { useUserProfile, useFirestore } from '@/firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';

type PlanInterval = 'monthly' | 'yearly' | 'lifetime' | 'free';
type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND';

export function CompletePaymentPrompt() {
    const { userProfile } = useUserProfile();
    const firestore = useFirestore();
    const { initializePayment, isInitializing } = usePaystack();
    const { toast } = useToast();
    const router = useRouter();

    if (!userProfile || !userProfile.planTier || !userProfile.plan || !userProfile.id || !userProfile.email) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const planTier = userProfile.planTier as PlanTier;
    const interval = userProfile.plan as PlanInterval;

    const planName = {
        MERCHANT: 'Merchant',
        SCALER: 'Scaler',
        SELLER: 'Seller',
        ENTERPRISE: 'Enterprise',
        BRAND: 'Brand',
    }[planTier] || 'Plan';


    const handleRetryPayment = async () => {
        const onPaystackSuccess = async () => {
            if (firestore && userProfile.id) {
                try {
                    const userRef = doc(firestore, 'users', userProfile.id);
                    await updateDoc(userRef, { hasAccess: true });
                } catch (e) {
                    console.error("Optimistic status sync failed:", e);
                }
            }

            toast({
                title: 'Payment Confirmed',
                description: 'Finalizing your executive credentials...',
            });
            
            router.push('/backstage/return');
        };

        const onPaystackClose = () => {
            toast({
                variant: 'default',
                title: 'Activation Postponed',
                description: 'Payment is required to unlock your strategic tools.',
            });
        };

        await initializePayment({
            email: userProfile.email!,
            payment: {
                type: 'signup',
                planTier: planTier,
                interval: interval
            },
            metadata: {
                userId: userProfile.id,
                plan: interval,
                planTier: planTier,
                template: 'gold-standard',
            },
        },
        onPaystackSuccess,
        onPaystackClose
        );
    }
    
    return (
        <Card className="border-destructive bg-destructive/10 text-destructive-foreground h-full flex flex-col justify-center">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                    Strategic Access Required
                </CardTitle>
                <CardDescription className="text-destructive/80 text-base">
                    Your {planName} identity is provisioned, but the blueprint remains locked until the entrance fee is processed.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-sm leading-relaxed opacity-80">
                    SOMA acts as the central Merchant of Record. Completing this transaction authorizes your boutique instance and grants full sync permissions to the Master Catalog.
                </p>
                <Button onClick={handleRetryPayment} disabled={isInitializing} size="lg" className="w-full h-16 text-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-2xl">
                    {isInitializing ? <Loader2 className="animate-spin" /> : (
                        <>
                            <ShieldCheck className="mr-2 h-6 w-6" />
                            Secure {planName} Handshake
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
