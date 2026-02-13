
'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    Gift, 
    Copy, 
    Loader2, 
    Users, 
    CheckCircle, 
    Link as LinkIcon, 
    Share2, 
    Trophy, 
    TrendingUp,
    Sparkles,
    ShieldCheck,
    DollarSign,
    Zap,
    ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';
import SomaLogo from '@/components/logo';

type ReferredUser = {
    id: string;
    email: string;
    hasAccess: boolean; 
    planTier: string;
}

export default function AmbassadorDashboardContent() {
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';
    const referralLink = userProfile?.referralCode 
        ? `https://${rootDomain}/plan-selection?ref=${userProfile.referralCode}`
        : '';

    const referralsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users'), where('referredBy', '==', user.uid), orderBy('email', 'asc'));
    }, [firestore, user]);

    const { data: referredUsers, loading: referralsLoading } = useCollection<ReferredUser>(referralsQuery);
    
    const activeReferrals = useMemo(() => {
        return referredUsers?.filter(u => u.hasAccess).length || 0;
    }, [referredUsers]);

    const lifetimeEarnings = (userProfile?.totalReferralEarnings || 0);

    const handleCopyCode = () => {
        if (!userProfile?.referralCode) return;
        navigator.clipboard.writeText(userProfile.referralCode);
        toast({ title: 'Code Copied!', description: 'Your strategic code is ready for distribution.' });
    };

    const handleCopyLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        toast({ title: 'Link Secured!', description: 'Your universal referral link is copied to the clipboard.' });
    };
    
    const isLoading = profileLoading || referralsLoading;

    if (isLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            {/* Sector 0: Handshake */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px] font-black tracking-widest h-5">Verified Ambassador</Badge>
                    </div>
                    <h1 className="text-4xl font-bold font-headline text-white tracking-tight">Marketing Terminal</h1>
                    <p className="text-muted-foreground text-lg">Strategic control for your global referral operations.</p>
                </div>
                
                <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-4 rounded-2xl shadow-gold-glow">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Bounty Reward</p>
                        <p className="text-2xl font-bold font-mono text-primary">$5.00 FLAT</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                        <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </div>

            {/* Performance Snapshot */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/30 bg-primary/5 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-24 w-24 text-primary" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lifetime Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold font-mono text-white">{formatCurrency(Math.round(lifetimeEarnings * 100))}</div>
                        <p className="text-[10px] text-primary font-bold mt-2 uppercase tracking-widest">Commission Accrued</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5 group relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Moguls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold font-mono text-white">{activeReferrals}</div>
                        <p className="text-[10px] text-green-500 font-bold mt-2 uppercase tracking-widest">Paid Conversions</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5 group relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conversion Yield</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold font-mono text-white">
                            {referredUsers && referredUsers.length > 0 ? ((activeReferrals / referredUsers.length) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">Recruit Activation Velocity</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Marketing Kit */}
                <div className="lg:col-span-5 space-y-8">
                    <Card className="border-primary/50 overflow-hidden bg-slate-900/40 shadow-2xl">
                        <CardHeader className="bg-primary/10 border-b border-primary/20">
                            <CardTitle className="text-sm font-headline uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                                <Zap className="h-5 w-5" />
                                Universal Marketing Kit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Universal Affiliate Link</label>
                                <div className="flex items-center gap-3 p-4 bg-black/60 rounded-xl border border-primary/20 group hover:border-primary/50 transition-all">
                                    <LinkIcon className="h-5 w-5 text-primary/60 shrink-0" />
                                    <code className="text-xs text-primary truncate flex-1 font-mono">{referralLink || 'Generating...'}</code>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10" onClick={handleCopyLink}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-slate-500 italic leading-relaxed">This link automatically triggers the recruit discount and secures your $5 bounty via persistent cookie.</p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manual Referral Code</label>
                                <div className="flex gap-3">
                                    <div className="flex-1 text-center text-2xl font-bold font-mono tracking-[0.3em] p-3 bg-muted/20 rounded-xl border border-primary/10 text-primary">
                                        {userProfile?.referralCode || '---'}
                                    </div>
                                    <Button onClick={handleCopyCode} variant="outline" className="h-14 w-14 border-primary/30 text-primary hover:bg-primary/10">
                                        <Copy className="h-6 w-6"/>
                                    </Button>
                                </div>
                            </div>

                            <Button className="w-full h-16 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.2em]">
                                <Share2 className="mr-3 h-6 w-6" /> Share Global Invite
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                                <ShieldCheck className="h-4 w-4" /> Ambassador Charter
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-[11px] text-slate-400 space-y-3 leading-relaxed">
                            <p>• You earn <span className="text-slate-200 font-bold">$5.00 USD</span> for every paid account you bring to SOMA.</p>
                            <p>• Recruits receive a <span className="text-primary font-bold">20% exclusive discount</span> on their first subscription cycle.</p>
                            <p>• Rewards mature for 14 days to account for potential chargebacks or plan changes.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Network Ledger */}
                <div className="lg:col-span-7">
                    <Card className="border-primary/20 bg-slate-900/20 overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between py-6 px-8">
                            <div>
                                <CardTitle className="text-xl font-headline flex items-center gap-3">
                                    <Users className="h-6 w-6 text-primary" />
                                    Strategic Network Ledger
                                </CardTitle>
                                <CardDescription>Real-time record of all attributed partners.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-black/40">
                                    <TableRow className="border-primary/10 h-14">
                                        <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Partner Identity</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Empire Tier</TableHead>
                                        <TableHead className="text-right px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Bounty Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {referredUsers && referredUsers.length > 0 ? referredUsers.map(refUser => (
                                        <TableRow key={refUser.id} className="border-primary/5 hover:bg-primary/5 transition-colors h-20">
                                            <TableCell className="px-8">
                                                <div className="font-bold text-slate-200 text-sm truncate max-w-[200px]">{refUser.email}</div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {refUser.id.slice(0, 8)}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-primary/20 text-primary font-black text-[10px] uppercase">
                                                    {refUser.planTier}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                {refUser.hasAccess ? (
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5 text-green-500 font-bold text-sm">
                                                            <CheckCircle className="h-3.5 w-3.5" /> +$5.00 EARNED
                                                        </div>
                                                        <span className="text-[9px] text-slate-500 uppercase font-black mt-1">MATURING IN LEDGER</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1.5 text-slate-500 font-bold text-sm">
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> PENDING PAY
                                                        </div>
                                                        <span className="text-[9px] text-slate-600 uppercase font-black mt-1">AWAITING ACTIVATION</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-64 text-center text-muted-foreground italic text-lg px-8">
                                                Your recruitment ledger is currently clear. Deploy your links to capture global yield.
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
