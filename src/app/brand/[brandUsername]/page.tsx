'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUserProfile, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    ShieldCheck, 
    Instagram, 
    Globe, 
    MessageSquare, 
    Loader2, 
    ArrowLeft,
    Box,
    ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Dynamic Brand Profile Page
 * Viewable by logged-in Moguls and Admins to discover and vet strategic partners.
 */

export default function BrandProfilePage() {
    const params = useParams();
    const router = useRouter();
    const brandUsername = params.brandUsername as string; // Treated as userId/slug
    
    const { userProfile: viewerProfile, loading: viewerLoading } = useUserProfile();
    const firestore = useFirestore();
    
    const brandRef = useMemoFirebase(() => {
        if (!firestore || !brandUsername) return null;
        return doc(firestore, 'users', brandUsername);
    }, [firestore, brandUsername]);

    const { data: brandProfile, loading: brandLoading } = useDoc<any>(brandRef);

    const isLoading = viewerLoading || brandLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    // Permission Logic: Elite gatekeeping for Moguls, Admins, and the Owner
    const isMogul = viewerProfile?.userRole === 'MOGUL';
    const isAdmin = viewerProfile?.userRole === 'ADMIN';
    const isOwner = viewerProfile?.id === brandUsername;

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
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Hero Section: Luxury Immersion */}
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
                        <ArrowLeft className="mr-2 h-4 w-4" /> Return to Backstage
                    </Button>

                    <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                        {/* Logo / Avatar */}
                        <div className="relative h-40 w-40 rounded-3xl overflow-hidden border-4 border-background bg-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shrink-0">
                            {brandProfile.avatarUrl ? (
                                <Image src={brandProfile.avatarUrl} alt={brandName} fill className="object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-5xl font-bold text-primary bg-primary/10">
                                    {brandName.charAt(0)}
                                </div>
                            )}
                        </div>

                        {/* Brand Metadata */}
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <h1 className="text-5xl font-bold font-headline tracking-tighter text-white drop-shadow-md">
                                    {brandName}
                                </h1>
                                {isVerified && (
                                    <Badge className="bg-primary text-primary-foreground font-black px-4 py-1.5 text-xs animate-gold-pulse flex items-center gap-1.5 rounded-full">
                                        <ShieldCheck className="h-4 w-4" />
                                        SOMA VERIFIED
                                    </Badge>
                                )}
                            </div>
                            <p className="text-slate-300 text-xl max-w-3xl italic font-medium leading-relaxed drop-shadow-sm">
                                "{brandProfile.brandBio || "Defining excellence in the global luxury marketplace through curated supply and absolute authenticity."}"
                            </p>
                        </div>

                        {/* Connection Controls */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {brandProfile.socialLinks?.instagram && (
                                    <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 transition-all" asChild>
                                        <a href={`https://instagram.com/${brandProfile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer">
                                            <Instagram className="h-5 w-5" />
                                        </a>
                                    </Button>
                                )}
                                {brandProfile.socialLinks?.x && (
                                    <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/50 transition-all" asChild>
                                        <a href={`https://x.com/${brandProfile.socialLinks.x}`} target="_blank" rel="noopener noreferrer">
                                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                        </a>
                                    </Button>
                                )}
                            </div>
                            <Button className="btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-14 px-8 text-lg shadow-2xl">
                                <MessageSquare className="mr-2 h-5 w-5" /> Contact Partner
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insight & Catalog Exploration */}
            <div className="container py-16 px-4 sm:px-6 lg:px-8 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Sidebar: Performance Audit */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="border-primary/20 bg-slate-900/30 overflow-hidden shadow-xl">
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase font-black text-primary/60 tracking-[0.2em]">Operational Tenure</p>
                                    <p className="text-lg font-semibold text-slate-200">
                                        Strategic Partner since {brandProfile.paidAt ? new Date(brandProfile.paidAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'July 2024'}
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 text-center space-y-1">
                                        <p className="text-3xl font-bold text-primary font-mono tracking-tighter">150+</p>
                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Active Syncs</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 text-center space-y-1">
                                        <p className="text-3xl font-bold text-primary font-mono tracking-tighter">99.2%</p>
                                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Trust Score</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Average Ship Time</span>
                                        <span className="font-bold text-slate-200">2.4 Days</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Inventory Status</span>
                                        <span className="text-green-500 font-bold flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Optimal
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 gap-4">
                            <Button variant="outline" className="justify-start border-primary/20 h-16 text-lg rounded-2xl hover:bg-primary/5 transition-all group">
                                <Box className="mr-4 h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                                Explore Inventory
                            </Button>
                            <Button variant="outline" className="justify-start border-primary/20 h-16 text-lg rounded-2xl hover:bg-primary/5 transition-all group">
                                <Globe className="mr-4 h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                                Brand Guidelines
                                <ExternalLink className="ml-auto h-4 w-4 opacity-30" />
                            </Button>
                        </div>
                    </div>

                    {/* Main Feed: Narrative & Masterworks */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="space-y-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-3xl font-bold font-headline text-slate-200">The Strategic Narrative</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
                            </div>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-slate-400 text-xl leading-[1.8] font-medium italic">
                                    {brandProfile.brandBio || "This partner represents the pinnacle of luxury logistics within the SOMA network. Every asset supplied to the Master Catalog undergoes rigorous authenticity verification to ensure Mogul storefronts maintain the highest standard of prestige."}
                                </p>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-3xl font-bold font-headline text-slate-200 flex items-center gap-4">
                                    <Box className="h-8 w-8 text-primary" />
                                    Featured Masterworks
                                </h2>
                                <Button variant="link" className="text-primary font-bold">View Catalog &rarr;</Button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="group relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/5 bg-slate-900/50 shadow-2xl transition-all hover:border-primary/30">
                                        <Image 
                                            src={`https://images.unsplash.com/photo-${1600000000000 + i * 1000000}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080`} 
                                            alt="Featured Item" 
                                            fill 
                                            className="object-cover opacity-20 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                                            data-ai-hint="luxury product"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end">
                                            <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">Master Catalog SKU #{i}00{i}</p>
                                                <h3 className="text-xl font-bold text-white mb-4">Elite Collection Item {i}</h3>
                                                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                                                    <span className="text-sm font-bold text-slate-400">Synced by 24 Stores</span>
                                                    <Button size="sm" className="h-8 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full text-[10px] font-black uppercase">Inspect Details</Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
