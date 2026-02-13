'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDoc, useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit, or } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
    Zap,
    Award,
    TrendingUp,
    DollarSign,
    Users,
    Link as LinkIcon,
    Copy,
    Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductGrid } from '@/components/store/product-grid';
import { StoreVisitorTracker } from '@/components/store/visitor-tracker';
import { useUserProfile } from '@/firebase/user-profile-provider';
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';

/**
 * @fileOverview Ambassador Portal UI
 * Rendered when domain is 'ambassador'
 */
function AmbassadorPortal() {
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const { toast } = (require('@/hooks/use-toast')).useToast();
    const router = useRouter();

    const referralLink = userProfile?.referralCode 
        ? `https://somatoday.com/plan-selection?ref=${userProfile.referralCode}`
        : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        toast({ title: 'Link Secured', description: 'Your personalized marketing link is ready.' });
    };

    if (profileLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-center p-6">
                <Award className="h-16 w-16 text-primary mb-6" />
                <h1 className="text-4xl font-bold font-headline text-white mb-4">The Marketer Role</h1>
                <p className="text-slate-400 max-w-md mb-8">Earn a flat $5.00 for every paid Mogul you bring to the SOMA ecosystem. No inventory, pure performance.</p>
                <div className="flex gap-4">
                    <Button asChild size="lg" className="btn-gold-glow">
                        <Link href="/signup?planTier=AMBASSADOR&interval=free">Join as Ambassador</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/login">Partner Sign In</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 py-12 px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
                        <Award className="h-8 w-8" />
                        Ambassador Command Center
                    </h1>
                    <p className="text-slate-500">Track your yield and scale your marketing reach.</p>
                </div>
                <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-xl border border-primary/20">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Commission Tier</p>
                        <p className="text-xl font-bold font-mono text-primary">$5.00 FLAT</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/20 bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Marketing Yield</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-200">
                            {formatCurrency(Math.round((userProfile?.totalReferralEarnings || 0) * 100))}
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Lifetime Accrued Rewards</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/20 bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Paid Conversions</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-200">{userProfile?.activeReferralCount || 0}</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Strategic Partners Recruited</p>
                    </CardContent>
                </Card>
                <Card className="border-primary/20 bg-slate-900/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Ambassador Status</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-primary uppercase tracking-tighter">Verified Marketer</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Account Secure</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary bg-primary/5 p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <h2 className="text-2xl font-bold font-headline flex items-center justify-center md:justify-start gap-2 text-white">
                            <LinkIcon className="h-6 w-6 text-primary" />
                            Universal Marketing Link
                        </h2>
                        <p className="text-slate-400 max-w-md">
                            Direct recruits to the pricing page using this link. It automatically unlocks their **20% discount** and secures your **$5.00 bounty**.
                        </p>
                    </div>
                    <div className="w-full md:w-auto space-y-4">
                        <div className="p-4 rounded-lg bg-black/40 border border-primary/20 font-mono text-xs text-primary break-all">
                            {referralLink}
                        </div>
                        <Button onClick={handleCopy} className="w-full h-12 btn-gold-glow bg-primary font-black uppercase">
                            <Copy className="mr-2 h-4 w-4" /> Copy Link
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-primary/10 bg-slate-900/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-headline uppercase tracking-widest">Earnings Policy</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-500 space-y-3 leading-relaxed">
                        <p>1. Bounties are triggered once a recruit's first subscription payment is successfully processed.</p>
                        <p>2. Funds become available for withdrawal after a 14-day maturity period to prevent fraud.</p>
                        <p>3. Self-referrals are strictly prohibited and result in permanent ban and forfeiture.</p>
                    </CardContent>
                </Card>
                <div className="flex flex-col gap-4">
                    <Button asChild size="lg" className="h-16 text-lg font-bold">
                        <Link href="/dashboard/wallet">
                            Request Payout <DollarSign className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button variant="outline" size="lg" className="h-16 text-lg border-slate-800 text-slate-400">
                        View Recruitment History
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function TenantBoutiquePage() {
    const params = useParams();
    const identifier = params.domain as string; 
    const isAmbassadorPortal = identifier?.toLowerCase().startsWith('ambassador');
    
    if (isAmbassadorPortal) {
        return <AmbassadorPortal />;
    }

    const router = useRouter();
    const firestore = useFirestore();

    const storeQuery = useMemoFirebase(() => {
        if (!firestore || !identifier) return null;
        
        const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
        const normalizedIdentifier = identifier.toLowerCase();
        
        let slug = normalizedIdentifier;
        if (normalizedIdentifier.endsWith(`.${rootDomain}`)) {
            slug = normalizedIdentifier.replace(`.${rootDomain}`, '');
        }
        if (slug.startsWith('www.')) {
            slug = slug.replace('www.', '');
        }

        return query(
            collection(firestore, 'stores'),
            or(
                where('userId', '==', slug), 
                where('customDomain', '==', normalizedIdentifier), 
                where('slug', '==', slug) 
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

    const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

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
                <p className="text-muted-foreground text-center max-w-sm">
                    The boutique at "{identifier}" is not currently provisioned in our network.
                </p>
                <Button variant="outline" className="border-primary/50" onClick={() => window.location.href = `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com'}`}>
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
                                <img src={storeData.logoUrl || ownerProfile?.avatarUrl} alt={storeName} className="h-full w-full object-cover" />
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

            <main className="container py-16 px-4 sm:px-6 lg:px-8 mx-auto">
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
