'use client';
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Building, Gem, Rocket, ShoppingBag, ShieldCheck, Tag, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import SomaLogo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";

type Interval = 'monthly' | 'yearly';

const plans = [
    {
        id: 'SCALER',
        title: 'Scaler',
        icon: Rocket,
        description: 'Dropship Flex. Start dropshipping with standard fulfillment.',
        features: ['One-Click Cloning', 'Sync from Master Catalog', 'Standard Fulfillment'],
        bestValue: false,
        pricing: {
            monthly: { price: 29 },
            yearly: { price: 290 },
        }
    },
    {
        id: 'MERCHANT',
        title: 'Merchant',
        icon: ShoppingBag,
        description: 'Store Only. Perfect for selling your own creations.',
        features: ['"Add My Own Product" tools', 'Private Inventory Management', 'Standard Support'],
        bestValue: false,
        pricing: {
            monthly: { price: 19.99 },
            yearly: { price: 199 },
        }
    },
    {
        id: 'ENTERPRISE',
        title: 'Enterprise',
        icon: Building,
        description: 'The Hybrid. The ultimate flexibility for established businesses.',
        features: ['Everything Unlocked', 'Mix private & SOMA stock', 'Dedicated Account Manager'],
        bestValue: false,
        pricing: {
            monthly: { price: 33.33 },
            yearly: { price: 333 },
        }
    },
    {
        id: 'SELLER',
        title: 'Seller',
        icon: Gem,
        description: 'Supply products with zero upfront cost.',
        features: ['9% commission on sales', 'Upload items to Master Catalog', 'Sell to all SOMA stores'],
        bestValue: false,
        pricing: {
            free: { price: 0 }
        }
    },
     {
        id: 'BRAND',
        title: 'Brand',
        icon: ShieldCheck,
        description: 'For established brands. Lower fees & priority.',
        features: ['3% commission on sales', 'Unlimited product uploads', 'Priority support & review'],
        bestValue: false,
        pricing: {
            monthly: { price: 21 },
            yearly: { price: 210 },
        }
    }
];

function PlanSelectionContent() {
    const [selectedPlan, setSelectedPlan] = useState('SCALER');
    const [interval, setInterval] = useState<Interval>('monthly');
    const router = useRouter();
    const searchParams = useSearchParams();
    const firestore = useFirestore();
    
    const referralCode = searchParams.get('ref');
    const isDiscounted = !!referralCode;

    // Click Tracking Logic
    useEffect(() => {
        if (referralCode && firestore) {
            const trackClick = async () => {
                const referralQuery = query(collection(firestore, 'users'), where('referralCode', '==', referralCode.toUpperCase()));
                const querySnapshot = await getDocs(referralQuery);
                if (!querySnapshot.empty) {
                    const referrerRef = doc(firestore, 'users', querySnapshot.docs[0].id);
                    await updateDoc(referrerRef, {
                        "ambassadorData.referralClicks": increment(1)
                    }).catch(console.error);
                }
            };
            trackClick();
        }
    }, [referralCode, firestore]);

    const handleConfirm = () => {
        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) return;
        
        let planInterval: string = interval;
        if (plan.pricing.free) planInterval = 'free';

        router.push(`/signup?planTier=${selectedPlan}&interval=${planInterval}${referralCode ? `&ref=${referralCode}` : ''}`);
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto"/>
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Choose Your Empire's Foundation</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select a plan that scales with your ambition.</p>
                {isDiscounted && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 flex items-center justify-center gap-2 text-green-500 font-bold bg-green-500/10 py-2 px-4 rounded-full border border-green-500/20 max-w-fit mx-auto"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>Ambassador Deal: 20% Discount Unlocked</span>
                    </motion.div>
                )}
            </div>

            <Tabs value={interval} onValueChange={(value) => setInterval(value as Interval)} className="w-full max-w-sm mb-8">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full">
                {plans.map(plan => {
                    const Icon = plan.icon;
                    // @ts-ignore
                    const priceInfo = plan.pricing.free || plan.pricing[interval];
                    const isYearly = !plan.pricing.free && interval === 'yearly';
                    
                    const basePrice = priceInfo.price;
                    const finalPrice = isDiscounted && plan.id !== 'SELLER' ? basePrice * 0.8 : basePrice;

                    return (
                    <Card 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={cn(
                            "relative cursor-pointer transition-all duration-300 border-2 bg-card flex flex-col",
                            selectedPlan === plan.id ? 'border-primary shadow-2xl shadow-primary/20' : 'border-border/20 hover:border-primary/40'
                        )}
                    >
                         {isYearly && !isDiscounted && (
                             <Badge className="absolute top-3 left-3 bg-green-500/20 text-green-400 border-green-500/50">Save 15%</Badge>
                        )}
                        {isDiscounted && plan.id !== 'SELLER' && (
                             <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground font-black">20% DISCOUNT APPLIED</Badge>
                        )}
                        <CardHeader className="text-center items-center">
                            <div className="bg-primary/10 rounded-full p-4 mb-4 border border-primary/20">
                                <Icon className="h-10 w-10 text-primary"/>
                            </div>
                            <CardTitle className="font-headline text-2xl text-foreground">{plan.title}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                             <div className="flex items-baseline gap-2">
                               <span className="text-4xl font-extrabold text-primary">
                                   ${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2})}
                               </span> 
                               <span className="text-muted-foreground">
                                    {plan.pricing.free ? '' : `/${interval === 'monthly' ? 'mo' : 'yr'}`}
                                </span>
                            </div>
                            {isDiscounted && plan.id !== 'SELLER' && (
                                <p className="text-[10px] text-muted-foreground line-through font-mono">Was ${basePrice.toFixed(2)}</p>
                            )}
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ul className="space-y-3">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                                        <span className="text-muted-foreground text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )})}
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
