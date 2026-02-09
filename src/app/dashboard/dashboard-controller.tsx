'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    Package, 
    Warehouse, 
    DollarSign, 
    Landmark, 
    ArrowRight, 
    Loader2, 
    Boxes, 
    ShieldCheck, 
    TrendingUp, 
    BarChart3, 
    Clock, 
    Sparkles, 
    Users, 
    MessageSquare, 
    ClipboardList,
    ShieldAlert
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { subDays, isSameDay, format } from 'date-fns';
import { formatCurrency } from '@/utils/format';

// Mock data for sparklines
const sparklineData = [
    { value: 400 }, { value: 300 }, { value: 500 }, { value: 450 }, 
    { value: 600 }, { value: 550 }, { value: 700 }, { value: 800 }
];

const MiniSparkline = ({ color = "hsl(var(--primary))" }: { color?: string }) => (
    <div className="h-8 w-24 opacity-50">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={color} 
                    strokeWidth={2} 
                    dot={false} 
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const PrivateInventoryCard = () => {
    const { user } = useUser();
    const firestore = useFirestore();

    const privateProductsRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
        collection(firestore, 'stores', user.uid, 'products'),
        where('isManagedBySoma', '==', false)
        );
    }, [firestore, user]);

    const { data: privateProducts, loading } = useCollection(privateProductsRef);

    return (
        <Card className="border-primary/50 text-center flex flex-col items-center justify-center p-6 h-full bg-card/50">
            <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20">
                   <Warehouse className="h-12 w-12 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <CardTitle className="text-2xl font-headline">Private Inventory</CardTitle>
                {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-primary my-3" />
                ) : (
                    <p className="text-4xl font-bold text-primary my-3">{privateProducts?.length || 0}</p>
                )}
                <p className="text-muted-foreground mt-2 mb-6 text-sm leading-relaxed">
                    Exclusively manage and fulfill your private luxury collections.
                </p>
                <Button asChild size="lg" className="w-full btn-gold-glow bg-primary font-bold">
                    <Link href="/dashboard/my-private-inventory">Manage Warehouse <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>
    );
};

const DropshipCatalogCard = () => {
    return (
        <Card className="border-primary/50 text-center flex flex-col items-center justify-center p-6 h-full bg-card/50">
            <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20">
                   <Boxes className="h-12 w-12 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <CardTitle className="text-2xl font-headline">Global Catalog</CardTitle>
                <p className="text-muted-foreground mt-4 mb-6 text-sm leading-relaxed">
                    Clone thousands of premium assets from the SOMA Luxury Catalog.
                </p>
                <Button asChild size="lg" className="w-full btn-gold-glow bg-primary font-bold">
                    <Link href="/dashboard/product-catalog">Browse Collection <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>
    );
};

const EarningsOverview = ({ pendingDocs, completedDocs }: { pendingDocs: any[], completedDocs: any[] }) => {
    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), 6 - i);
            return {
                date: format(date, 'MMM dd'),
                fullDate: date,
                earnings: 0
            };
        });

        const allDocs = [...(pendingDocs || []), ...(completedDocs || [])];

        allDocs.forEach(doc => {
            const docDate = doc.createdAt ? new Date(doc.createdAt) : null;
            if (!docDate) return;

            const dayMatch = last7Days.find(day => isSameDay(day.fullDate, docDate));
            if (dayMatch) {
                dayMatch.earnings += (doc.amount || 0);
            }
        });

        return last7Days;
    }, [pendingDocs, completedDocs]);

    const hasData = chartData.some(d => d.earnings > 0);

    if (!hasData) {
        return (
            <Card className="border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20 w-fit mb-4">
                        <TrendingUp className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-headline text-muted-foreground">Network Growth</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Sales velocity metrics will populate here as your collection is synchronized by boutiques globally.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/20 bg-card overflow-hidden">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Earnings Performance
                </CardTitle>
                <CardDescription>Consolidated revenue across the ecosystem over the last 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="h-72 pl-0 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ left: 20, right: 30, bottom: 10 }}>
                        <defs>
                            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                            dy={15}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                            tickFormatter={(val) => formatCurrency(val * 100)}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--primary) / 0.5)',
                                borderRadius: '8px'
                            }}
                            itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                            formatter={(val: number) => [formatCurrency(Math.round(val * 100)), 'Revenue']}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="earnings" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={4} 
                            dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 0 }} 
                            activeDot={{ r: 7, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
                            filter="url(#goldGlow)"
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

const SupplierUploadView = ({ planTier }: { planTier: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();

    const pendingPayoutsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid));
    }, [user, firestore]);
    const { data: pendingDocs, loading: pendingLoading } = useCollection(pendingPayoutsQuery);

    const completedPayoutsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'payouts_completed'), where('userId', '==', user.uid));
    }, [user, firestore]);
    const { data: completedDocs, loading: completedLoading } = useCollection(completedPayoutsQuery);

    const activeListingsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'Master_Catalog'), 
            where('vendorId', '==', user.uid),
            where('status', '==', 'active')
        );
    }, [user, firestore]);
    const { data: activeListings, loading: listingsLoading } = useCollection(activeListingsQuery);

    const recentProductsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'Master_Catalog'),
            where('vendorId', '==', user.uid),
            orderBy('submittedAt', 'desc'),
            limit(5)
        );
    }, [user, firestore]);
    const { data: recentProducts, loading: recentLoading } = useCollection<any>(recentProductsQuery);

    const metrics = useMemo(() => {
        const pending = pendingDocs?.reduce((acc, doc: any) => acc + (doc.amount || 0), 0) || 0;
        const completed = completedDocs?.reduce((acc, doc: any) => acc + (doc.amount || 0), 0) || 0;
        const gross = pending + completed;
        const activeCount = activeListings?.length || 0;

        return { pending, gross, activeCount };
    }, [pendingDocs, completedDocs, activeListings]);

    const isLoading = pendingLoading || completedLoading || listingsLoading || recentLoading;

    return (
     <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20 w-fit">
                <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-headline mt-4">{planTier === 'BRAND' ? 'Executive Brand Portal' : 'Supplier Backstage'}</h1>
            <p className="text-muted-foreground mt-2">Manage your global inventory and track ecosystem-wide performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Gross Merchant Sales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div>
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-3xl font-bold text-primary">{formatCurrency(Math.round(metrics.gross * 100))}</p>}
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Lifetime Platform Yield</p>
                        </div>
                        <MiniSparkline />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div>
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-3xl font-bold text-primary">{formatCurrency(Math.round(metrics.pending * 100))}</p>}
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Pending Maturity</p>
                        </div>
                        <MiniSparkline color="hsl(var(--muted-foreground))" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Registry Presence</CardTitle>
                    <BarChart3 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div>
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-3xl font-bold text-primary">{metrics.activeCount}</p>}
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Approved Master Assets</p>
                        </div>
                        <MiniSparkline />
                    </div>
                </CardContent>
            </Card>
        </div>

        <EarningsOverview 
            pendingDocs={pendingDocs || []} 
            completedDocs={completedDocs || []} 
        />

        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <Boxes className="h-6 w-6 text-primary" />
                    Recent Submissions
                </h2>
                <Button asChild variant="link" className="text-primary font-bold">
                    <Link href="/backstage/inventory">View Inventory Audit <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
            </div>

            {recentLoading ? (
                <div className="h-48 flex items-center justify-center border rounded-lg bg-card/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : !recentProducts || recentProducts.length === 0 ? (
                <Card className="border-2 border-dashed border-primary/50 bg-primary/5 p-12 text-center">
                    <CardContent className="space-y-4">
                        <div className="bg-primary/10 rounded-full p-4 w-fit mx-auto border border-primary/20">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold font-headline text-primary">Master Catalog Clear</h3>
                        <p className="text-muted-foreground max-md mx-auto leading-relaxed">
                            Initialize your global presence by submitting your first masterpiece to the SOMA ecosystem.
                        </p>
                        <Button asChild size="lg" className="btn-gold-glow mt-4 font-bold">
                            <Link href="/backstage/add-product">Submit My First Asset</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-primary/20 bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[80px]">Asset</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead className="text-center">Stock</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentProducts.map((product) => (
                                <TableRow key={product.id} className="hover:bg-primary/5 transition-colors group">
                                    <TableCell>
                                        <div className="relative h-12 w-12 rounded-md overflow-hidden border border-border bg-muted">
                                            <img 
                                                src={product.imageUrl || product.imageGallery?.[0] || 'https://placehold.co/100'} 
                                                alt={product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{product.name}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono uppercase">SKU: {product.id.slice(0, 8)}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {product.stockLevel || 0} units
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge className={cn(
                                            "capitalize text-[10px] font-black tracking-widest",
                                            product.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                            product.status === 'rejected' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                            "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                        )}>
                                            {product.status === 'pending_review' ? 'In Curation' : product.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4 pb-16">
            <Button asChild size="lg" className="h-16 text-lg btn-gold-glow bg-primary font-black uppercase tracking-widest">
                <Link href="/backstage/finances">Manage Treasury <Landmark className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-16 text-lg border-primary text-primary hover:bg-primary/5 font-black uppercase tracking-widest">
                <Link href="/backstage/add-product">New Intake <Package className="ml-2 h-5 w-5" /></Link>
            </Button>
        </div>
     </div>
    );
};

const AdminOverview = () => {
    const firestore = useFirestore();

    const usersQ = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const ticketsQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'concierge_tickets'), where('status', '==', 'open')) : null, [firestore]);
    const payoutsQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'withdrawal_requests'), where('status', '==', 'pending')) : null, [firestore]);

    const { data: users, loading: usersLoading } = useCollection(usersQ);
    const { data: tickets, loading: ticketsLoading } = useCollection(ticketsQ);
    const { data: payouts, loading: payoutsLoading } = useCollection(payoutsQ);

    const isLoading = usersLoading || ticketsLoading || payoutsLoading;

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center">
                <ShieldAlert className="h-12 w-12 mx-auto text-primary mb-4" />
                <h1 className="text-4xl font-bold font-headline uppercase tracking-tight">Executive Pulse</h1>
                <p className="text-muted-foreground mt-2">Platform-wide strategic oversight and financial audit.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Population</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{users?.length || 0}</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Partners & Moguls</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Inquiries</CardTitle>
                        <MessageSquare className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{tickets?.length || 0}</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Concierge Open Queue</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Treasury Requests</CardTitle>
                        <Landmark className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{payouts?.length || 0}</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Pending Payout Validation</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Concierge Inbox', href: '/admin/concierge', icon: MessageSquare },
                    { label: 'Verify Partners', href: '/admin/verification-queue', icon: ClipboardList },
                    { label: 'Global Treasury', href: '/admin/treasury', icon: Landmark },
                    { label: 'Referral Audit', href: '/admin/referrals', icon: ShieldAlert },
                ].map((action) => (
                    <Button key={action.href} asChild variant="outline" className="h-24 flex flex-col gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary transition-all">
                        <Link href={action.href}>
                            <action.icon className="h-6 w-6 text-primary" />
                            <span className="font-bold text-xs uppercase tracking-widest">{action.label}</span>
                        </Link>
                    </Button>
                ))}
            </div>
        </div>
    );
};

const HybridDashboardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <DropshipCatalogCard />
        <PrivateInventoryCard />
    </div>
);


export default function DashboardController({ planTier }: { planTier?: string, isDemo?: boolean }) {
    switch (planTier) {
        case 'ADMIN':
            return <AdminOverview />;
        case 'MERCHANT':
            return <div className="max-w-lg mx-auto"><PrivateInventoryCard /></div>;
        case 'SCALER':
            return <div className="max-w-lg mx-auto"><DropshipCatalogCard /></div>;
        case 'ENTERPRISE':
            return <HybridDashboardView />;
        case 'SELLER':
        case 'BRAND':
            return <SupplierUploadView planTier={planTier} />;
        default:
             return (
                <Card className="border-destructive/50 text-center flex flex-col items-center justify-center h-96 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline text-destructive">Identity Discrepancy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                           Your current plan configuration '{planTier}' is not provisioned for this hub. Contact SOMA Concierge for reassignment.
                        </p>
                    </CardContent>
                </Card>
            );
    }
}
