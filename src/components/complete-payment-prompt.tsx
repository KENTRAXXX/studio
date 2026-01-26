'use client';

import { usePaystack } from '@/hooks/use-paystack';
import { useUserProfile } from '@/firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type PlanInterval = 'monthly' | 'yearly' | 'lifetime' | 'free';
type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND';

export function CompletePaymentPrompt() {
    const { userProfile } = useUserProfile();
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
        const onPaystackSuccess = () => {
            toast({
                title: 'Payment Successful!',
                description: 'Your store is being provisioned. This may take a moment.',
            });
            const redirectPath = (planTier === 'SELLER' || planTier === 'BRAND') ? '/backstage' : '/dashboard/my-store';
            router.push(redirectPath);
        };

        const onPaystackClose = () => {
            toast({
                variant: 'default',
                title: 'Payment Incomplete',
                description: 'Your payment was not completed. You can try again at any time from your dashboard.',
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
        <Card className="border-destructive bg-destructive/10 text-destructive-foreground mt-8 max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-6 w-6" />
                    Action Required: Complete Your Payment
                </CardTitle>
                <CardDescription className="text-destructive/80">
                    Your account has been created, but your subscription is not active yet. Please complete the payment to launch your store.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleRetryPayment} disabled={isInitializing} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {isInitializing ? <Loader2 className="animate-spin" /> : `Complete Payment for ${planName} Plan`}
                </Button>
            </CardContent>
        </Card>
    );
}
