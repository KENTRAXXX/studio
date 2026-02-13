'use client';

import { useMemo, useEffect } from 'react';
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
    ExternalLink
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

    // 2. Data Synchronization (Real-time Listeners)
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
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
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
        <div className="space-y-10 pb-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold font-headline">Welcome, {greetingName}</h1>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">{tierConfig.label} Access Active</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-primary/50 bg-slate-900/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Store Status</CardTitle>
                        <Store className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", storeData?.status === 'Live' ? 'bg-green-400 animate-ping' : 'bg-yellow-400')}></span>
                                <span className={cn("relative inline-flex rounded-full h-3 w-3", storeData?.status === 'Live' ? 'bg-green-500' : 'bg-yellow-500')}></span>
                            </span>
                            {storeData?.status || 'Draft'}
                        </div>
                         <p className="text-[10px] text-muted-foreground uppercase mt-1">Live routing active</p>
                    </CardContent>
                </Card>
                 <Card className="border-primary/50 bg-slate-900/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Yield</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{formatCurrency(Math.round(totalSales * 100))}</div>
                         <p className="text-[10px] text-muted-foreground uppercase mt-1">{orders?.length || 0} global transactions</p>
                    </CardContent>
                </Card>
                 <Card className="border-primary/50 bg-slate-900/20 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Network Clicks</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white">{storeData?.visitorCount || 0}</div>
                         <p className="text-[10px] text-muted-foreground uppercase mt-1">Unique acquisition sessions</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-8">
                    {/* Live Boutique Inventory Section */}
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
        </div>
    );
}
