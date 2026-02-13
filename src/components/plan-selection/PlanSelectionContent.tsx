
'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Building, Gem, Rocket, ShoppingBag, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import SomaLogo from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { TIER_REGISTRY, type PlanTier } from "@/lib/tiers";

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
            monthly: { price: 29, discounted: 23 },
            yearly: { price: 290, discounted: 230 },
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
            monthly: { price: 19.99, discounted: 15.00 },
            yearly: { price: 199, discounted: 150 },
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
            monthly: { price: 33.33, discounted: 26.66 },
            yearly: { price: 333, discounted: 266 },
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
            monthly: { price: 21, discounted: 16.80 },
            yearly: { price: 210, discounted: 168 },
        }
    }
];

export default function PlanSelectionContent() {
    const [selectedPlan, setSelectedPlan] = useState('SCALER');
    const [interval, setInterval] = useState<Interval>('monthly');
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. PERSISTENT REFERRAL PROTOCOL
    // Secure the ref code in a 30-day cookie to protect Ambassador yield
    useEffect(() => {
        const refParam = searchParams.get('ref');
        if (refParam) {
            document.cookie = `soma_referral_code=${refParam.toUpperCase()}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        }
    }, [searchParams]);

    const getReferralCode = () => {
        const param = searchParams.get('ref');
        if (param) return param.toUpperCase();
        
        const cookie = document.cookie.split('; ').find(row => row.startsWith('soma_referral_code='));
        return cookie ? cookie.split('=')[1] : null;
    };

    const referralCode = getReferralCode();
    const isAmbassadorFlow = !!referralCode;

    const handleConfirm = () => {
        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) return;
        
        let planInterval: string = interval;
        if (plan.pricing.free) planInterval = 'free';

        // Carry the referral code to the signup flow
        const refString = referralCode ? `&ref=${referralCode}` : '';
        router.push(`/signup?planTier=${selectedPlan}&interval=${planInterval}${refString}`);
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 pb-24">
            <div className="text-center mb-10">
                <div className="relative mx-auto w-fit mb-4">
                    <SomaLogo className="h-12 w-12" />
                    {isAmbassadorFlow && (
                        <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            className="absolute -top-2 -right-2 bg-primary text-black rounded-full p-1"
                        >
                            <Sparkles className="h-3 w-3" />
                        </motion.div>
                    )}
                </div>
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Choose Your Empire's Foundation</h1>
                
                {isAmbassadorFlow ? (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
                        <Zap className="h-4 w-4 animate-pulse" />
                        <span className="text-sm font-black uppercase tracking-widest">Ambassador Discount Applied (20% OFF)</span>
                    </div>
                ) : (
                    <p className="mt-2 text-lg text-muted-foreground">Select a plan that scales with your ambition.</p>
                )}
            </div>

            <Tabs value={interval} onValueChange={(value) => setInterval(value as Interval)} className="w-full max-w-sm mb-12">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-primary/10">
                    <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-black">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly" className="data-[state=active]:bg-primary data-[state=active]:text-black">Yearly</TabsTrigger>
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl w-full">
                {plans.map(plan => {
                    const Icon = plan.icon;
                    const priceInfo = plan.pricing.free || plan.pricing[interval];
                    const isYearly = !plan.pricing.free && interval === 'yearly';
                    
                    const displayPrice = (isAmbassadorFlow && priceInfo.discounted) ? priceInfo.discounted : priceInfo.price;
                    const originalPrice = priceInfo.price;

                    return (
                    <Card 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={cn(
                            "relative cursor-pointer transition-all duration-500 border-2 bg-card/50 backdrop-blur-sm flex flex-col group",
                            selectedPlan === plan.id ? 'border-primary shadow-2xl shadow-primary/20 scale-[1.02]' : 'border-primary/10 hover:border-primary/40'
                        )}
                    >
                        {plan.bestValue && (
                             <div className="absolute -top-3 -right-3 z-10">
                                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center font-bold shadow-gold-glow">
                                    <Star className="h-6 w-6"/>
                                </div>
                            </div>
                        )}
                         {isYearly && (
                             <Badge className="absolute top-4 left-4 bg-green-500/20 text-green-400 border-green-500/50 uppercase text-[10px] font-black tracking-widest">Save 15%</Badge>
                        )}
                        <CardHeader className="text-center items-center pt-10">
                            <div className="bg-primary/10 rounded-full p-5 mb-6 border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                <Icon className="h-10 w-10 text-primary"/>
                            </div>
                            <CardTitle className="font-headline text-2xl text-foreground mb-1">{plan.title}</CardTitle>
                            <CardDescription className="min-h-[40px] px-4">{plan.description}</CardDescription>
                             <div className="flex flex-col items-center mt-4">
                               <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-extrabold text-primary">${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2})}</span> 
                                    <span className="text-muted-foreground text-sm">
                                        {plan.pricing.free ? '' : `/${interval === 'monthly' ? 'mo' : 'yr'}`}
                                    </span>
                               </div>
                               {isAmbassadorFlow && priceInfo.discounted && (
                                   <p className="text-xs text-muted-foreground line-through mt-1 opacity-50">Standard: ${originalPrice}</p>
                               )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow pt-6">
                            <ul className="space-y-4">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Check className="h-3 w-3 text-primary" />
                                        </div>
                                        <span className="text-slate-300 text-sm font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )})}
            </div>

            <div className="fixed bottom-8 left-0 right-0 px-4 flex justify-center z-40">
                <Button size="lg" className="w-full max-w-md h-16 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em]" onClick={handleConfirm}>
                    Proceed to Initialization <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
            </div>
        </div>
    );
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    )
}
