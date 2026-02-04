
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Package, Warehouse, DollarSign, Landmark, ArrowRight, Loader2, Boxes } from "lucide-react";

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

const SupplierUploadView = () => {
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
     <Card className="border-primary/50 text-center flex flex-col items-center justify-center h-96 max-w-lg mx-auto">
        <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 border border-primary/20">
               <DollarSign className="h-12 w-12 text-primary" />
            </div>
        </CardHeader>
        <CardContent>
            <CardTitle className="text-2xl font-headline">Sales Overview</CardTitle>
            {loading ? (
                 <Loader2 className="h-8 w-8 animate-spin text-primary my-3" />
            ): (
                <p className="text-4xl font-bold text-primary my-3">${totalEarned.toFixed(2)}</p>
            )}
            <p className="text-muted-foreground mt-2 mb-6">
                Your total pending earnings from all sales.
            </p>
            <Button asChild>
                <Link href="/backstage">Go to Backstage <Landmark className="ml-2 h-4 w-4" /></Link>
            </Button>
        </CardContent>
    </Card>
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
        case 'ENTERPRISE':
            return <HybridDashboardView />;
        case 'SELLER':
        case 'BRAND':
            return <SupplierUploadView />;
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
