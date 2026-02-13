'use client';

import { useMemo, useState } from 'react';
import { useUser, useUserProfile, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Megaphone, 
    Share2, 
    Copy, 
    Zap, 
    Users, 
    DollarSign, 
    ArrowUpRight, 
    Loader2, 
    MousePointer2, 
    CheckCircle2,
    Clock,
    TrendingUp,
    Gift,
    ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Referral = {
    id: string;
    email: string;
    hasAccess: boolean;
    planTier: string;
    paidAt?: any;
};

export function AmbassadorDashboardContent() {
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';
    const referralLink = userProfile?.referralCode 
        ? `https://${rootDomain}/plan-selection?ref=${userProfile.referralCode}`
        : '';

    // Fetch Referrals
    const referralsQ = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'users'), 
            where('referredBy', '==', user.uid),
            orderBy('email', 'asc'),
            limit(100)
        );
    }, [firestore, user]);

    const { data: referrals, loading: referralsLoading } = useCollection<Referral>(referralsQ);

    const stats = useMemo(() => {
        const total = referrals?.length || 0;
        const converted = referrals?.filter(r => r.hasAccess).length || 0;
        const pending = total - converted;
        const totalEarned = converted * 5.00;
        const conversionRate = total > 0 ? (converted / total) * 100 : 0;

        return { total, converted, pending, totalEarned, conversionRate };
    }, [referrals]);

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'Secured', description: `${label} copied to clipboard.` });
    };

    const isLoading = profileLoading || referralsLoading;

    if (isLoading) {
        return <div className="flex h-96 w-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-10">
            {/* Economic Strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-primary/20 bg-slate-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Lifecycle Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary font-mono">{formatCurrency(Math.round(stats.totalEarned * 100))}</div>
                        <p className="text-[10px] text-green-500 font-bold mt-2 uppercase tracking-widest">Calculated: $5.00/paid</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-slate-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Paid Conversions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white font-mono">{stats.converted}</div>
                        <p className="text-[10px] text-muted-foreground uppercase mt-2">Verified Active Moguls</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-slate-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Waitlist Intake</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-400 font-mono">{stats.pending}</div>
                        <p className="text-[10px] text-muted-foreground uppercase mt-2">Unpaid Signups</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/20 bg-slate-900/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Yield Velocity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-400 font-mono">{stats.conversionRate.toFixed(1)}%</div>
                        <p className="text-[10px] text-muted-foreground uppercase mt-2">Click-to-Paid Efficiency</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Marketing Kit */}
                <div className="lg:col-span-5 space-y-8">
                    <Card className="border-primary/50 overflow-hidden bg-slate-900/40">
                        <CardHeader className="bg-primary/5 border-b border-primary/10">
                            <CardTitle className="flex items-center gap-3 text-primary font-headline">
                                <Share2 className="h-5 w-5" />
                                Marketing Registry
                            </CardTitle>
                            <CardDescription>Share your unique conversion link to apply automatic discounts.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Universal Link</label>
                                <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-primary/20">
                                    <code className="text-xs text-primary truncate flex-1">{referralLink}</code>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10" onClick={() => handleCopy(referralLink, 'Link')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral Code</label>
                                <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-primary/20">
                                    <code className="text-lg font-black text-white flex-1 tracking-[0.3em]">{userProfile?.referralCode}</code>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10" onClick={() => handleCopy(userProfile?.referralCode || '', 'Code')}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Zap className="h-4 w-4 fill-current" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Conversion Perk</span>
                                </div>
                                <p className="text-[11px] text-blue-300/80 leading-relaxed italic">
                                    Recruits using your link receive an automatic **20% discount** on all monthly/yearly SOMA plans.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Rules of Engagement
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-[11px] text-muted-foreground space-y-3 leading-relaxed">
                            <p>• Rewards mature 14 days after signup to account for payment integrity.</p>
                            <p>• Paid users must remain active for the duration of their first month.</p>
                            <p>• Bulk spamming results in immediate Marketer ID revocation.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Conversion Ledger */}
                <div className="lg:col-span-7">
                    <Card className="border-primary/20 overflow-hidden bg-slate-900/20 min-h-[500px]">
                        <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-headline">Recruitment Ledger</CardTitle>
                                <CardDescription>Real-time tracking of attributed identity provisionings.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Live Uplink</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-black/20">
                                    <TableRow className="border-primary/5">
                                        <TableHead className="px-6">Recruit Identity</TableHead>
                                        <TableHead>Empire Tier</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right px-6">Reward</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {referrals && referrals.length > 0 ? referrals.map((ref) => (
                                        <TableRow key={ref.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                                            <TableCell className="px-6">
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-slate-200">{ref.email.split('@')[0]}***</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase font-medium">{ref.email.split('@')[1]}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-primary/20 text-[9px] font-black uppercase text-primary/60">
                                                    {ref.planTier}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {ref.hasAccess ? (
                                                    <div className="inline-flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        <span className="text-[9px] font-black uppercase">PAID</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-[9px] font-black uppercase">PENDING</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <span className={cn(
                                                    "font-mono font-bold text-sm",
                                                    ref.hasAccess ? "text-green-400" : "text-slate-600"
                                                )}>
                                                    {ref.hasAccess ? '+$5.00' : '--'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-64 text-center text-muted-foreground italic">
                                                No recruitment activity detected. Start sharing your link to initialize yield.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
