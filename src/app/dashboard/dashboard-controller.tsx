'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Package, Warehouse, DollarSign, Landmark, ArrowRight, Loader2, Boxes, ShieldCheck, TrendingUp, BarChart3 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock data for sparklines to give a high-end financial feel
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
        <Card className="border-primary/50 text-center flex flex-col items-center justify-center p-6 h-full">
            <CardHeader>
                <div className="mx-auto bg-muted rounded-full p-4 border border-primary/20">
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
                <p className="text-muted-foreground mt-2 mb-6 text-sm">
                    Products you manage and fulfill yourself.
                </p>
                <Button asChild className="w-full">
                    <Link href="/dashboard/my-private-inventory">Manage Inventory <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>
    );
};

const DropshipCatalogCard = () => {
    return (
        <Card className="border-primary/50 text-center flex flex-col items-center justify-center p-6 h-full">
            <CardHeader>
                <div className="mx-auto bg-muted rounded-full p-4 border border-primary/20">
                   <Boxes className="h-12 w-12 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                <CardTitle className="text-2xl font-headline">Global Catalog</CardTitle>
                <p className="text-muted-foreground mt-4 mb-6 text-sm">
                    Access thousands of premium dropshippable products.
                </p>
                <Button asChild className="w-full">
                    <Link href="/dashboard/product-catalog">Browse Catalog <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>
    );
};

const SupplierUploadView = ({ planTier }: { planTier: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();

    // 1. Pending Payouts
    const pendingPayoutsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid));
    }, [user, firestore]);
    const { data: pendingDocs, loading: pendingLoading } = useCollection(pendingPayoutsQuery);

    // 2. Completed Payouts (for Gross calculation)
    const completedPayoutsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'payouts_completed'), where('userId', '==', user.uid));
    }, [user, firestore]);
    const { data: completedDocs, loading: completedLoading } = useCollection(completedPayoutsQuery);

    // 3. Active Listings Count
    const activeListingsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'Master_Catalog'), 
            where('vendorId', '==', user.uid),
            where('status', '==', 'active')
        );
    }, [user, firestore]);
    const { data: activeListings, loading: listingsLoading } = useCollection(activeListingsQuery);

    const metrics = useMemo(() => {
        const pending = pendingDocs?.reduce((acc, doc: any) => acc + (doc.amount || 0), 0) || 0;
        const completed = completedDocs?.reduce((acc, doc: any) => acc + (doc.amount || 0), 0) || 0;
        const gross = pending + completed;
        const activeCount = activeListings?.length || 0;

        return { pending, gross, activeCount };
    }, [pendingDocs, completedDocs, activeListings]);

    const isLoading = pendingLoading || completedLoading || listingsLoading;

    return (
     <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20 w-fit">
                <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold font-headline mt-4">{planTier === 'BRAND' ? 'Brand Partner Hub' : 'Seller Hub'}</h1>
            <p className="text-muted-foreground mt-2">Elite supply management and global performance analytics.</p>
        </div>

        {/* Live Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales (Gross)</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div>
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-3xl font-bold text-primary">${metrics.gross.toFixed(2)}</p>}
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">+12.5% from last month</p>
                        </div>
                        <MiniSparkline />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payouts</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div>
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-3xl font-bold text-primary">${metrics.pending.toFixed(2)}</p>}
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Settling in 7 days</p>
                        </div>
                        <MiniSparkline color="hsl(var(--muted-foreground))" />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Listings</CardTitle>
                    <BarChart3 className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-end justify-between">
                        <div>
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <p className="text-3xl font-bold text-primary">{metrics.activeCount}</p>}
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Live in Master Catalog</p>
                        </div>
                        <MiniSparkline />
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
            <Button asChild size="lg" className="h-16 text-lg btn-gold-glow">
                <Link href="/backstage/finances">Manage Finances & Payouts <Landmark className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-16 text-lg border-primary/50 hover:bg-primary/5">
                <Link href="/backstage/add-product">Submit New Product <Package className="ml-2 h-5 w-5" /></Link>
            </Button>
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
                <Card className="border-destructive/50 text-center flex flex-col items-center justify-center h-96">
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline text-destructive">Invalid User Role</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mt-2">
                           Your user plan '{planTier}' is not recognized. Please contact support.
                        </p>
                    </CardContent>
                </Card>
            );
    }
}