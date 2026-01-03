'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import SomaLogo from "@/components/logo";

const plans = [
    {
        id: 'monthly',
        title: 'The Scaler',
        price: '$29/mo',
        features: ['Full Platform Access', 'Standard Support', 'Automated Sync'],
        bestValue: false
    },
    {
        id: 'lifetime',
        title: 'The Mogul',
        price: '$500',
        priceSubtitle: 'One-Time',
        features: ['Everything in Monthly', 'VIP Priority Support', 'Zero Future Fees'],
        bestValue: true
    }
];

export default function PlanSelectionPage() {
    const [selectedPlan, setSelectedPlan] = useState('lifetime');
    const router = useRouter();

    const handleConfirm = () => {
        router.push('/signup');
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto"/>
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Choose Your Empire's Foundation</h1>
                <p className="mt-2 text-lg text-muted-foreground">Select a plan that scales with your ambition.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                {plans.map(plan => (
                    <Card 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={cn(
                            "relative cursor-pointer transition-all duration-300 border-4 bg-card",
                            selectedPlan === plan.id ? 'border-primary shadow-2xl shadow-primary/20' : 'border-transparent hover:border-primary/40'
                        )}
                    >
                        {plan.bestValue && (
                             <div className="absolute top-0 right-0 overflow-hidden w-28 h-28">
                                <div className="absolute top-8 right-[-22px] w-[160px] transform rotate-45 bg-primary text-center text-primary-foreground font-bold py-1 text-sm">
                                    Best Value
                                </div>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl text-foreground">{plan.title}</CardTitle>
                            <div className="flex items-baseline gap-2">
                               <span className="text-4xl font-extrabold text-primary">{plan.price}</span> 
                               {plan.priceSubtitle ? (
                                    <span className="text-muted-foreground">{plan.priceSubtitle}</span>
                               ) : (
                                   <span className="text-muted-foreground"></span>
                               )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="h-5 w-5 text-primary" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
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
