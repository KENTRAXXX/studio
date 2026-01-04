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
        title: 'The Merchant',
        price: '$49',
        priceSubtitle: '/ mo',
        amount: 4900,
        icon: ShoppingBag,
        features: ['Sell Your Own Products', 'Private Inventory Management', 'Standard Support'],
        bestValue: false
    },
    {
        id: 'SELLER',
        title: 'The Seller',
        price: '$79',
        priceSubtitle: '/ mo',
        amount: 7900,
        icon: Gem,
        features: ['Sell on SOMA Marketplace', 'Wholesale Inventory Upload', '3% Transaction Fee'],
        bestValue: false
    },
    {
        id: 'MOGUL',
        title: 'The Mogul',
        price: '$129',
        priceSubtitle: '/ mo',
        amount: 12900,
        icon: Star,
        features: ['Full Dropshipping Access', 'Sync from Master Catalog', 'Priority Support'],
        bestValue: true
    },
    {
        id: 'SCALER',
        title: 'The Scaler',
        price: '$249',
        priceSubtitle: '/ mo',
        amount: 24900,
        icon: Rocket,
        features: ['All Mogul Features', 'Advanced Analytics', 'Lower Transaction Fees'],
        bestValue: false
    },
    {
        id: 'ENTERPRISE',
        title: 'The Enterprise',
        price: 'Contact Us',
        priceSubtitle: '',
        amount: 0,
        icon: Building,
        features: ['Custom Solutions', 'Dedicated Account Manager', 'API Access & Integrations'],
        bestValue: false
    }
];

export default function PlanSelectionPage() {
    const [selectedPlan, setSelectedPlan] = useState('MOGUL');
    const router = useRouter();

    const handleConfirm = () => {
        if (selectedPlan === 'ENTERPRISE') {
            // Handle contact flow, maybe a mailto link or a contact form page
            router.push('mailto:sales@soma.com?subject=Enterprise Plan Inquiry');
        } else {
            router.push(`/signup?planTier=${selectedPlan}`);
        }
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
