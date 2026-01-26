'use client';

import { usePaystack } from '@/hooks/use-paystack';
import { useUserProfile } from '@/firebase';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type PlanInterval = 'monthly' | 'yearly' | 'lifetime' | 'free';

const plans: { [key: string]: { id: string; name: string; pricing: any } } = {
    MERCHANT: { id: 'MERCHANT', name: 'Merchant', pricing: {
        monthly: { amount: 1999, planCode: process.env.NEXT_PUBLIC_MERCHANT_MONTHLY_PLAN_CODE },
        yearly: { amount: 19900, planCode: process.env.NEXT_PUBLIC_MERCHANT_YEARLY_PLAN_CODE },
    }},
    MOGUL: { id: 'MOGUL', name: 'Mogul', pricing: {
        lifetime: { amount: 50000, planCode: null }
    }},
    SCALER: { id: 'SCALER', name: 'Scaler', pricing: {
        monthly: { amount: 2900, planCode: process.env.NEXT_PUBLIC_SCALER_MONTHLY_PLAN_CODE },
        yearly: { amount: 29000, planCode: process.env.NEXT_PUBLIC_SCALER_YEARLY_PLAN_CODE },
    }},
    SELLER: { id: 'SELLER', name: 'Seller', pricing: {
        free: { amount: 0, planCode: null }
    }},
    ENTERPRISE: { id: 'ENTERPRISE', name: 'Enterprise', pricing: {
        monthly: { amount: 3333, planCode: process.env.NEXT_PUBLIC_ENTERPRISE_MONTHLY_PLAN_CODE },
        yearly: { amount: 33300, planCode: process.env.NEXT_PUBLIC_ENTERPRISE_YEARLY_PLAN_CODE },
    }},
    BRAND: { id: 'BRAND', name: 'Brand', pricing: {
        monthly: { amount: 2100, planCode: process.env.NEXT_PUBLIC_BRAND_MONTHLY_PLAN_CODE },
        yearly: { amount: 21000, planCode: process.env.NEXT_PUBLIC_BRAND_YEARLY_PLAN_CODE },
    }},
};

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

    const planTier = userProfile.planTier;
    const interval = userProfile.plan as PlanInterval;

    const selectedPlanDetails = plans[planTier] || plans.MOGUL;
    const paymentDetails = selectedPlanDetails.pricing[interval];

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
            amount: paymentDetails.amount,
            plan: paymentDetails.planCode,
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
                    {isInitializing ? <Loader2 className="animate-spin" /> : `Complete Payment for ${selectedPlanDetails.name} Plan`}
                </Button>
            </CardContent>
        </Card>
    );
}
