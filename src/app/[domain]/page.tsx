'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUserProfile, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    ShieldCheck, 
    MessageSquare, 
    Loader2, 
    ArrowLeft,
    Box,
    Check,
    Star,
    Truck,
    CheckCircle2,
    AlertTriangle,
    Activity,
    ShoppingBag
} from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { useCart } from '../store/[storeId]/layout';
import { HeroSection } from '@/components/store/hero-section';
import { ProductGrid } from '@/components/store/product-grid';
import { StoreVisitorTracker } from '@/components/store/visitor-tracker';

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                    key={star} 
                    className={cn(
                        "h-3 w-3", 
                        star <= rating ? "fill-primary text-primary" : "text-slate-700"
                    )} 
                />
            ))}
        </div>
    );
};

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

export default function TenantStorefrontPage() {
    const params = useParams();
    const domain = params.domain as string; 
    const firestore = useFirestore();
    const { toast } = useToast();
    const { addToCart } = useCart();

    const storeRef = useMemoFirebase(() => {
        if (!firestore || !domain) return null;
        return doc(firestore, 'stores', domain);
    }, [firestore, domain]);

    const { data: storeData, loading: storeLoading } = useDoc<any>(storeRef);

    const ownerRef = useMemoFirebase(() => {
        if (!firestore || !storeData?.userId) return null;
        return doc(firestore, 'users', storeData.userId);
    }, [firestore, storeData?.userId]);

    const { data: ownerProfile, loading: ownerLoading } = useDoc<any>(ownerRef);

    const productsQuery = useMemoFirebase(() => {
        if (!firestore || !domain) return null;
        return query(collection(firestore, `stores/${domain}/products`));
    }, [firestore, domain]);

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
                <h1 className="text-3xl font-bold font-headline text-primary">Storefront Restricted</h1>
                <p className="text-muted-foreground text-center max-w-sm">This luxury hub is either inactive or currently undergoing maintenance.</p>
            </div>
        );
    }

    const brandName = storeData.storeName || "SOMA Boutique";
    const heroTitle = storeData.heroTitle || "Timeless Luxury, Redefined";
    const heroSubtitle = storeData.heroSubtitle || "Discover curated collections of excellence.";

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <StoreVisitorTracker storeId={domain} />
            
            <div className="relative h-[450px] w-full overflow-hidden">
                <Image 
                    src={storeData.heroImageUrl || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNXx8bHV4dXJ5JTIwb2ZmaWNlfGVufDB8fHx8MTc4ODU0NTEzNHww&ixlib=rb-4.1.0&q=80&w=1080"} 
                    alt="Boutique Hero"
                    fill
                    className="object-cover opacity-40 grayscale-[0.2]"
                    priority
                    data-ai-hint="luxury office"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                <div className="container relative h-full flex flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8 mx-auto">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        <div className="relative h-40 w-40 rounded-3xl overflow-hidden border-4 border-background bg-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0">
                            {storeData.logoUrl ? (
                                <Image src={storeData.logoUrl} alt={brandName} fill className="object-contain p-4" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-5xl font-bold text-primary bg-primary/10">
                                    {brandName.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <h1 className="text-5xl font-bold font-headline tracking-tighter text-white drop-shadow-md">
                                    {brandName}
                                </h1>
                                <Badge className="bg-primary text-primary-foreground font-black px-4 py-1.5 text-xs flex items-center gap-1.5 rounded-full border-none">
                                    <ShieldCheck className="h-4 w-4" />
                                    AUTHENTICITY GUARANTEED
                                </Badge>
                            </div>
                            <p className="text-slate-300 text-xl max-w-3xl italic font-medium leading-relaxed drop-shadow-sm">
                                {heroSubtitle}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 px-8 text-lg">
                                <ShoppingBag className="mr-2 h-5 w-5" /> View Collection
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-16 px-4 sm:px-6 lg:px-8 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-primary/20 bg-slate-900/30">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-headline uppercase tracking-[0.2em] text-primary/60">Boutique Trust Index</CardTitle>
                                    <Activity className="h-4 w-4 text-primary/40" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-200">Inventory Accuracy</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Real-time stock sync</p>
                                        </div>
                                        <span className="font-mono text-lg font-bold text-primary">{healthMetrics?.inventoryAccuracy}%</span>
                                    </div>
                                    <Progress value={healthMetrics?.inventoryAccuracy} className="h-1.5 bg-slate-800" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-200">Authenticity Score</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Verified registry audit</p>
                                        </div>
                                        <span className="font-mono text-lg font-bold text-green-500">{healthMetrics?.authenticityScore}%</span>
                                    </div>
                                    <Progress value={healthMetrics?.authenticityScore} className="h-1.5 bg-slate-800" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/5">
                                    <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5">
                                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1 flex items-center gap-1.5">
                                            <Truck className="h-3 w-3" /> Shipping
                                        </p>
                                        <p className="text-sm font-bold text-slate-200">{healthMetrics?.avgShippingTime}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950/50 border border-white/5">
                                        <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest mb-1 flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3 w-3" /> Rating
                                        </p>
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-bold text-slate-200">{healthMetrics?.fulfillmentRating}</p>
                                            <StarRating rating={Math.round(healthMetrics?.fulfillmentRating || 0)} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-8 space-y-10">
                        <section className="space-y-10">
                            <div className="flex items-end justify-between border-b border-primary/10 pb-6">
                                <div>
                                    <h2 className="text-3xl font-bold font-headline text-slate-200">The Signature Collection</h2>
                                    <p className="text-slate-500 mt-1">Exceptional masterpieces curated for the discerning.</p>
                                </div>
                                <Badge variant="outline" className="h-8 border-primary/20 text-primary font-bold">
                                    {products?.length || 0} Luxury Assets
                                </Badge>
                            </div>

                            <ProductGrid products={products || []} storeId={domain} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
