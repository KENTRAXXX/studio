'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, Building, Gem, Rocket, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import SomaLogo from "@/components/logo";

const plans = [
    {
        id: 'MERCHANT',
        title: 'Merchant',
        price: '$19.99',
        priceSubtitle: '/mo',
        amount: 1999,
        icon: ShoppingBag,
        description: 'Store Only. Perfect for selling your own creations.',
        features: ['"Add My Own Product" tools', 'Private Inventory Management', 'Standard Support'],
        bestValue: false,
    },
    {
        id: 'SCALER',
        title: 'Scaler',
        price: '$29',
        priceSubtitle: '/mo',
        amount: 2900,
        icon: Rocket,
        description: 'Dropship Flex. Start dropshipping with standard fulfillment.',
        features: ['One-Click Cloning', 'Sync from Master Catalog', 'Standard Fulfillment'],
        bestValue: false,
    },
    {
        id: 'MOGUL',
        title: 'Mogul',
        price: '$500',
        priceSubtitle: 'one-time',
        amount: 50000,
        icon: Star,
        description: 'Dropship VIP. A lifetime deal for serious entrepreneurs.',
        features: ['All Scaler Features', 'Priority Shipping Speed', 'VIP Support'],
        bestValue: true
    },
    {
        id: 'SELLER',
        title: 'Seller',
        price: 'Free',
        priceSubtitle: '+ 3% fee',
        amount: 0,
        icon: Gem,
        description: 'Wholesaler Hub. Supply your products to the SOMA network.',
        features: ['"Supplier Dashboard" access', 'Upload items to Master Catalog', 'Sell to all SOMA stores'],
        bestValue: false
    },
    {
        id: 'ENTERPRISE',
        title: 'Enterprise',
        price: '$33.33',
        priceSubtitle: '/mo',
        amount: 3333,
        icon: Building,
        description: 'The Hybrid. The ultimate flexibility for established businesses.',
        features: ['Everything Unlocked', 'Mix private & SOMA stock', 'Dedicated Account Manager'],
        bestValue: false
    }
];

export default function PlanSelectionPage() {
    const [selectedPlan, setSelectedPlan] = useState('MOGUL');
    const router = useRouter();

    const handleConfirm = () => {
        router.push(`/signup?planTier=${selectedPlan}`);
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto"/>
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Choose Your Empire's Foundation</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select a plan that scales with your ambition.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full">
                {plans.map(plan => {
                    const Icon = plan.icon;
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
                        <CardHeader className="text-center items-center">
                            <div className="bg-primary/10 rounded-full p-4 mb-4 border border-primary/20">
                                <Icon className="h-10 w-10 text-primary"/>
                            </div>
                            <CardTitle className="font-headline text-2xl text-foreground">{plan.title}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                             <div className="flex items-baseline gap-2">
                               <span className="text-4xl font-extrabold text-primary">{plan.price}</span> 
                               <span className="text-muted-foreground">{plan.priceSubtitle}</span>
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
