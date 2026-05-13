'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile, useAuth, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePaystack } from '@/hooks/use-paystack';
import { Loader2, ShieldCheck, Lock, CreditCard, ChevronRight } from 'lucide-react';
import TradeWyseLogo from '@/components/logo';
import { getTier } from '@/lib/tiers';

export default function CheckoutPage() {
    const { userProfile, loading: profileLoading } = useUserProfile();
    const auth = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { initializePayment, isInitializing } = usePaystack();
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!profileLoading) {
            if (!userProfile) {
                router.push('/login');
                return;
            }
            if (userProfile.hasAccess) {
                router.push('/dashboard');
                return;
            }
            if (auth?.currentUser && !auth.currentUser.emailVerified) {
                router.push('/auth/verify-email');
                return;
            }
        }
    }, [userProfile, profileLoading, auth, router]);

    const handlePayment = async () => {
        if (!userProfile || !auth?.currentUser) return;

        const tier = getTier(userProfile.planTier);
        const interval = userProfile.plan || 'monthly';
        const entityType = userProfile.entityType || 'INDIVIDUAL';

        try {
            await initializePayment({
                email: userProfile.email,
                payment: {
                    type: 'signup',
                    planTier: userProfile.planTier as any,
                    interval: interval as any
                },
                metadata: {
                    userId: auth.currentUser.uid,
                    plan: interval,
                    planTier: userProfile.planTier,
                    template: 'gold-standard',
                    entityType: entityType,
                },
            }, 
            async () => {
                // Success Callback: Update Firestore
                if (firestore && auth.currentUser) {
                    const userRef = doc(firestore, 'users', auth.currentUser.uid);
                    await updateDoc(userRef, { hasAccess: true });
                }
                setIsSuccess(true);
                toast({ title: 'Payment Successful', description: 'Activation complete. Redirecting to your strategic hub.' });
                router.push('/backstage/return');
            },
            () => {
                toast({ variant: 'default', title: 'Payment Cancelled', description: 'Portal activation requires a successful transaction.' });
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Payment Initialization Failed', description: error.message });
        }
    };

    if (profileLoading || !userProfile) {
        return <div className="flex h-screen w-full items-center justify-center bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    const tier = getTier(userProfile.planTier);
    const isBusiness = userProfile.entityType === 'BUSINESS';
    const interval = (userProfile.plan || 'monthly') as 'monthly' | 'yearly';
    const basePrice = tier.price[interval] || 0;
    const surcharge = isBusiness ? (tier.businessSurcharge[interval] || 0) : 0;
    const totalAmount = basePrice + surcharge;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black gold-mesh-gradient p-4 sm:p-6">
            <div className="text-center mb-10">
                <TradeWyseLogo className="h-12 w-12 mx-auto" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-white tracking-tight uppercase">Portal Activation</h1>
                <p className="mt-2 text-lg text-muted-foreground uppercase tracking-widest text-[10px] font-black">Strategic Assets Group • Payment Gateway</p>
            </div>

            <Card className="w-full max-w-xl border-primary/30 bg-card/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-primary flex items-center gap-2">
                        <Lock className="h-6 w-6" /> Executive Checkout
                    </CardTitle>
                    <CardDescription>
                        Complete your activation to unlock the {tier.label} strategic hub.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">Subscription Strategy</p>
                                <p className="text-xl font-headline font-bold text-primary">{tier.label} Hub</p>
                                <p className="text-xs text-muted-foreground capitalize">{userProfile.plan} Billing Cycle</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">Total Due</p>
                                <p className="text-3xl font-headline font-bold text-white">
                                    ${totalAmount.toFixed(2)}
                                </p>
                                {isBusiness && surcharge > 0 && <p className="text-[10px] text-amber-500 font-bold uppercase mt-1">+ ${surcharge} Corporate Surcharge</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center justify-between px-4 py-2 bg-black/40 rounded text-[11px] border border-white/5">
                                <span className="text-muted-foreground uppercase tracking-widest font-bold">Identity Verified</span>
                                <span className="text-green-500 font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> SECURED</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2 bg-black/40 rounded text-[11px] border border-white/5">
                                <span className="text-muted-foreground uppercase tracking-widest font-bold">Email Confirmed</span>
                                <span className="text-green-500 font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> VERIFIED</span>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handlePayment} 
                        disabled={isInitializing}
                        className="w-full h-16 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest transition-all"
                    >
                        {isInitializing ? (
                            <Loader2 className="animate-spin h-6 w-6" />
                        ) : (
                            <span className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" /> Initialize Payment <ChevronRight className="h-5 w-5" />
                            </span>
                        )}
                    </Button>

                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest leading-relaxed">
                        Secure 256-bit encrypted checkout via Paystack. <br />
                        Your strategic environment will be provisioned immediately upon confirmation.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
