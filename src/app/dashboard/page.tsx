
'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
    CheckCircle2, 
    Loader2, 
    Store, 
    DollarSign, 
    Users, 
    ArrowRight, 
    Rocket, 
    Sparkles, 
    ShieldCheck, 
    Boxes,
    Package,
    TrendingUp,
    ExternalLink,
    Wallet,
    Clock
} from "lucide-react";
import { cn } from '@/lib/utils';
import { CompletePaymentPrompt } from '@/components/complete-payment-prompt';
import { ProvisioningLoader } from '@/components/store/provisioning-loader';
import Link from 'next/link';
import DashboardController from './dashboard-controller';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { getTier } from '@/lib/tiers';
import { formatCurrency } from '@/utils/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface DashboardOverviewProps {
    isDemo?: boolean;
    demoData?: {
        fullName: string;
        email: string;
        storeName: string;
        totalSales: number;
        netProfit: number;
        pendingWithdrawal: number;
        availableBalance: number;
        visitorCount: number;
        orderCount: number;
        planTier: string;
    };
    tierOverride?: string;
}

/**
 * @fileOverview The Executive Command Center.
 */
export default function DashboardOverviewPage(props: any) {
    // Determine if we are being called as a Page (Next.js) or a Component (Demo)
    const isDemo = props.isDemo === true;
    const demoData = props.demoData;
    const tierOverride = props.tierOverride;

    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 1. Session Protection (Bypass for Demo)
    useEffect(() => {
        if (!isDemo && !userLoading && !user && isMounted) {
            router.replace('/login');
        }
    }, [user, userLoading, isDemo, router, isMounted]);

    // 2. Data Synchronization (Real-time Listeners)
    const storeRef = useMemoFirebase(() => !isDemo && user && firestore ? doc(firestore, 'stores', user.uid) : null, [user, firestore, isDemo]);
    const { data: storeData, loading: storeLoading } = useDoc<any>(storeRef);

    const ordersRef = useMemoFirebase(() => !isDemo && user && firestore ? collection(firestore, `stores/${user.uid}/orders`) : null, [user, firestore, isDemo]);
    const { data: orders, loading: ordersLoading } = useCollection<any>(ordersRef);

    const productsRef = useMemoFirebase(() => !isDemo && user && firestore ? collection(firestore, `stores/${user.uid}/products`) : null, [user, firestore, isDemo]);
    const { data: products, loading: productsLoading } = useCollection<any>(productsRef);

    const isLoading = !isDemo && (userLoading || profileLoading || storeLoading || ordersLoading || productsLoading);
    
    // 3. Analytics Aggregation
    const totalSales = useMemo(() => {
        if (isDemo && demoData) return demoData.totalSales;
        return orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;
    }, [orders, isDemo, demoData]);

    const netProfit = useMemo(() => {
        if (isDemo && demoData) return demoData.netProfit;
        return totalSales * 0.27;
    }, [totalSales, isDemo, demoData]);

    // 4. Branded URL Resolution (Hydration Safe)
    const boutiqueUrl = useMemo(() => {
        if (!isMounted) return '#';
        if (isDemo) return '#';
        if (!storeData) return '#';

        const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
        const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
        
        if (storeData.customDomain && storeData.domainStatus === 'connected') {
            return `${protocol}//${storeData.customDomain}`;
        }
        if (storeData.slug) {
            return `${protocol}//${storeData.slug}.${rootDomain}`;
        }
        return `/store/${user?.uid}`;
    }, [storeData, user?.uid, isDemo, isMounted]);

    // PRE-HYDRATION RENDER: Avoid client-side exceptions during SSR
    if (!isMounted || (isLoading && !isDemo)) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!isDemo && !user) return null;

    // 5. ROADMAP GATE
    if (!isDemo && userProfile && !userProfile.hasAccess) {
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

    const currentPlanTier = isDemo ? (tierOverride || demoData?.planTier || 'SCALER') : userProfile?.planTier;

    // 6. Special View for Suppliers
    if (!isDemo && (currentPlanTier === 'SELLER' || currentPlanTier === 'BRAND')) {
        return <DashboardController planTier={currentPlanTier} />;
    }

    // 7. PROVISIONING STATE
    if (!isDemo && !storeData) {
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
    const tierConfig = getTier(currentPlanTier);
    const greetingName = isDemo ? (demoData?.fullName || 'Joe Jenkins') : (userProfile?.displayName || (userProfile?.email ? userProfile.email.split('@')[0] : 'Mogul'));
    const finalStoreName = isDemo ? (demoData?.storeName || 'Jenkins Tech') : (storeData?.storeName || 'Boutique');

    return (
        <div className="space-y-10 pb-20 selection:bg-primary/30">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline">Welcome, {greetingName}</h1>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">{tierConfig.label} Access Active</p>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-primary/50 bg-slate-900/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store Registry</CardTitle>
                        <Store className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white flex items-center gap-2 truncate">
                            {finalStoreName}
                        </div>
                         <p className="text-[10px] text-green-500 font-bold uppercase mt-1">Status: LIVE</p>
                    </CardContent>
                </Card>
                 <Card className="border-primary/50 bg-slate-900/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Yield</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{formatCurrency(Math.round(totalSales * 100))}</div>
                         <p className="text-[10px] text-muted-foreground uppercase mt-1">{isDemo ? (demoData?.orderCount || 842) : (orders?.length || 0)} global sales</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/50 bg-slate-900/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Profits</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(Math.round(netProfit * 100))}</div>
                         <p className="text-[10px] text-muted-foreground uppercase mt-1">Realized boutique yield</p>
                    </CardContent>
                </Card>
                 <Card className="border-primary/50 bg-slate-900/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acquisition</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{isDemo ? (demoData?.visitorCount || 12450) : (storeData?.visitorCount || 0)}</div>
                         <p className="text-[10px] text-muted-foreground uppercase mt-1">Unique visitor sessions</p>
                    </CardContent>
                </Card>
            </div>

            {isDemo && demoData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-primary/50 bg-primary/5 shadow-gold-glow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Wallet className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl font-headline flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-primary" />
                                Treasury Balance
                            </CardTitle>
                            <CardDescription>Available for immediate extraction.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="text-5xl font-bold text-white font-mono tracking-tighter">
                                {formatCurrency(Math.round(demoData.availableBalance * 100))}
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-yellow-500/60" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Withdrawal</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-yellow-500/80">{formatCurrency(Math.round(demoData.pendingWithdrawal * 100))}</span>
                            </div>
                            <Button asChild className="w-full h-14 text-lg btn-gold-glow bg-primary font-black uppercase tracking-widest">
                                <Link href="/dashboard/wallet">Manage Wallet</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="space-y-8">
                        <OnboardingChecklist />
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Strategic Context
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs text-slate-400 leading-relaxed">
                                You are viewing the <span className="text-primary font-bold">Jenkins Tech</span> architecture. 
                                This store utilizes the Scaler tier to dropship luxury tech and fine wares from the SOMA Global Catalog with a realized profit margin of ~27%.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
            
            {!isDemo && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-7 space-y-8">
                        <Card className="border-primary/50 overflow-hidden bg-slate-900/30">
                            <CardHeader className="bg-muted/30 border-b border-primary/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-headline flex items-center gap-2">
                                            <Package className="h-5 w-5 text-primary" />
                                            Boutique Inventory
                                        </CardTitle>
                                        <CardDescription>Synchronized masterpieces currently live in your store.</CardDescription>
                                    </div>
                                    <Button asChild variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold text-primary hover:bg-primary/5">
                                        <Link href="/dashboard/product-catalog">Catalog <Boxes className="ml-1 h-3 w-3" /></Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {!products || products.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                                        <div className="bg-primary/5 rounded-full p-6 border border-dashed border-primary/30">
                                            <Boxes className="h-12 w-12 text-primary/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold font-headline text-slate-300">Registry Empty</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                                                Your boutique collection is currently clear. Synchronize assets from the global registry to begin.
                                            </p>
                                        </div>
                                        <Button asChild size="lg" className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest">
                                            <Link href="/dashboard/product-catalog">
                                                Sync from Catalog <ArrowRight className="ml-2 h-5 w-5" />
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-black/20">
                                                <TableRow className="border-primary/10 hover:bg-transparent">
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Asset</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</TableHead>
                                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Retail</TableHead>
                                                    <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {products.slice(0, 5).map((product: any) => (
                                                    <TableRow key={product.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                                                        <TableCell>
                                                            <div className="relative h-10 w-10 rounded-md overflow-hidden border border-primary/20 bg-slate-950">
                                                                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover opacity-80" />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-bold text-slate-200 text-sm">{product.name}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold text-primary text-sm">
                                                            {formatCurrency(Math.round((product.suggestedRetailPrice || 0) * 100))}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 text-[9px] font-black tracking-widest h-5 px-2">
                                                                LIVE
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        {products.length > 5 && (
                                            <div className="p-4 border-t border-primary/5 text-center">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                                                    Showing 5 of {products.length} active collection items
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-5 space-y-8">
                        {!userProfile?.live && <OnboardingChecklist />}

                        <Card className="border-primary bg-primary/5 flex flex-col items-center justify-center text-center p-8 shadow-gold-glow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <ExternalLink className="h-32 w-32" />
                            </div>
                            <CardHeader className="p-0">
                                <CardTitle className="font-headline text-2xl text-white">Visual Verification</CardTitle>
                                <CardDescription className="pt-2">Your luxury storefront is accessible at the following address.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 mt-8 w-full space-y-6">
                                <div className="p-4 rounded-xl bg-black/60 border border-primary/20 font-mono text-xs text-primary truncate shadow-inner">
                                    {boutiqueUrl}
                                </div>
                                <Button asChild size="lg" className="w-full h-16 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest">
                                    <Link href={boutiqueUrl} target="_blank">
                                        Visit My Store <ExternalLink className="ml-2 h-5 w-5" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
