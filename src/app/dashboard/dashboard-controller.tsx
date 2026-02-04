'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Package, Warehouse, DollarSign, Landmark, ArrowRight, Loader2, Boxes, ShieldCheck } from "lucide-react";

const PrivateInventoryCard = () => {
    const { user } = useUser();
    const firestore = useFirestore();

    const privateProductsRef = useMemo(() => {
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

    const payoutsRef = useMemo(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid));
    }, [user, firestore]);
    
    const { data: payoutDocs, loading } = useCollection(payoutsRef);

    const totalEarned = useMemo(() => {
        if (!payoutDocs) return 0;
        return payoutDocs.reduce((acc, doc: any) => acc + (doc.amount || 0), 0);
    }, [payoutDocs]);

    return (
     <div className="max-w-2xl mx-auto space-y-8">
        <Card className="border-primary/50 text-center flex flex-col items-center justify-center p-8 bg-primary/5">
            <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20">
                   <ShieldCheck className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-headline mt-4">{planTier === 'BRAND' ? 'Brand Partner Hub' : 'Seller Hub'}</CardTitle>
                <CardDescription>Manage your premium product supply and finances.</CardDescription>
            </CardHeader>
            <CardContent className="w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-lg bg-background border border-border text-center">
                        <p className="text-sm text-muted-foreground mb-1">Available Earnings</p>
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        ): (
                            <p className="text-3xl font-bold text-primary">${totalEarned.toFixed(2)}</p>
                        )}
                    </div>
                    <div className="p-6 rounded-lg bg-background border border-border text-center flex flex-col justify-center">
                        <p className="text-sm text-muted-foreground mb-1">Commission Rate</p>
                        <p className="text-3xl font-bold text-primary">{planTier === 'BRAND' ? '3%' : '9%'}</p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-3 pt-4">
                    <Button asChild size="lg" className="h-14 text-lg">
                        <Link href="/backstage/finances">Manage Finances & Payouts <Landmark className="ml-2 h-5 w-5" /></Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-14 text-lg border-primary/50">
                        <Link href="/backstage/add-product">Submit New Product <Package className="ml-2 h-5 w-5" /></Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
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