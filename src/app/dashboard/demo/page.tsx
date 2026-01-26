'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardController from '../dashboard-controller';
import { Eye } from 'lucide-react';

type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER';

const planTiers: { id: PlanTier, name: string }[] = [
    { id: 'SCALER', name: 'Scaler View' },
    { id: 'MERCHANT', name: 'Merchant View' },
    { id: 'SELLER', name: 'Seller View' },
];

export default function DashboardDemoPage() {
    const [activeTab, setActiveTab] = useState<PlanTier>('SCALER');

    return (
        <div className="space-y-8 p-4 md:p-8">
            <div className="text-center">
                <Eye className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Dashboard Demo</h1>
                <p className="mt-2 text-lg text-muted-foreground">
                    Explore the powerful features available for each plan tier.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PlanTier)} className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
                    {planTiers.map(tier => (
                        <TabsTrigger key={tier.id} value={tier.id} className="py-2">
                            {tier.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {planTiers.map(tier => (
                    <TabsContent key={tier.id} value={tier.id}>
                        <Card className="mt-6 border-primary/30">
                            <CardHeader>
                                <CardTitle>{tier.name}</CardTitle>
                                <CardDescription>
                                    This is a live preview of the dashboard for the <span className="font-bold text-primary">{tier.id.toLowerCase()}</span> plan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* The DashboardController will render the specific view based on the activeTab */}
                                <div className="p-6 bg-background rounded-b-lg">
                                     <DashboardController planTier={activeTab} isDemo={true} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
