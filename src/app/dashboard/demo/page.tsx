
'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardOverviewPage from '../page';
import { Eye, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER';

export default function DashboardDemoPage() {
    const [activeTab, setActiveTab] = useState<PlanTier>('SCALER');

    // Strategic Mock Data for Joe Jenkins
    const jenkinsMockData = {
        fullName: 'Joe Jenkins',
        email: 'jjenkins@gmail.com',
        storeName: 'Jenkins Tech',
        totalSales: 72377.83,
        netProfit: 53991.76,
        pendingWithdrawal: 3500.00,
        // Calculated available balance: Profit - Pending
        availableBalance: 50491.76,
        visitorCount: 12450,
        orderCount: 842,
        planTier: 'SCALER'
    };

    return (
        <div className="space-y-8 p-4 md:p-8 selection:bg-primary/30">
            <div className="text-center space-y-4">
                <div className="mx-auto bg-primary/10 rounded-full p-4 border border-primary/20 w-fit">
                    <Eye className="h-12 w-12 text-primary" />
                </div>
                <h1 className="text-4xl font-bold font-headline text-primary tracking-tight">Executive Demo Suite</h1>
                <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Exploring the <span className="text-primary font-bold">Scaler Tier</span> via the Jenkins Tech blueprint.
                </p>
                <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3" /> Identity: Joe Jenkins
                    </Badge>
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" /> Store: Jenkins Tech
                    </Badge>
                </div>
            </div>

            <Card className="border-primary/30 overflow-hidden bg-slate-900/20 shadow-2xl">
                <CardHeader className="bg-muted/30 border-b border-primary/10 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-headline uppercase tracking-widest text-slate-200">Live Environment Emulation</CardTitle>
                            <CardDescription className="text-[10px] uppercase font-bold text-primary/60 mt-1">Status: Read-Only Blueprint</CardDescription>
                        </div>
                        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                            {(['SCALER', 'MERCHANT', 'SELLER'] as const).map((tier) => (
                                <button
                                    key={tier}
                                    onClick={() => setActiveTab(tier)}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all ${
                                        activeTab === tier 
                                            ? "bg-primary text-primary-foreground shadow-lg" 
                                            : "text-slate-400 hover:text-slate-200"
                                    }`}
                                >
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Inject the specific Joe Jenkins mock data into the main dashboard view */}
                    <div className="p-6 md:p-10 bg-background/40 backdrop-blur-xl">
                         <DashboardOverviewPage 
                            isDemo={true} 
                            demoData={activeTab === 'SCALER' ? jenkinsMockData : undefined}
                            tierOverride={activeTab}
                         />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
