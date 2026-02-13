'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Store, DollarSign, Users, ArrowRight, Rocket, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from '@/lib/utils';
import { CompletePaymentPrompt } from '@/components/complete-payment-prompt';
import { ProvisioningLoader } from '@/components/store/provisioning-loader';
import Link from 'next/link';
import DashboardController from './dashboard-controller';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { getTier } from '@/lib/tiers';

/**
 * @fileOverview The Executive Command Center.
 * Orchestrates boutique management and platform navigation.
 */
export default function DashboardOverviewPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();

    // 1. Session Protection
    if (!userLoading && !user) {
        return null;
    }

    // 2. Data Synchronization
    const storeRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'stores', user.uid) : null, [user, firestore]);
    const { data: storeData, loading: storeLoading } = useDoc<any>(storeRef);

    const ordersRef = useMemoFirebase(() => user && firestore ? collection(firestore, `stores/${user.uid}/orders`) : null, [user, firestore]);
    const { data: orders, loading: ordersLoading } = useCollection<any>(ordersRef);

    const productsRef = useMemoFirebase(() => user && firestore ? collection(firestore, `stores/${user.uid}/products`) : null, [user, firestore]);
    const { data: products, loading: productsLoading } = useCollection<any>(productsRef);

    const isLoading = userLoading || profileLoading || storeLoading || ordersLoading || productsLoading;
    
    // 3. Analytics Aggregation
    const totalSales = useMemo(() => {
        return orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
    }, [orders]);

    // 4. Branded URL Resolution
    const boutiqueUrl = useMemo(() => {
        if (!storeData) return '#';
        if (typeof window === 'undefined') return '#';

        const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
        const protocol = window.location.protocol;
        
        if (storeData.customDomain && storeData.domainStatus === 'connected') {
            return `${protocol}//${storeData.customDomain}`;
        }
        if (storeData.slug) {
            return `${protocol}//${storeData.slug}.${rootDomain}`;
        }
        return `/store/${user?.uid}`;
    }, [storeData, user?.uid]);

    if (isLoading) {
        return null;
    }

    if (!user) return null;

    // 5. ROADMAP GATE: Show roadmap and payment prompt if access not yet secured
    if (userProfile && !userProfile.hasAccess) {
        return (
            <div className="max-w-5xl mx-auto space-y-10 py-12 px-4">
                <header className="text-center space-y-4">
                    <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20 w-fit">
                        <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold font-headline text-white tracking-tight">Initialize Your Empire</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Your strategic identity has been provisioned. Complete the financial handshake to activate your boutique's blueprint.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <OnboardingChecklist />
                    <div className="space-y-6">
                        <CompletePaymentPrompt />
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Tier Entitlement</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-slate-400">
                                You are activating the <span className="text-primary font-bold">{getTier(userProfile.planTier).label}</span> blueprint. 
                                Full access to the Global Catalog and Multi-Tenancy Engine will be granted instantly upon verification.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // 6. Special View for Suppliers (Sellers/Brands)
    if (userProfile?.planTier === 'SELLER' || userProfile?.planTier === 'BRAND') {
        return <DashboardController planTier={userProfile.planTier} />;
    }

    // 7. PROVISIONING STATE: If paid but no store yet
    if (!storeData) {
        const justLaunched = typeof window !== 'undefined' && sessionStorage.getItem('soma_just_launched') === 'true';
        
        if (justLaunched) {
            return <ProvisioningLoader />;
        }

        return (
            <div className="max-w-4xl mx-auto space-y-10 py-12">
                <header className="text-center space-y-4">
                    <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20 w-fit">
                        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold font-headline text-white tracking-tight">Roadmap to Deployment</h1>
                    <p className="text-muted-foreground text-lg max-xl mx-auto leading-relaxed">
                        Access secured. Complete the launch wizard to initialize your luxury storefront and synchronize your collection.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <OnboardingChecklist />
                    
                    <Card className="border-primary bg-primary/5 flex flex-col items-center justify-center text-center p-8 shadow-gold-glow">
                        <Rocket className="h-16 w-16 text-primary mb-6" />
                        <CardTitle className="font-headline text-2xl text-white">Activate Blueprint</CardTitle>
                        <CardContent className="p-0 mt-4 space-y-6">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Deploy your high-fidelity theme and synchronize your initial product collection from the SOMA Global Registry.
                            </p>
                            <Button asChild size="lg" className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest">
                                <Link href="/dashboard/my-store">
                                    Launch Wizard <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }
    
    // 8. FULL OPERATIONAL STATE
    const tierConfig = getTier(userProfile?.planTier);
    const greetingName = userProfile?.displayName || (userProfile?.email ? userProfile.email.split('@')[0] : 'Mogul');

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline">Welcome, {greetingName}</h1>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">{tierConfig.label} Access Active</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Store Status</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", storeData?.status === 'Live' ? 'bg-green-400 animate-ping' : 'bg-yellow-400')}></span>
                                <span className={cn("relative inline-flex rounded-full h-3 w-3", storeData?.status === 'Live' ? 'bg-green-500' : 'bg-yellow-500')}></span>
                            </span>
                            {storeData?.status || 'Draft'}
                        </div>
                         <p className="text-xs text-muted-foreground">Your storefront is currently {storeData?.status?.toLowerCase()}</p>
                    </CardContent>
                </Card>
                 <Card className="border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">${totalSales.toFixed(2)}</div>
                         <p className="text-xs text-muted-foreground">{orders?.length || 0} total orders</p>
                    </CardContent>
                </Card>
                 <Card className="border-primary/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{storeData?.visitorCount || 0}</div>
                         <p className="text-xs text-muted-foreground">Total unique visitor sessions</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {!userProfile?.live && <OnboardingChecklist />}

                <Card className="border-primary/50 flex flex-col items-center justify-center text-center p-8 bg-slate-900/20">
                    <CardTitle className="font-headline text-2xl text-white">Ready to sell?</CardTitle>
                    <CardContent className="p-0 mt-4">
                        <p className="text-muted-foreground mb-6">Visit your live storefront and verify your visual identity.</p>
                        <Button asChild size="lg" className="h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black">
                            <Link href={boutiqueUrl} target="_blank">
                                View My Store <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
