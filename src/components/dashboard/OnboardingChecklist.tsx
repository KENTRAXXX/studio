'use client';

import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
    CheckCircle2, 
    Circle, 
    Loader2, 
    Rocket, 
    Copy, 
    Instagram, 
    Check, 
    Sparkles, 
    ExternalLink 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview A high-end onboarding checklist for Moguls.
 * Tracks payment status, branding assets, inventory sync, and theme selection.
 * Triggers a graduation flow once 100% complete.
 */

export function OnboardingChecklist() {
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

    // Data fetching for checklist logic
    const storeRef = useMemoFirebase(() => (user && firestore ? doc(firestore, 'stores', user.uid) : null), [user, firestore]);
    const { data: storeData, loading: storeLoading } = useDoc<any>(storeRef);

    const productsRef = useMemoFirebase(() => (user && firestore ? collection(firestore, `stores/${user.uid}/products`) : null), [user, firestore]);
    const { data: products, loading: productsLoading } = useCollection<any>(productsRef);

    const isLoading = profileLoading || storeLoading || productsLoading;

    const checklist = useMemo(() => {
        if (!userProfile) return { items: [], progress: 0, completedCount: 0 };

        const hasPaid = !!userProfile.hasAccess;
        const logoUploaded = !!storeData?.logoUrl;
        const productsSynced = !!(products && products.length > 0);
        const themeSelected = !!storeData?.themeConfig;

        const items = [
            { label: 'Payment Verification', complete: hasPaid },
            { label: 'Brand Logo Uploaded', complete: logoUploaded },
            { label: 'Initial Products Synced', complete: productsSynced },
            { label: 'Storefront Theme Selected', complete: themeSelected },
        ];

        const completedCount = items.filter(i => i.complete).length;
        const progress = Math.round((completedCount / items.length) * 100);

        return { items, progress, completedCount };
    }, [userProfile, storeData, products]);

    const boutiqueUrl = useMemo(() => {
        if (!storeData) return '';
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';
        if (storeData.customDomain && storeData.domainStatus === 'connected') {
            return `https://${storeData.customDomain}`;
        }
        if (storeData.slug) {
            return `https://${storeData.slug}.${rootDomain}`;
        }
        return `https://${rootDomain}/store/${user?.uid}`;
    }, [storeData, user?.uid]);

    const triggerGoldConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ 
                ...defaults, 
                particleCount, 
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
                colors: ['#DAA520', '#FFD700', '#F0E68C']
            });
            confetti({ 
                ...defaults, 
                particleCount, 
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
                colors: ['#DAA520', '#FFD700', '#F0E68C']
            });
        }, 250);
    };

    // Graduation Logic
    useEffect(() => {
        if (checklist.progress === 100 && !userProfile?.live && !hasTriggeredConfetti) {
            setHasTriggeredConfetti(true);
            triggerGoldConfetti();
            setIsSuccessModalOpen(true);
        }
    }, [checklist.progress, userProfile?.live, hasTriggeredConfetti]);

    const handleMarkAsLive = async () => {
        if (!user || !firestore) return;
        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { live: true });
            setIsSuccessModalOpen(false);
            toast({
                title: 'Empire Activated',
                description: 'Your store is now officially part of the SOMA network.',
            });
        } catch (e) {
            console.error("Failed to update live status", e);
        }
    };

    const handleCopyLink = () => {
        if (!boutiqueUrl) return;
        navigator.clipboard.writeText(boutiqueUrl);
        toast({
            title: 'Link Secured',
            description: 'Boutique URL copied to clipboard.',
            action: <Check className="h-4 w-4 text-green-500" />
        });
    };

    if (isLoading) {
        return (
            <Card className="border-primary/50 min-h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <>
            <Dialog open={isSuccessModalOpen} onOpenChange={(open) => !open && handleMarkAsLive()}>
                <DialogContent className="bg-card border-primary p-10 text-center sm:max-w-lg">
                    <DialogHeader>
                        <div className="mx-auto bg-primary/10 rounded-full p-6 w-fit mb-6 border border-primary/20">
                            <Rocket className="h-16 w-16 text-primary animate-bounce" />
                        </div>
                        <DialogTitle className="text-4xl font-bold font-headline text-primary">
                            Your Boutique is Live!
                        </DialogTitle>
                        <DialogDescription className="text-xl font-medium text-foreground pt-4">
                            You are now an official <span className="text-primary font-black uppercase tracking-widest">SOMA Mogul</span>.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-8 space-y-6">
                        <p className="text-muted-foreground leading-relaxed">
                            Your luxury storefront is configured and ready for the world. Start sharing your curated collection and build your legacy.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                                onClick={handleCopyLink} 
                                variant="outline" 
                                className="flex-1 h-14 text-lg border-primary/30 hover:bg-primary/5"
                            >
                                <Copy className="mr-2 h-5 w-5" /> Copy Link
                            </Button>
                            <Button 
                                className="flex-1 h-14 text-lg bg-gradient-to-tr from-purple-600 to-orange-500 hover:opacity-90 border-none"
                                onClick={() => toast({ title: 'Sharing Feature', description: 'Instagram Direct Share coming in v2.0' })}
                            >
                                <Instagram className="mr-2 h-5 w-5" /> Instagram
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center">
                        <Button 
                            asChild
                            className="w-full h-16 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black"
                        >
                            <Link href={boutiqueUrl} target="_blank">
                                ENTER MY EMPIRE <ExternalLink className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="border-primary/50 bg-card/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="h-24 w-24 text-primary" />
                </div>
                
                <CardHeader className="pb-6">
                    <div className="flex items-center justify-between mb-3">
                        <CardTitle className="text-xl font-headline font-bold text-primary uppercase tracking-tight">Onboarding Pulse</CardTitle>
                        <span className="text-sm font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {checklist.progress}% COMPLETE
                        </span>
                    </div>
                    <Progress value={checklist.progress} className="h-2 bg-muted border border-primary/20" />
                </CardHeader>
                <CardContent>
                    <ul className="space-y-5 pt-2">
                        {checklist.items.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-4 transition-all duration-300">
                                <div className="shrink-0">
                                    {item.complete ? (
                                        <div className="bg-primary/20 rounded-full p-1 border border-primary/50">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                        </div>
                                    ) : (
                                        <div className="bg-muted rounded-full p-1 border border-border">
                                            <Circle className="h-5 w-5 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-lg font-medium transition-all duration-500",
                                    item.complete 
                                        ? "text-muted-foreground line-through opacity-40 italic" 
                                        : "text-foreground"
                                )}>
                                    {item.label}
                                </span>
                            </li>
                        ))}
                    </ul>
                    
                    {checklist.progress === 100 && (
                        <div className="mt-8 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-center animate-in zoom-in duration-500">
                            <p className="text-sm font-bold text-green-400">EMPIRE READY FOR GLOBAL DEPLOYMENT</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
