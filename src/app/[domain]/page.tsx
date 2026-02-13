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
    Rocket,
    ExternalLink,
    ChevronRight,
    Trophy,
    Target,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductGrid } from '@/components/store/product-grid';
import { StoreVisitorTracker } from '@/components/store/visitor-tracker';
import { useUserProfile } from '@/firebase/user-profile-provider';
import Link from 'next/link';
import { formatCurrency } from '@/utils/format';
import SomaLogo from '@/components/logo';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * @fileOverview Ambassador Portal UI
 * Rendered when domain is 'ambassador'
 * Features a high-fidelity landing state for prospects and a sleek command center for active partners.
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

    if (profileLoading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-primary" /></div>;

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';

    return (
        <div className="min-h-screen flex flex-col selection:bg-primary/30">
            {/* Dedicated Marketer Header */}
            <header className="p-6 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-primary/10 sticky top-0 z-50">
                <Link href={`https://${rootDomain}`} className="flex items-center gap-2 group">
                    <SomaLogo aria-hidden="true" className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                    <span className="font-headline font-bold text-xl text-primary tracking-tighter uppercase transition-opacity group-hover:opacity-80">SOMA</span>
                </Link>
                <div className="flex items-center gap-4">
                    {user ? (
                        <Button variant="ghost" asChild className="font-headline text-slate-400 hover:text-primary transition-colors">
                            <Link href="/dashboard">Executive Dashboard</Link>
                        </Button>
                    ) : (
                        <Button variant="ghost" asChild className="font-headline text-primary hover:text-primary/80 transition-all">
                            <Link href="/login">Partner Sign In</Link>
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full overflow-hidden">
                {!user ? (
                    /* High-Fidelity Prospect Landing State */
                    <div className="relative">
                        {/* Background Accents */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                        
                        <section className="container max-w-6xl mx-auto px-6 py-24 md:py-32 relative z-10 text-center space-y-16">
                            {/* Floating Hero Visual */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="space-y-8"
                            >
                                <div className="relative mx-auto w-fit">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 scale-150"
                                    />
                                    <div className="bg-primary/10 p-10 rounded-full border border-primary/30 shadow-gold-glow relative bg-black/40 backdrop-blur-sm">
                                        <Trophy className="h-24 w-24 text-primary" />
                                    </div>
                                </div>

                                <div className="space-y-6 max-w-3xl mx-auto">
                                    <h1 className="text-5xl md:text-7xl font-bold font-headline text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-primary tracking-tight leading-[1.1]">
                                        The Marketer Role
                                    </h1>
                                    <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed">
                                        Earn a flat <span className="text-primary font-bold">$5.00</span> bounty for every paid user you recruit. No inventory, no management—just results.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                                    <Button asChild size="lg" className="h-16 px-12 text-xl btn-gold-glow bg-primary font-black uppercase text-black group overflow-hidden relative">
                                        <Link href="/signup?planTier=AMBASSADOR&interval=free">
                                            <span className="relative z-10">Apply as Ambassador</span>
                                            <motion.div 
                                                className="absolute inset-0 bg-white/20"
                                                initial={{ x: '-100%' }}
                                                whileHover={{ x: '100%' }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="h-16 px-12 text-xl border-primary/30 text-primary hover:bg-primary/5 hover:border-primary transition-all">
                                        <Link href="/login">Partner Sign In</Link>
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Program Advantage Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                                {[
                                    { icon: DollarSign, title: "Pure Yield", desc: "Flat $5.00 cash bounty for every Mogul activation. Scale without limits." },
                                    { icon: Zap, title: "Recruit Incentive", desc: "Your recruits get 20% off all plans. Faster conversions, higher yield." },
                                    { icon: Activity, title: "Real-time Ops", desc: "Track conversions, clicks, and earnings via your strategic command center." }
                                ].map((item, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-8 rounded-2xl bg-slate-900/40 border border-primary/10 backdrop-blur-md text-left group hover:border-primary/30 transition-all"
                                    >
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-xl font-bold font-headline text-slate-100 mb-2">{item.title}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* How it Works Section */}
                            <div className="space-y-12 py-20 border-t border-primary/5">
                                <h2 className="text-3xl font-bold font-headline text-primary uppercase tracking-[0.3em]">The Workflow</h2>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
                                    {[
                                        { step: "01", title: "Join", desc: "Secure your ambassador credentials." },
                                        { step: "02", title: "Share", desc: "Distribute your universal link." },
                                        { step: "03", title: "Scale", desc: "Collect $5.00 per activation." }
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center flex-1 w-full max-w-xs group">
                                            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex-1 text-center space-y-2 group-hover:border-primary/20 transition-all">
                                                <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.4em]">{step.step}</span>
                                                <h4 className="text-lg font-bold text-slate-200">{step.title}</h4>
                                                <p className="text-xs text-slate-500">{step.desc}</p>
                                            </div>
                                            {i < 2 && <ChevronRight className="hidden md:block mx-4 text-primary/20" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    /* High-Fidelity Active Ambassador Dashboard */
                    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <motion.h1 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-4xl font-bold font-headline text-white flex items-center gap-3"
                                >
                                    <Target className="h-10 w-10 text-primary" />
                                    Command Center
                                </motion.h1>
                                <p className="text-slate-500 mt-2 text-sm uppercase tracking-[0.4em] font-black">Performance Telemetry</p>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 shadow-gold-glow flex items-center gap-4 min-w-[200px]">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">Yield Level</p>
                                    <p className="text-xl font-bold font-mono text-primary leading-none">$5.00 FLAT</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-primary/10 bg-slate-900/40 backdrop-blur-sm group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Marketing Yield</CardTitle>
                                    <DollarSign className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold text-slate-100 font-mono tracking-tighter">
                                        {formatCurrency(Math.round((userProfile?.totalReferralEarnings || 0) * 100))}
                                    </div>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-tighter mt-2 flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" /> Accrued Rewards
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-primary/10 bg-slate-900/40 backdrop-blur-sm group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Recruit Activity</CardTitle>
                                    <Users className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-4xl font-bold text-slate-100 font-mono tracking-tighter">{userProfile?.ambassadorData?.referralSignups || 0}</div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold">Paid Conversions</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-slate-400 font-mono tracking-tighter">{userProfile?.ambassadorData?.referralClicks || 0}</div>
                                            <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1 font-bold">Link Clicks</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-primary/10 bg-slate-900/40 backdrop-blur-sm group hover:border-primary/30 transition-all">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Partner Status</CardTitle>
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xl font-bold text-primary uppercase tracking-widest">VERIFIED</div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-bold">SOMA Affiliate Protocol Active</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-primary bg-primary/5 p-10 relative overflow-hidden shadow-2xl group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <LinkIcon className="h-48 w-48" />
                            </div>
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
                                <div className="space-y-6 text-center lg:text-left flex-1">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-black text-[10px] font-black uppercase tracking-[0.2em]">
                                        <Zap className="h-3 w-3 fill-current" /> Auto-Attribution Active
                                    </div>
                                    <h2 className="text-3xl font-bold font-headline text-white leading-tight">
                                        Universal Marketing Link
                                    </h2>
                                    <p className="text-slate-400 max-w-lg text-lg leading-relaxed">
                                        Recruits arriving via this link automatically unlock their **20% discount** and secure your **$5.00 bounty**.
                                    </p>
                                </div>
                                <div className="w-full lg:w-auto space-y-4">
                                    <div className="p-5 rounded-xl bg-black/60 border border-primary/20 font-mono text-sm text-primary break-all shadow-inner">
                                        {referralLink || 'Establishing secure link...'}
                                    </div>
                                    <Button onClick={handleCopy} size="lg" className="w-full h-14 btn-gold-glow bg-primary font-black uppercase text-black text-lg">
                                        <Copy className="mr-3 h-5 w-5" /> Copy Link
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" /> Protocol Compliance
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        "Bounties trigger upon successful first subscription processing.",
                                        "14-day hold period applies to prevent fraud and reversals.",
                                        "Self-referrals trigger immediate status revocation."
                                    ].map((rule, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/20 text-xs text-slate-400">
                                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">{i+1}</div>
                                            <p className="leading-relaxed">{rule}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-4 justify-end">
                                <Button asChild size="lg" className="h-16 text-lg font-black btn-gold-glow bg-primary text-black uppercase tracking-widest">
                                    <Link href="/dashboard/wallet">
                                        Access SOMA Wallet <DollarSign className="ml-2 h-6 w-6" />
                                    </Link>
                                </Button>
                                <Button variant="outline" size="lg" className="h-16 text-lg border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 uppercase tracking-widest font-bold">
                                    Marketing Toolkit
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            
            <footer className="p-12 border-t border-primary/10 bg-black/50 text-center relative z-10">
                <p className="text-[10px] uppercase tracking-[0.6em] text-slate-600 font-black">SOMA Strategic Assets Group</p>
            </footer>
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
                <Button variant="outline" className="border-primary/50" asChild>
                    <Link href={`https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com'}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Platform Home
                    </Link>
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
