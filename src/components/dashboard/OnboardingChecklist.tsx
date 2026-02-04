'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview A high-end onboarding checklist for Moguls.
 * Tracks payment status, branding assets, inventory sync, and theme selection.
 */

export function OnboardingChecklist() {
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();

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

    if (isLoading) {
        return (
            <Card className="border-primary/50 min-h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <Card className="border-primary/50 bg-card/50 backdrop-blur-sm shadow-xl">
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
    );
}
