'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup, orderBy, limit } from 'firebase/firestore';
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
    AlertCircle,
    Activity,
    ShieldCheck
} from "lucide-react";
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import { LiveFeedTicker } from '@/components/ui/live-feed-ticker';
import { differenceInDays } from 'date-fns';

export default function AdminOverviewPage() {
    const firestore = useFirestore();

    // 1. Command Action Data
    const pendingSellersQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('status', '==', 'pending_review')) : null, [firestore]);
    const openTicketsQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'concierge_tickets'), where('status', '==', 'open')) : null, [firestore]);
    const maturedRewardsQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'payouts_pending'), where('status', '==', 'pending_maturity')) : null, [firestore]);

    // 2. Financial Growth Data (Treasury)
    const allOrdersQ = useMemoFirebase(() => firestore ? collectionGroup(firestore, 'orders') : null, [firestore]);
    const revenueLogsQ = useMemoFirebase(() => firestore ? collection(firestore, 'revenue_logs') : null, [firestore]);
    const allPendingPayoutsQ = useMemoFirebase(() => firestore ? collection(firestore, 'payouts_pending') : null, [firestore]);

    // 3. System KPI Aggregates
    const activeUsersQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('hasAccess', '==', true)) : null, [firestore]);
    const pendingItemsQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'Pending_Master_Catalog'), where('isApproved', '==', false)) : null, [firestore]);

    const { data: pendingSellers, loading: sellersLoading } = useCollection(pendingSellersQ);
    const { data: openTickets, loading: ticketsLoading } = useCollection(openTicketsQ);
    const { data: maturedRewardsRaw, loading: rewardsLoading } = useCollection<any>(maturedRewardsQ);
    const { data: allOrders, loading: ordersLoading } = useCollection<any>(allOrdersQ);
    const { data: revenueLogs, loading: revenueLoading } = useCollection<any>(revenueLogsQ);
    const { data: allPayouts, loading: payoutsLoading } = useCollection<any>(allPendingPayoutsQ);
    const { data: activeUsers, loading: activeUsersLoading } = useCollection(activeUsersQ);
    const { data: pendingItems, loading: itemsLoading } = useCollection(pendingItemsQ);

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

            {/* Row 2: Financial Growth (The Treasury) */}
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

            {/* Row 3: Live Ecosystem Feed */}
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
