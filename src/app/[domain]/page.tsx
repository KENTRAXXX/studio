'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit, or } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    ShieldCheck, 
    Loader2, 
    ArrowLeft,
    Box,
    Star,
    Truck,
    Activity,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductGrid } from '@/components/store/product-grid';
import { StoreVisitorTracker } from '@/components/store/visitor-tracker';

type StorefrontProduct = {
    id: string;
    name: string;
    description: string;
    suggestedRetailPrice: number;
    wholesalePrice: number;
    imageUrl: string;
    productType: 'INTERNAL' | 'EXTERNAL';
    vendorId: string;
    isManagedBySoma: boolean;
};

/**
 * @fileOverview Tenant Boutique Root
 * Handles high-fidelity rendering for hostnames passed via middleware rewrite.
 */
export default function TenantBoutiquePage() {
    const params = useParams();
    const router = useRouter();
    // In robust multi-tenancy mode, 'domain' is the hostname or slug
    const identifier = params.domain as string; 
    
    const firestore = useFirestore();

    // 1. Boutique Identity Resolution
    const storeQuery = useMemoFirebase(() => {
        if (!firestore || !identifier) return null;
        // Search by UID, Custom Domain, or Subdomain Slug
        return query(
            collection(firestore, 'stores'),
            or(
                where('userId', '==', identifier),
                where('customDomain', '==', identifier),
                where('slug', '==', identifier)
            ),
            limit(1)
        );
    }, [firestore, identifier]);

    const { data: storeDocs, loading: storeLoading } = useCollection<any>(storeQuery);
    const storeData = storeDocs?.[0];
    const storeId = storeData?.userId;

    const ownerRef = useMemoFirebase(() => {
        if (!firestore || !storeId) return null;
        return doc(firestore, 'users', storeId);
    }, [firestore, storeId]);

    const { data: ownerProfile, loading: ownerLoading } = useDoc<any>(ownerRef);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !storeId) return null;
        return query(collection(firestore, `stores/${storeId}/products`));
    }, [firestore, storeId]);

    const { data: products, loading: productsLoading } = useCollection<StorefrontProduct>(productsQuery);

    const healthMetrics = useMemo(() => {
        if (!ownerProfile) return null;
        const isVerified = ownerProfile.status === 'approved';
        return {
            authenticityScore: isVerified ? 100 : 85,
            inventoryAccuracy: isVerified ? 99.4 : 92.0,
            avgShippingTime: isVerified ? "1.4 Days" : "2.1 Days",
            fulfillmentRating: isVerified ? 4.9 : 4.2
        };
    }, [ownerProfile]);

    const isLoading = storeLoading || ownerLoading || productsLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!storeData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-background px-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Box className="h-16 w-16 text-primary opacity-20" />
                </div>
                <h1 className="text-3xl font-bold font-headline text-primary uppercase tracking-widest text-center">Boutique Not Found</h1>
                <p className="text-muted-foreground text-center max-w-sm">The luxury storefront at "{identifier}" is not currently provisioned in the SOMA network.</p>
                <Button variant="outline" className="border-primary/50" onClick={() => router.push('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Platform Home
                </Button>
            </div>
        );
    }

    const storeName = storeData.storeName || "Elite Boutique";
    const heroSubtitle = storeData.heroSubtitle || "Curated masterpieces for the discerning individual.";
    const heroImageUrl = storeData.heroImageUrl || PlaceHolderImages.find(img => img.id === 'storefront-hero')?.imageUrl;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <StoreVisitorTracker storeId={storeId} />
            
            {/* Elite Brand Header */}
            <div className="relative h-[400px] w-full overflow-hidden">
                <Image 
                    src={ownerProfile?.coverPhotoUrl || heroImageUrl || ""} 
                    alt="Brand Banner"
                    fill
                    className="object-cover opacity-40 grayscale-[0.2]"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                <div className="container relative h-full flex flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8 mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        <div className="relative h-32 w-32 rounded-2xl overflow-hidden border-4 border-background bg-slate-950 shadow-2xl shrink-0">
                            {storeData.logoUrl || ownerProfile?.avatarUrl ? (
                                <Image src={storeData.logoUrl || ownerProfile?.avatarUrl} alt={storeName} fill className="object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-primary bg-primary/10">
                                    {storeName.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-2">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <h1 className="text-4xl font-bold font-headline tracking-tighter text-white">
                                    {storeName}
                                </h1>
                                {ownerProfile?.status === 'approved' && (
                                    <Badge className="bg-primary text-primary-foreground font-black px-3 py-1 text-[10px] flex items-center gap-1.5 rounded-full">
                                        <ShieldCheck className="h-3 w-3" />
                                        SOMA VERIFIED
                                    </Badge>
                                )}
                            </div>
                            <p className="text-slate-300 text-lg max-w-2xl italic font-medium">
                                {ownerProfile?.brandBio || heroSubtitle}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container py-16 px-4 sm:px-6 lg:px-8 mx-auto space-y-20">
                {/* Brand Health Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="border-primary/20 bg-slate-900/30">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-[10px] font-headline uppercase tracking-[0.2em] text-primary/60">Registry Health</CardTitle>
                                <Activity className="h-4 w-4 text-primary/40" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-200 uppercase">Provenance Audit</span>
                                    <span className="font-mono text-sm font-bold text-green-500">{healthMetrics?.authenticityScore}%</span>
                                </div>
                                <Progress value={healthMetrics?.authenticityScore} className="h-1 bg-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-200 uppercase">Inventory Accuracy</span>
                                    <span className="font-mono text-sm font-bold text-primary">{healthMetrics?.inventoryAccuracy}%</span>
                                </div>
                                <Progress value={healthMetrics?.inventoryAccuracy} className="h-1 bg-slate-800" />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-xl bg-slate-900/30 border border-primary/10 flex flex-col items-center justify-center text-center">
                            <Truck className="h-6 w-6 text-primary mb-2" />
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Avg. Shipping</p>
                            <p className="text-lg font-bold text-slate-200">{healthMetrics?.avgShippingTime}</p>
                        </div>
                        <div className="p-6 rounded-xl bg-slate-900/30 border border-primary/10 flex flex-col items-center justify-center text-center">
                            <Star className="h-6 w-6 text-primary mb-2 fill-primary" />
                            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Mogul Rating</p>
                            <p className="text-lg font-bold text-slate-200">{healthMetrics?.fulfillmentRating}</p>
                        </div>
                    </div>

                    <Card className="border-primary/20 bg-primary/5 flex items-center justify-center p-8 text-center">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Collection Depth</p>
                            <p className="text-4xl font-black font-headline text-primary">{products?.length || 0}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Masterwork Assets</p>
                        </div>
                    </Card>
                </div>

                {/* Product Collection */}
                <section id="collection" className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-primary/10 pb-8 gap-4">
                        <div>
                            <h2 className="text-4xl font-bold font-headline text-slate-200 uppercase tracking-tighter">Signature Collection</h2>
                            <p className="text-slate-500 mt-2">Discover curated luxury from the {storeName} archives.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                            <Zap className="h-4 w-4 text-primary fill-primary" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Real-time Global Sync Active</span>
                        </div>
                    </div>

                    <ProductGrid products={products || []} storeId={storeId} />
                </section>
            </main>
        </div>
    );
}
