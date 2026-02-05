export const runtime = 'edge';

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUserProfile, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, collectionGroup, setDoc } from 'firebase/firestore';
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
    Zap
} from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

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

type MasterProduct = {
    id: string;
    name: string;
    description: string;
    masterCost: number;
    retailPrice: number;
    imageUrl: string;
    vendorId: string;
    status: string;
};

export default function BrandProfilePage() {
    const params = useParams();
    const router = useRouter();
    const brandUsername = params.brandUsername as string; 
    
    const { user } = useUser();
    const { userProfile: viewerProfile, loading: viewerLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [syncingIds, setSyncingProducts] = useState<Set<string>>(new Set());
    
    const brandRef = useMemoFirebase(() => {
        if (!firestore || !brandUsername) return null;
        return doc(firestore, 'users', brandUsername);
    }, [firestore, brandUsername]);

    const { data: brandProfile, loading: brandLoading } = useDoc<any>(brandRef);

    const collectionQuery = useMemoFirebase(() => {
        if (!firestore || !brandUsername) return null;
        return query(
            collection(firestore, 'Master_Catalog'),
            where('vendorId', '==', brandUsername),
            where('status', '==', 'active')
        );
    }, [firestore, brandUsername]);

    const { data: brandProducts, loading: productsLoading } = useCollection<MasterProduct>(collectionQuery);

    const adoptionQuery = useMemoFirebase(() => {
        if (!firestore || !brandUsername) return null;
        return query(collectionGroup(firestore, 'products'), where('vendorId', '==', brandUsername));
    }, [firestore, brandUsername]);

    const { data: syncedInstances } = useCollection(adoptionQuery);

    const healthMetrics = useMemo(() => {
        if (!brandProfile) return null;
        const isVerified = brandProfile.status === 'approved';
        const syncCount = syncedInstances?.length || 0;
        return {
            authenticityScore: isVerified ? 100 : 85,
            inventoryAccuracy: isVerified ? 99.4 : 92.0,
            avgShippingTime: isVerified ? "1.4 Days" : "2.1 Days",
            fulfillmentRating: isVerified ? 4.9 : 4.2,
            isHighDemand: syncCount > 20
        };
    }, [brandProfile, syncedInstances]);

    const isMogul = viewerProfile?.userRole === 'MOGUL';
    const isAdmin = viewerProfile?.userRole === 'ADMIN';
    const isOwner = viewerProfile?.id === brandUsername;

    const handleQuickSync = async (product: MasterProduct) => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Action Denied', description: 'Please authenticate to sync products.' });
            return;
        }

        setSyncingProducts(prev => new Set(prev).add(product.id));

        try {
            const syncDocRef = doc(firestore, 'stores', user.uid, 'products', product.id);
            await setDoc(syncDocRef, {
                name: product.name,
                suggestedRetailPrice: product.retailPrice,
                wholesalePrice: product.masterCost,
                description: product.description,
                imageUrl: product.imageUrl,
                productType: 'EXTERNAL',
                vendorId: product.vendorId,
                isManagedBySoma: true,
                syncedAt: new Date().toISOString()
            });

            toast({
                title: 'Sync Successful',
                description: `${product.name} is now available in your boutique.`,
                action: <Check className="h-4 w-4 text-green-500" />
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Sync Failed', description: error.message });
        } finally {
            setSyncingProducts(prev => {
                const newSet = new Set(prev);
                newSet.delete(product.id);
                return newSet;
            });
        }
    };

    const isLoading = viewerLoading || brandLoading || productsLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!viewerProfile || (!isMogul && !isAdmin && !isOwner)) {
        router.push('/access-denied');
        return null;
    }

    if (!brandProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-background px-4">
                <div className="bg-primary/10 p-6 rounded-full">
                    <Box className="h-16 w-16 text-primary opacity-20" />
                </div>
                <h1 className="text-3xl font-bold font-headline text-primary">Identity Not Found</h1>
                <p className="text-muted-foreground text-center max-w-sm">The requested brand partner is either inactive or restricted in your region.</p>
                <Button variant="outline" className="border-primary/50" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to Hub
                </Button>
            </div>
        );
    }

    const isVerified = brandProfile.status === 'approved';
    const brandName = brandProfile.displayName || brandProfile.verificationData?.legalBusinessName || "Elite Supplier";

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 pb-24">
            <div className="relative h-[450px] w-full overflow-hidden">
                <Image 
                    src={brandProfile.coverPhotoUrl || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNXx8bHV4dXJ5JTIwb2ZmaWNlfGVufDB8fHx8MTc4ODU0NTEzNHww&ixlib=rb-4.1.0&q=80&w=1080"} 
                    alt="Brand Banner"
                    fill
                    className="object-cover opacity-40 grayscale-[0.2]"
                    priority
                    data-ai-hint="luxury office"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                
                <div className="container relative h-full flex flex-col justify-end pb-12 px-4 sm:px-6 lg:px-8 mx-auto">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-8 left-4 text-muted-foreground hover:text-primary transition-colors bg-black/20 backdrop-blur-md border border-white/5"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>

                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        <div className="relative h-40 w-40 rounded-3xl overflow-hidden border-4 border-background bg-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0">
                            {brandProfile.avatarUrl ? (
                                <Image src={brandProfile.avatarUrl} alt={brandName} fill className="object-cover" />
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
                                {isVerified && (
                                    <Badge className="bg-primary text-primary-foreground font-black px-4 py-1.5 text-xs animate-gold-pulse flex items-center gap-1.5 rounded-full border-none">
                                        <ShieldCheck className="h-4 w-4" />
                                        SOMA VERIFIED
                                    </Badge>
                                )}
                            </div>
                            <p className="text-slate-300 text-xl max-w-3xl italic font-medium leading-relaxed drop-shadow-sm">
                                "{brandProfile.brandBio || "Defining excellence through curated supply and absolute authenticity."}"
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 px-8 text-lg">
                                <MessageSquare className="mr-2 h-5 w-5" /> Contact Brand
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-16 px-4 sm:px-6 lg:px-8 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        {healthMetrics?.isHighDemand && (
                            <Card className="border-orange-500/50 bg-orange-500/5 overflow-hidden">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="bg-orange-500/20 p-3 rounded-full animate-pulse">
                                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-orange-500 uppercase tracking-widest">High Demand Partner</p>
                                        <p className="text-xs text-orange-400/80 leading-tight mt-0.5">This brand is currently synced with {syncedInstances?.length} boutiques. Fulfillment times may be slightly elevated.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-primary/20 bg-slate-900/30">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-headline uppercase tracking-[0.2em] text-primary/60">Brand Health Index</CardTitle>
                                    <Activity className="h-4 w-4 text-primary/40" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-200">Inventory Accuracy</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Stock reliability rating</p>
                                        </div>
                                        <span className="font-mono text-lg font-bold text-primary">{healthMetrics?.inventoryAccuracy}%</span>
                                    </div>
                                    <Progress value={healthMetrics?.inventoryAccuracy} className="h-1.5 bg-slate-800" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-200">Authenticity Score</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Verified provenance audit</p>
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

                        <div className="grid grid-cols-2 gap-4">
                            <Card className="border-primary/10 bg-slate-900/20">
                                <CardContent className="pt-6">
                                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Mogul Partners</p>
                                    <p className="text-2xl font-bold font-mono mt-1">{syncedInstances?.length || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="border-primary/10 bg-slate-900/20">
                                <CardContent className="pt-6">
                                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Catalog Depth</p>
                                    <p className="text-2xl font-bold font-mono mt-1">{brandProducts?.length || 0}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-10">
                        <section className="space-y-10">
                            <div className="flex items-end justify-between border-b border-primary/10 pb-6">
                                <div>
                                    <h2 className="text-3xl font-bold font-headline text-slate-200">The Current Collection</h2>
                                    <p className="text-slate-500 mt-1">Elite masterworks available for immediate boutique cloning.</p>
                                </div>
                                <Badge variant="outline" className="h-8 border-primary/20 text-primary font-bold">
                                    {brandProducts?.length || 0} Assets Found
                                </Badge>
                            </div>

                            {!brandProducts || brandProducts.length === 0 ? (
                                <div className="h-96 flex flex-col items-center justify-center text-center border-2 border-dashed border-primary/10 rounded-3xl bg-slate-900/10">
                                    <Box className="h-16 w-16 text-slate-800 mb-4" />
                                    <h3 className="text-xl font-bold text-slate-400">Inventory Syncing...</h3>
                                    <p className="text-slate-600 max-w-xs mt-2">This brand is currently updating its Master Catalog entries.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {brandProducts.map((product) => (
                                        <Card key={product.id} className="group overflow-hidden rounded-3xl border-primary/10 bg-slate-900/40 hover:border-primary/40 transition-all duration-500 flex flex-col">
                                            <div className="relative aspect-square w-full overflow-hidden">
                                                <Image 
                                                    src={product.imageUrl} 
                                                    alt={product.name} 
                                                    fill 
                                                    className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                                                />
                                                <div className="absolute top-4 left-4">
                                                    <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-white font-mono text-[10px]">
                                                        SKU: {product.id.slice(0, 6)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-200 line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between border-y border-white/5 py-3">
                                                        <div className="space-y-0.5">
                                                            <p className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">Mogul Cost</p>
                                                            <p className="font-mono font-bold text-slate-200">{formatCurrency(Math.round(product.masterCost * 100))}</p>
                                                        </div>
                                                        <div className="text-right space-y-0.5">
                                                            <p className="text-[9px] uppercase font-black text-primary tracking-tighter">Rec. Retail</p>
                                                            <p className="font-mono font-bold text-primary">{formatCurrency(Math.round(product.retailPrice * 100))}</p>
                                                        </div>
                                                    </div>

                                                    <Button 
                                                        className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 rounded-xl"
                                                        onClick={() => handleQuickSync(product)}
                                                        disabled={syncingIds.has(product.id)}
                                                    >
                                                        {syncingIds.has(product.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Zap className="mr-2 h-4 w-4 fill-current" />
                                                                QUICK SYNC
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
