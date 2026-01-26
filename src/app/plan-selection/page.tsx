'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Star, Building, Gem, Rocket, ShoppingBag, ShieldCheck } from "lucide-react";
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
            monthly: { price: 29, planCode: process.env.NEXT_PUBLIC_SCALER_MONTHLY_PLAN_CODE },
            yearly: { price: 290, planCode: process.env.NEXT_PUBLIC_SCALER_YEARLY_PLAN_CODE },
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
            monthly: { price: 19.99, planCode: process.env.NEXT_PUBLIC_MERCHANT_MONTHLY_PLAN_CODE },
            yearly: { price: 199, planCode: process.env.NEXT_PUBLIC_MERCHANT_YEARLY_PLAN_CODE },
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
            monthly: { price: 33.33, planCode: process.env.NEXT_PUBLIC_ENTERPRISE_MONTHLY_PLAN_CODE },
            yearly: { price: 333, planCode: process.env.NEXT_PUBLIC_ENTERPRISE_YEARLY_PLAN_CODE },
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
            free: { price: 0, planCode: null }
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
            monthly: { price: 21, planCode: process.env.NEXT_PUBLIC_BRAND_MONTHLY_PLAN_CODE },
            yearly: { price: 210, planCode: process.env.NEXT_PUBLIC_BRAND_YEARLY_PLAN_CODE },
        }
    }
];

export default function PlanSelectionPage() {
    const [selectedPlan, setSelectedPlan] = useState('SCALER');
    const [interval, setInterval] = useState<Interval>('monthly');
    const router = useRouter();

    const handleConfirm = () => {
        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) return;
        
        let planInterval: string = interval;
        if (plan.pricing.lifetime) planInterval = 'lifetime';
        if (plan.pricing.free) planInterval = 'free';

        router.push(`/signup?planTier=${selectedPlan}&interval=${planInterval}`);
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto"/>
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Choose Your Empire's Foundation</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select a plan that scales with your ambition.</p>
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
                    const priceInfo = plan.pricing.lifetime || plan.pricing.free || plan.pricing[interval];
                    const isYearly = !plan.pricing.lifetime && !plan.pricing.free && interval === 'yearly';

                    return (
                    <Card 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={cn(
                            "relative cursor-pointer transition-all duration-300 border-2 bg-card flex flex-col",
                            selectedPlan === plan.id ? 'border-primary shadow-2xl shadow-primary/20' : 'border-border/20 hover:border-primary/40'
                        )}
                    >
                        {plan.bestValue && (
                             <div className="absolute -top-3 -right-3">
                                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center font-bold">
                                    <Star className="h-6 w-6"/>
                                </div>
                            </div>
                        )}
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
                               <span className="text-4xl font-extrabold text-primary">${priceInfo.price.toLocaleString('en-US', { minimumFractionDigits: ['SCALER', 'MOGUL'].includes(plan.id) ? 0 : 2, maximumFractionDigits: 2})}</span> 
                               <span className="text-muted-foreground">
                                    {plan.pricing.lifetime ? 'one-time' : plan.pricing.free ? '' : `/${interval === 'monthly' ? 'mo' : 'yr'}`}
                               </span>
                            </div>
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

            <Button size="lg" className="mt-10 w-full max-w-xs h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleConfirm}>
                Confirm Selection
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-6 max-w-md">
                All plans include custom domain mapping and unlimited product imports.
            </p>
        </div>
    );
}
