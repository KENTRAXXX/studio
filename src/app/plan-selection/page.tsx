'use client';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Building, Gem, Rocket, ShoppingBag, ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import TradeWyseLogo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { motion } from "framer-motion";
import { TIER_REGISTRY, PlanTier } from "@/lib/tiers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Interval = 'monthly' | 'yearly';

const planIds: PlanTier[] = ['SCALER', 'MERCHANT', 'ENTERPRISE', 'SELLER', 'BRAND'];
const planIcons: Record<string, any> = {
    SCALER: Rocket,
    MERCHANT: ShoppingBag,
    ENTERPRISE: Building,
    SELLER: Gem,
    BRAND: ShieldCheck
};
const planDescriptions: Record<string, string> = {
    SCALER: 'Dropship Flex. Start dropshipping with standard fulfillment.',
    MERCHANT: 'Store Only. Perfect for selling your own creations.',
    ENTERPRISE: 'The Hybrid. The ultimate flexibility for established businesses.',
    SELLER: 'Supply products with zero upfront cost.',
    BRAND: 'For established brands. Lower fees & priority.'
};

function PlanSelectionContent() {
    const [selectedPlan, setSelectedPlan] = useState('SCALER');
    const [interval, setInterval] = useState<Interval>('monthly');
    const [entityType, setEntityType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
    const [isReferralValid, setIsReferralValid] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    
    const referralCode = searchParams.get('ref');

    // Dynamic Platform Config Listener
    const configRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'platform_metadata', 'config');
    }, [firestore]);
    const { data: config } = useDoc<any>(configRef);

    const discountMultiplier = config?.recruitDiscount ? (1 - (config.recruitDiscount / 100)) : 0.8;

    // Click Tracking & Role Validation Logic
    useEffect(() => {
        if (referralCode && firestore) {
            const verifyReferral = async () => {
                const referralQuery = query(
                    collection(firestore, 'users'), 
                    where('referralCode', '==', referralCode.toUpperCase()),
                    where('userRole', '==', 'AMBASSADOR') 
                );
                const querySnapshot = await getDocs(referralQuery);
                if (!querySnapshot.empty) {
                    setIsReferralValid(true);
                    const referrerRef = doc(firestore, 'users', querySnapshot.docs[0].id);
                    await updateDoc(referrerRef, {
                        "ambassadorData.referralClicks": increment(1)
                    }).catch(console.error);
                }
            };
            verifyReferral();
        }
    }, [referralCode, firestore]);

    const handleConfirm = () => {
        const plan = TIER_REGISTRY[selectedPlan as PlanTier];
        if (!plan) return;
        
        let planInterval: string = interval;
        if (plan.price.free) planInterval = 'free';

        router.push(`/signup?planTier=${selectedPlan}&interval=${planInterval}&entityType=${entityType}${referralCode ? `&ref=${referralCode}` : ''}`);
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6">
            <div className="text-center mb-10">
                <TradeWyseLogo className="h-12 w-12 mx-auto"/>
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Choose Your Empire's Foundation</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select a plan that scales with your ambition.</p>
                {isReferralValid && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center justify-center gap-2 text-green-500 font-bold bg-green-500/10 py-2 px-4 rounded-full border border-green-500/20 max-w-fit mx-auto"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>Ambassador Deal: {config?.recruitDiscount || 20}% Discount Unlocked</span>
                    </motion.div>
                )}
            </div>

            <div className="flex flex-col items-center gap-6 mb-8">
                <Tabs value={interval} onValueChange={(value) => setInterval(value as Interval)} className="w-full max-w-sm">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly">Yearly</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center space-x-4 bg-muted/30 p-2 px-4 rounded-full border border-border/50 backdrop-blur-sm">
                    <Label htmlFor="entity-toggle" className={cn("text-sm font-bold transition-colors", entityType === 'INDIVIDUAL' ? "text-primary" : "text-muted-foreground")}>Individual</Label>
                    <Switch 
                        id="entity-toggle" 
                        checked={entityType === 'BUSINESS'} 
                        onCheckedChange={(checked) => setEntityType(checked ? 'BUSINESS' : 'INDIVIDUAL')} 
                    />
                    <Label htmlFor="entity-toggle" className={cn("text-sm font-bold transition-colors", entityType === 'BUSINESS' ? "text-primary" : "text-muted-foreground")}>Business / Corporate</Label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full">
                {planIds.map(id => {
                    const tier = TIER_REGISTRY[id];
                    const Icon = planIcons[id];
                    const isYearly = !tier.price.free && interval === 'yearly';
                    
                    const basePrice = tier.price[interval] || 0;
                    const surcharge = entityType === 'BUSINESS' ? (tier.businessSurcharge[interval] || 0) : 0;
                    const totalPrice = basePrice + surcharge;
                    const isFree = tier.price.free;
                    
                    const finalPrice = isReferralValid && id !== 'SELLER' ? totalPrice * discountMultiplier : totalPrice;

                    return (
                        <Card 
                            key={id}
                            onClick={() => setSelectedPlan(id)}
                            className={cn(
                                "relative cursor-pointer transition-all duration-300 border-2 bg-card/50 backdrop-blur-md flex flex-col group",
                                selectedPlan === id ? 'border-primary shadow-2xl shadow-primary/20 scale-[1.02] z-10' : 'border-border/20 hover:border-primary/40'
                            )}
                        >
                             {isYearly && !isReferralValid && !isFree && (
                                 <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500/20 text-green-400 border-green-500/50">Save 15%</Badge>
                            )}
                            {isReferralValid && id !== 'SELLER' && (
                                 <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground font-black">{config?.recruitDiscount || 20}% DISCOUNT</Badge>
                            )}
                            
                            <CardHeader className="text-center items-center pb-2">
                                <div className={cn(
                                    "rounded-full p-4 mb-4 border transition-colors",
                                    selectedPlan === id ? "bg-primary/20 border-primary/40" : "bg-primary/5 border-primary/10 group-hover:bg-primary/10"
                                )}>
                                    <Icon className="h-8 w-8 text-primary"/>
                                </div>
                                <CardTitle className="font-headline text-2xl text-foreground uppercase italic tracking-tight">{tier.label}</CardTitle>
                                <CardDescription className="min-h-[40px] text-xs leading-relaxed">{planDescriptions[id]}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-grow space-y-6">
                                <div className="text-center border-y border-primary/10 py-4 my-2">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-headline font-black text-white">
                                            {isFree ? "FREE" : `$${finalPrice.toFixed(2)}`}
                                        </span>
                                        {!isFree && <span className="text-xs text-muted-foreground font-bold tracking-widest uppercase">/ {interval}</span>}
                                    </div>
                                    {entityType === 'BUSINESS' && surcharge > 0 && (
                                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter mt-1">
                                            Includes ${surcharge.toFixed(2)} Corporate Surcharge
                                        </p>
                                    )}
                                    {isReferralValid && id !== 'SELLER' && (
                                        <p className="text-[10px] text-muted-foreground line-through font-mono mt-1 opacity-50">Was ${totalPrice.toFixed(2)}</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">Tier Benefits</p>
                                        <ul className="space-y-2">
                                            <li className="flex items-baseline gap-2 text-xs text-muted-foreground">
                                                <Check className="h-3 w-3 text-primary flex-shrink-0 translate-y-0.5" />
                                                <span>{entityType === 'BUSINESS' ? tier.teamSeats.business : tier.teamSeats.individual} Included User Seat(s)</span>
                                            </li>
                                            <li className="flex items-baseline gap-2 text-xs text-muted-foreground capitalize">
                                                <Check className="h-3 w-3 text-primary flex-shrink-0 translate-y-0.5" />
                                                <span>{tier.supportLevel} Strategic Support</span>
                                            </li>
                                            {tier.aiCreditsMonthly > 0 && (
                                                <li className="flex items-baseline gap-2 text-xs text-muted-foreground">
                                                    <Check className="h-3 w-3 text-primary flex-shrink-0 translate-y-0.5" />
                                                    <span>{entityType === 'BUSINESS' ? Math.floor(tier.aiCreditsMonthly * 1.5) : tier.aiCreditsMonthly} Monthly AI Credits</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">Core Capabilities</p>
                                        <ul className="space-y-1.5">
                                            {tier.features.dropshipping && (
                                                <li className="flex items-baseline gap-2 text-xs text-muted-foreground">
                                                    <div className="h-1 w-1 bg-primary rounded-full translate-y-1.5" />
                                                    <span>Global Dropshipping Flex</span>
                                                </li>
                                            )}
                                            {tier.features.privateInventory && (
                                                <li className="flex items-baseline gap-2 text-xs text-muted-foreground">
                                                    <div className="h-1 w-1 bg-primary rounded-full translate-y-1.5" />
                                                    <span>Private Inventory Vault</span>
                                                </li>
                                            )}
                                            {tier.features.customDomains && (
                                                <li className="flex items-baseline gap-2 text-xs text-muted-foreground">
                                                    <div className="h-1 w-1 bg-primary rounded-full translate-y-1.5" />
                                                    <span>Custom Boutique Domain</span>
                                                </li>
                                            )}
                                            <li className="flex items-baseline gap-2 text-xs text-muted-foreground">
                                                <div className="h-1 w-1 bg-primary rounded-full translate-y-1.5" />
                                                <span className="capitalize">{tier.features.analytics} Analytics Suite</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Button size="lg" className="mt-10 w-full max-w-xs h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold" onClick={handleConfirm}>
                Confirm Selection
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-6 max-w-md">
                All plans include custom domain mapping and unlimited product imports.
            </p>
        </div>
    );
}

export default function PlanSelectionPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
            <PlanSelectionContent />
        </Suspense>
    );
}
