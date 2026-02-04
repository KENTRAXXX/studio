
'use client';

import { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as ChartTooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import { 
    BarChart3, 
    Globe, 
    Users, 
    Loader2, 
    TrendingUp, 
    MapPin, 
    Layers,
    ArrowUpRight
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

type PayoutRecord = {
    id: string;
    amount: number;
    productName: string;
    quantity: number;
    shippingCity: string;
    shippingCountry: string;
    createdAt: string;
};

type SyncedProduct = {
    id: string;
    vendorId: string;
    storeId?: string; // Implicitly part of the path
};

export default function SupplierAnalyticsPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();

    // Guard: Redirect if pending review or wrong role
    useEffect(() => {
        if (!profileLoading && userProfile) {
            if (userProfile.status === 'pending_review') {
                router.push('/backstage/pending-review');
            }
            if (userProfile.planTier !== 'SELLER' && userProfile.planTier !== 'BRAND') {
                router.push('/access-denied');
            }
        }
    }, [userProfile, profileLoading, router]);

    // 1. Fetch all payouts (Pending + Completed) for historical data
    const pendingQ = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid));
    }, [firestore, user]);
    
    const completedQ = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'payouts_completed'), where('userId', '==', user.uid));
    }, [firestore, user]);

    const { data: pendingDocs, loading: pendingLoading } = useCollection<PayoutRecord>(pendingQ);
    const { data: completedDocs, loading: completedLoading } = useCollection<PayoutRecord>(completedQ);

    // 2. Fetch Sync Count via Collection Group
    const syncCountQ = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collectionGroup(firestore, 'products'), where('vendorId', '==', user.uid));
    }, [firestore, user]);

    const { data: syncedProducts, loading: syncLoading } = useCollection<SyncedProduct>(syncCountQ);

    // 3. Data Aggregations
    const { productData, regionData, mogulSyncCount } = useMemo(() => {
        const allPayouts = [...(pendingDocs || []), ...(completedDocs || [])];
        
        // Product Performance
        const productMap: Record<string, number> = {};
        const regionMap: Record<string, number> = {};

        allPayouts.forEach(p => {
            if (p.productName && p.productName !== 'Store Profit Aggregation') {
                productMap[p.productName] = (productMap[p.productName] || 0) + (p.quantity || 1);
            }
            if (p.shippingCity && p.shippingCountry) {
                const key = `${p.shippingCity}, ${p.shippingCountry}`;
                regionMap[key] = (regionMap[key] || 0) + 1;
            }
        });

        const sortedProducts = Object.entries(productMap)
            .map(([name, qty]) => ({ name, quantity: qty }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const sortedRegions = Object.entries(regionMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Calculate unique store syncs (Collection Group path is stores/{storeId}/products/{prodId})
        // Since we don't have the path easily, we'd ideally store storeId on the product.
        // For now we'll treat total synced count as an indicator.
        const syncCount = syncedProducts?.length || 0;

        return { productData: sortedProducts, regionData: sortedRegions, mogulSyncCount: syncCount };
    }, [pendingDocs, completedDocs, syncedProducts]);

    const isLoading = userLoading || profileLoading || pendingLoading || completedLoading || syncLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-6">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto text-slate-400" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-slate-300 tracking-tight">Supplier Insights</h1>
                <p className="mt-2 text-lg text-slate-500">Analyze your brand's global reach and Mogul adoption.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/20 bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Units Sold</CardTitle>
                        <Layers className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-200">
                            {productData.reduce((acc, p) => acc + p.quantity, 0)}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Across all boutiques</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Mogul Adoption</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-200">{mogulSyncCount}</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Products synced globally</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Primary Region</CardTitle>
                        <Globe className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-slate-200 truncate">
                            {regionData[0]?.name || 'Establishing Market...'}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Highest order density</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Leaderboard Chart */}
                <Card className="border-primary/30 bg-slate-900/50 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-slate-300 font-headline flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Product Leaderboard
                        </CardTitle>
                        <CardDescription className="text-slate-500">Top 5 performers by units moved.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 pt-4">
                        {productData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productData} layout="vertical" margin={{ left: 20, right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                        width={120}
                                    />
                                    <ChartTooltip 
                                        cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--primary) / 0.3)' }}
                                    />
                                    <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                                        {productData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${1 - index * 0.15})`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500 italic text-sm">
                                Insufficient data for leaderboard.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Geographic Insights List */}
                <Card className="border-primary/30 bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="text-slate-300 font-headline flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Top Sales Regions
                        </CardTitle>
                        <CardDescription className="text-slate-500">Customer density by shipping destination.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {regionData.length > 0 ? (
                            <div className="space-y-4">
                                {regionData.map((region, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                {i + 1}
                                            </div>
                                            <span className="text-sm font-medium text-slate-300">{region.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-primary font-mono">{region.count}</span>
                                            <ArrowUpRight className="h-3 w-3 text-slate-600" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
                                <Globe className="h-10 w-10 opacity-20 mb-3" />
                                <p className="text-sm italic">Waiting for international orders to populate insights.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
