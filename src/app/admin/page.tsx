'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
    collection, 
    query, 
    where, 
    collectionGroup, 
    orderBy, 
    limit, 
    writeBatch, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { 
    Users, 
    MessageSquare, 
    Landmark, 
    ShieldAlert, 
    TrendingUp, 
    DollarSign, 
    PackageCheck, 
    Clock, 
    ArrowRight,
    Loader2,
    Zap,
    Activity,
    ShieldCheck,
    Check,
    X,
    UserCheck,
    PackagePlus
} from "lucide-react";
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import { LiveFeedTicker } from '@/components/ui/live-feed-ticker';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { sendWelcomeEmail } from '@/ai/flows/send-welcome-email';

/**
 * @fileOverview Administrative Executive Pulse Dashboard
 * Orchestrates platform-wide telemetry across mission-critical sectors.
 */
export default function AdminOverviewPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [processingId, setProcessingId] = useState<string | null>(null);

    // 1. Sector Logic: Stable Query Definitions
    const pendingSellersQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('status', '==', 'pending_review'));
    }, [firestore]);

    const openTicketsQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'concierge_tickets'), where('status', '==', 'open'));
    }, [firestore]);

    const maturedRewardsQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'payouts_pending'), where('status', '==', 'pending_maturity'));
    }, [firestore]);

    // 2. Financial Growth Data (Treasury)
    const allOrdersQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collectionGroup(firestore, 'orders'), limit(500));
    }, [firestore]);

    const revenueLogsQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'revenue_logs'), limit(500));
    }, [firestore]);

    const allPendingPayoutsQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'payouts_pending'), limit(500));
    }, [firestore]);

    // 3. System KPI Aggregates
    const activeUsersQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), where('hasAccess', '==', true));
    }, [firestore]);

    const pendingItemsQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'Pending_Master_Catalog'), where('isApproved', '==', false));
    }, [firestore]);

    const { data: pendingSellers, loading: sellersLoading } = useCollection<any>(pendingSellersQ);
    const { data: openTickets, loading: ticketsLoading } = useCollection<any>(openTicketsQ);
    const { data: maturedRewardsRaw, loading: rewardsLoading } = useCollection<any>(maturedRewardsQ);
    const { data: allOrders, loading: ordersLoading } = useCollection<any>(allOrdersQ);
    const { data: revenueLogs, loading: revenueLoading } = useCollection<any>(revenueLogsQ);
    const { data: allPayouts, loading: payoutsLoading } = useCollection<any>(allPendingPayoutsQ);
    const { data: activeUsers, loading: activeUsersLoading } = useCollection(activeUsersQ);
    const { data: pendingItems, loading: itemsLoading } = useCollection<any>(pendingItemsQ);

    const metrics = useMemo(() => {
        const gmv = allOrders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;
        const netRevenue = revenueLogs?.reduce((acc, l) => acc + (l.amount || 0), 0) || 0;
        const liability = allPayouts?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
        
        const maturedCount = maturedRewardsRaw?.filter(r => {
            const date = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
            return differenceInDays(new Date(), date) >= 14;
        }).length || 0;

        return { gmv, netRevenue, liability, maturedCount };
    }, [allOrders, revenueLogs, allPayouts, maturedRewardsRaw]);

    // Workspaces Logic
    const recentPendingSellers = useMemo(() => pendingSellers?.slice(0, 5) || [], [pendingSellers]);
    const recentPendingProducts = useMemo(() => pendingItems?.slice(0, 5) || [], [pendingItems]);

    const handleApproveBrand = async (seller: any) => {
        if (!firestore) return;
        setProcessingId(seller.id);
        try {
            const userRef = doc(firestore, 'users', seller.id);
            await updateDoc(userRef, { status: 'approved' });

            const storeRef = doc(firestore, 'stores', seller.id);
            const storeSnap = await getDoc(storeRef);
            if (!storeSnap.exists()) {
                await setDoc(storeRef, {
                    userId: seller.id,
                    storeName: seller.verificationData?.legalBusinessName || 'SOMA Supplier',
                    status: 'Live',
                    createdAt: new Date().toISOString(),
                    theme: 'Minimalist',
                    currency: 'USD'
                });
            }

            await sendWelcomeEmail({
                to: seller.email,
                storeName: seller.verificationData?.legalBusinessName || 'Your SOMA Store',
            });

            toast({ title: 'Brand Approved', description: `${seller.email} is now verified.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveProduct = async (product: any) => {
        if (!firestore) return;
        setProcessingId(product.id);
        try {
            const batch = writeBatch(firestore);
            const masterCatalogRef = doc(collection(firestore, 'Master_Catalog'));
            const pendingDocRef = doc(firestore, 'Pending_Master_Catalog', product.id);

            batch.set(masterCatalogRef, {
                name: product.productName,
                description: product.description,
                masterCost: product.wholesalePrice,
                retailPrice: product.suggestedRetailPrice,
                stockLevel: product.stockLevel || 0,
                imageId: product.imageUrl,
                vendorId: product.vendorId,
                productType: 'EXTERNAL',
                status: 'active',
                createdAt: new Date().toISOString()
            });

            batch.update(pendingDocRef, { isApproved: 'approved' });
            await batch.commit();

            toast({ title: 'Product Synced', description: `${product.productName} is now in the Master Catalog.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setProcessingId(null);
        }
    };

    const isLoading = sellersLoading || ticketsLoading || rewardsLoading || ordersLoading || revenueLoading || payoutsLoading || activeUsersLoading || itemsLoading;

    if (isLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            {/* Sector 0: Platform KPI Aggregator */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold font-headline text-white flex items-center gap-3">
                        <Activity className="h-8 w-8 text-primary" />
                        Executive Pulse
                    </h1>
                    <p className="text-muted-foreground mt-1">Strategic oversight and system telemetry.</p>
                </div>
                <div className="flex items-center gap-4 bg-muted/20 p-2.5 rounded-2xl border border-primary/10">
                    <div className="text-center px-6 border-r border-primary/10">
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">Active Moguls</p>
                        <p className="text-3xl font-mono font-bold text-primary">{activeUsers?.length || 0}</p>
                    </div>
                    <div className="text-center px-6">
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] mb-1">Master Queue</p>
                        <p className="text-3xl font-mono font-bold text-slate-200">{pendingItems?.length || 0}</p>
                    </div>
                </div>
            </header>

            {/* Row 1: The "Action Required" Strip */}
            <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-primary/60 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Command Priorities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300 group cursor-pointer">
                        <Link href="/admin/verification-queue">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-200">Pending Brands</CardTitle>
                                <Zap className="h-4 w-4 text-primary animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-bold text-white mb-1">{pendingSellers?.length || 0}</div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">New verification requests</p>
                                <div className="mt-6 flex items-center text-[10px] font-black uppercase text-primary group-hover:gap-2 transition-all">
                                    Access Queue <ArrowRight className="ml-1 h-3 w-3" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300 group cursor-pointer">
                        <Link href="/admin/referrals">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-200">Maturity Alerts</CardTitle>
                                <Clock className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-bold text-white mb-1">{metrics.maturedCount}</div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Settlements ready for release</p>
                                <div className="mt-6 flex items-center text-[10px] font-black uppercase text-primary group-hover:gap-2 transition-all">
                                    Release Funds <ArrowRight className="ml-1 h-3 w-3" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>

                    <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300 group cursor-pointer">
                        <Link href="/admin/concierge">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-200">Concierge Inbox</CardTitle>
                                <MessageSquare className="h-4 w-4 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-bold text-white mb-1">{openTickets?.length || 0}</div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Open strategic inquiries</p>
                                <div className="mt-6 flex items-center text-[10px] font-black uppercase text-primary group-hover:gap-2 transition-all">
                                    Open Terminal <ArrowRight className="ml-1 h-3 w-3" />
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                </div>
            </section>

            {/* Workspaces Row */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-primary/20 bg-slate-900/20 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-primary" />
                            Pending Brand Partners
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-primary">
                            <Link href="/admin/verification-queue">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                {recentPendingSellers.length > 0 ? recentPendingSellers.map((seller) => (
                                    <TableRow key={seller.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                                        <TableCell>
                                            <div className="font-bold text-slate-200 text-xs">{seller.email}</div>
                                            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{seller.verificationData?.legalBusinessName || 'N/A'}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                                                    onClick={() => handleApproveBrand(seller)}
                                                    disabled={processingId === seller.id}
                                                >
                                                    {processingId === seller.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                    disabled={processingId === seller.id}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell className="h-32 text-center text-xs text-muted-foreground italic">No brands awaiting review.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-slate-900/20 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center gap-2">
                            <PackagePlus className="h-4 w-4 text-primary" />
                            Master Catalog Submissions
                        </CardTitle>
                        <Button asChild variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-primary">
                            <Link href="/admin/approval-queue">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableBody>
                                {recentPendingProducts.length > 0 ? recentPendingProducts.map((product) => (
                                    <TableRow key={product.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                                        <TableCell>
                                            <div className="font-bold text-slate-200 text-xs">{product.productName}</div>
                                            <div className="text-[10px] text-muted-foreground">{formatCurrency(Math.round(product.wholesalePrice * 100))} wholesale</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                                                    onClick={() => handleApproveProduct(product)}
                                                    disabled={processingId === product.id}
                                                >
                                                    {processingId === product.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                    disabled={processingId === product.id}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell className="h-32 text-center text-xs text-muted-foreground italic">Catalog queue is clear.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </section>

            {/* Row 2: Financial Treasury Row */}
            <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
                    <Landmark className="h-4 w-4" /> Global Treasury
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-slate-800 bg-slate-900/20 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <TrendingUp className="h-24 w-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Ecosystem GMV</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white font-mono">{formatCurrency(Math.round(metrics.gmv * 100))}</div>
                            <p className="text-[10px] text-green-500 font-bold mt-2 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> Aggregated Merchant Volume
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800 bg-slate-900/20 backdrop-blur-sm relative overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">SOMA Net Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-primary font-mono">{formatCurrency(Math.round(metrics.netRevenue * 100))}</div>
                            <p className="text-[10px] text-muted-foreground uppercase mt-2">Platform Cut + Subscription Fees</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-800 bg-slate-900/20 backdrop-blur-sm relative overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Payout Liability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-400 font-mono">{formatCurrency(Math.round(metrics.liability * 100))}</div>
                            <p className="text-[10px] text-muted-foreground uppercase mt-2">Total Funds in User Wallets</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Row 3: Live Ecosystem Ticker */}
            <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Live Network Transmission
                </h2>
                <div className="rounded-2xl overflow-hidden border border-primary/10 bg-slate-900/40">
                    <LiveFeedTicker />
                </div>
            </section>
        </div>
    );
}
