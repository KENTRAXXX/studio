'use client';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Building, Gem, Rocket, ShoppingBag, ShieldCheck, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import SomaLogo from "@/components/logo";
import { Badge } from "@/components/ui/badge";

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
            monthly: { price: 19.99, discounted: 15.99 },
            yearly: { price: 199, discounted: 159 },
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
    }
];

export default function PlanSelectionPage() {
    const [selectedPlan, setSelectedPlan] = useState('SCALER');
    const [interval, setInterval] = useState<Interval>('monthly');
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const ambassadorCode = searchParams.get('ref');
    const isDiscounted = !!ambassadorCode;

    const handleConfirm = () => {
        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) return;
        
        let url = `/signup?planTier=${selectedPlan}&interval=${interval}`;
        if (ambassadorCode) url += `&ref=${ambassadorCode}`;

        router.push(url);
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto"/>
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Choose Your Empire's Foundation</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select a plan that scales with your ambition.</p>
                
                {isDiscounted && (
                    <div className="mt-6 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary font-black uppercase text-xs tracking-widest animate-in zoom-in duration-500">
                        <Tag className="h-4 w-4" />
                        Ambassador Discount Applied (20% OFF)
                    </div>
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
                    const priceInfo = plan.pricing[interval];
                    const displayPrice = isDiscounted ? priceInfo.discounted : priceInfo.price;
                    const isYearly = interval === 'yearly';

                    return (
                    <Card 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={cn(
                            "relative cursor-pointer transition-all duration-300 border-2 bg-card flex flex-col",
                            selectedPlan === plan.id ? 'border-primary shadow-2xl shadow-primary/20' : 'border-border/20 hover:border-primary/40'
                        )}
                    >
                        {isYearly && (
                             <Badge className="absolute top-3 left-3 bg-green-500/20 text-green-400 border-green-500/50">Save 15%</Badge>
                        )}
                        <CardHeader className="text-center items-center">
                            <div className="bg-primary/10 rounded-full p-4 mb-4 border border-primary/20">
                                <Icon className="h-10 w-10 text-primary"/>
                            </div>
                            <CardTitle className="font-headline text-2xl text-foreground">{plan.title}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                             <div className="flex items-baseline gap-2">
                               <span className="text-4xl font-extrabold text-primary">${displayPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2})}</span> 
                               <span className="text-muted-foreground">
                                    /{interval === 'monthly' ? 'mo' : 'yr'}
                               </span>
                            </div>
                            {isDiscounted && (
                                <p className="text-[10px] text-muted-foreground line-through decoration-destructive">
                                    Was ${priceInfo.price}
                                </p>
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
