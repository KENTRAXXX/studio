'use client';

import { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Store, DollarSign, Users, ArrowRight } from "lucide-react";
import { cn } from '@/lib/utils';
import { CompletePaymentPrompt } from '@/components/complete-payment-prompt';
import { ProvisioningLoader } from '@/components/store/provisioning-loader';


type Order = {
    total: number;
}

type StoreData = {
    customDomain?: string;
    domainStatus?: 'unverified' | 'pending_dns' | 'connected';
    status?: 'Live' | 'Maintenance';
    visitorCount?: number;
}

type Product = {
    id: string;
}

const ChecklistItem = ({ isComplete, children }: { isComplete: boolean, children: React.ReactNode }) => (
    <li className="flex items-center gap-3">
        <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2", isComplete ? "border-primary bg-primary/20" : "border-border")}>
            {isComplete && <CheckCircle2 className="h-4 w-4 text-primary" />}
        </div>
        <span className={cn("text-muted-foreground", isComplete && "text-foreground line-through")}>
            {children}
        </span>
    </li>
);


export default function DashboardOverviewPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();

    // Data fetching
    const storeRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'stores', user.uid) : null, [user, firestore]);
    const { data: storeData, loading: storeLoading } = useDoc<StoreData>(storeRef);

    const ordersRef = useMemoFirebase(() => user && firestore ? collection(firestore, `stores/${user.uid}/orders`) : null, [user, firestore]);
    const { data: orders, loading: ordersLoading } = useCollection<Order>(ordersRef);

    const productsRef = useMemoFirebase(() => user && firestore ? collection(firestore, `stores/${user.uid}/products`) : null, [user, firestore]);
    const { data: products, loading: productsLoading } = useCollection<Product>(productsRef);

    const isLoading = userLoading || profileLoading || storeLoading || ordersLoading || productsLoading;
    
    useEffect(() => {
        if (!isLoading && userProfile) {
            const planTier = userProfile.planTier;
            if (planTier === 'SELLER' || planTier === 'BRAND') {
                router.push('/backstage/finances');
            }
        }
    }, [isLoading, userProfile, router]);


    // Calculations
    const totalSales = useMemo(() => {
        return orders?.reduce((acc, order) => acc + order.total, 0) || 0;
    }, [orders]);

    // Checklist logic
    const isDomainConnected = storeData?.domainStatus === 'connected';
    const isProductSynced = !!(products && products.length > 0);
    const isProfileComplete = !!userProfile?.planTier; // A simple check
    const isSaleMade = !!(orders && orders.length > 0);
    
    if (isLoading || userProfile?.planTier === 'SELLER' || userProfile?.planTier === 'BRAND') {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // If the user hasn't paid, show payment prompt.
    if (userProfile && !userProfile.hasAccess) {
        return <CompletePaymentPrompt />;
    }

    // If they have paid, but the store doesn't exist yet (webhook delay), show a waiting message.
    if (!storeData && !isLoading) {
        return <ProvisioningLoader />;
    }
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">Welcome, {userProfile?.displayName || (userProfile?.email ? userProfile.email.split('@')[0] : 'Mogul')}</h1>

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
                 <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle className="font-headline">Quick Start Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4 text-lg">
                            <ChecklistItem isComplete={isDomainConnected}>Connect Domain</ChecklistItem>
                            <ChecklistItem isComplete={isProductSynced}>Sync First Product</ChecklistItem>
                            <ChecklistItem isComplete={isProfileComplete}>Complete Profile</ChecklistItem>
                            <ChecklistItem isComplete={isSaleMade}>Make First Sale</ChecklistItem>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-primary/50 flex flex-col items-center justify-center text-center p-8">
                    <CardTitle className="font-headline text-2xl">Ready to sell?</CardTitle>
                    <CardContent className="p-0 mt-4">
                        <p className="text-muted-foreground mb-6">Visit your live storefront and see your changes.</p>
                        <Button asChild size="lg" className="h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Link href={storeData?.customDomain ? `https://${storeData.customDomain}` : `/store/${user?.uid}`} target="_blank">
                                View My Store <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
