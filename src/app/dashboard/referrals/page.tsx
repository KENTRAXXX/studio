
'use client';

import { useMemo } from 'react';
import { useUser, useUserProfile, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
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
    Award, 
    Medal, 
    TrendingUp,
    Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ReferredUser = {
    id: string;
    email: string;
    hasAccess: boolean; 
    planTier: string;
}

const TIERS = [
    { name: 'Bronze', min: 0, max: 20, rate: 10, color: 'text-orange-400', icon: Medal, badge: null },
    { name: 'Silver', min: 21, max: 50, rate: 15, color: 'text-slate-300', icon: Award, badge: 'Growth Leader' },
    { name: 'Gold', min: 51, max: Infinity, rate: 20, color: 'text-primary', icon: Trophy, badge: 'Founding Partner' },
];

export default function ReferralsPage() {
    const { user } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';
    const referralLink = userProfile?.referralCode 
        ? `https://${rootDomain}/signup?ref=${userProfile.referralCode}`
        : '';

    const referralsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users'), where('referredBy', '==', user.uid));
    }, [firestore, user]);

    const { data: referredUsers, loading: referralsLoading } = useCollection<ReferredUser>(referralsQuery);
    
    const activeReferrals = useMemo(() => {
        return referredUsers?.filter(u => u.hasAccess).length || 0;
    }, [referredUsers]);

    // Tier Calculation Logic
    const currentTier = useMemo(() => {
        return TIERS.find(t => activeReferrals >= t.min && activeReferrals <= t.max) || TIERS[0];
    }, [activeReferrals]);

    const nextTier = useMemo(() => {
        const currentIndex = TIERS.indexOf(currentTier);
        return TIERS[currentIndex + 1] || null;
    }, [currentTier]);

    const progress = useMemo(() => {
        if (!nextTier) return 100;
        const range = nextTier.min - currentTier.min;
        const relativeCount = activeReferrals - currentTier.min;
        return Math.min((relativeCount / range) * 100, 100);
    }, [activeReferrals, currentTier, nextTier]);

    const handleCopyCode = () => {
        if (!userProfile?.referralCode) return;
        navigator.clipboard.writeText(userProfile.referralCode);
        toast({ title: 'Code Copied!', description: 'Your referral code has been copied to the clipboard.' });
    };

    const handleCopyLink = () => {
        if (!referralLink) return;
        navigator.clipboard.writeText(referralLink);
        toast({ title: 'Link Secured!', description: 'Your universal referral link is ready to share.' });
    };
    
    const isLoading = profileLoading || referralsLoading;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Gift className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Referral Hub</h1>
                        <p className="text-muted-foreground text-sm">Scale your network and increase your commission.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Current Commission</p>
                        <p className="text-xl font-bold font-mono text-primary">{currentTier.rate}%</p>
                    </div>
                    <div className={cn("p-2 rounded-lg bg-black/40 border border-white/5", currentTier.color)}>
                        <currentTier.icon className="h-6 w-6" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Milestone Progress Card */}
                <Card className="lg:col-span-7 border-primary/50 bg-slate-900/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Trophy className="h-32 w-32" />
                    </div>
                    <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                            <CardTitle className="text-xl font-headline flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Milestone Progress
                            </CardTitle>
                            <Badge className={cn("uppercase text-[10px] font-black", currentTier.color, "bg-black/40 border-current")}>
                                {currentTier.name} TIER
                            </Badge>
                        </div>
                        <CardDescription>
                            {nextTier 
                                ? `Recruit ${nextTier.min - activeReferrals} more active partners to unlock ${nextTier.name} status.`
                                : "You have reached the pinnacle of the referral ecosystem."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                <span className={currentTier.color}>{currentTier.name}</span>
                                <span className={nextTier ? nextTier.color : currentTier.color}>
                                    {nextTier ? nextTier.name : 'MAXIMUM STATUS'}
                                </span>
                            </div>
                            <Progress value={progress} className="h-3 bg-black/40 border border-primary/10" />
                            <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                                <span>{activeReferrals} Active</span>
                                <span>{nextTier ? `${nextTier.min} Goal` : 'Elite Level'}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Earnings Multiplier</p>
                                <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-primary fill-primary" />
                                    <span className="text-xl font-bold font-mono">{currentTier.rate / 10}x Base</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">Elite Recognition</p>
                                <div className="flex items-center gap-2">
                                    <Award className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-bold truncate">{currentTier.badge || 'Standard Mogul'}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Referral Assets Card */}
                <Card className="lg:col-span-5 border-primary/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-primary" />
                            Universal Referral Kit
                        </CardTitle>
                        <CardDescription>Direct recruits to this URL to auto-apply your credit.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Universal Link</label>
                            <div className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-primary/10">
                                <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                <code className="text-xs text-primary truncate flex-1">{referralLink || 'Generating link...'}</code>
                            </div>
                            <Button onClick={handleCopyLink} className="w-full h-11 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                                Copy Referral Link
                            </Button>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manual Code</label>
                            <div className="flex gap-2">
                                <div className="flex-1 text-center text-xl font-bold font-mono tracking-[0.2em] p-2 bg-muted rounded-lg border border-primary/20">
                                    {profileLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : userProfile?.referralCode || '...'}
                                </div>
                                <Button onClick={handleCopyCode} variant="outline" className="h-11 border-primary/30 text-primary hover:bg-primary/5">
                                    <Copy className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Network</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Loader2 className="h-8 animate-spin"/> : <div className="text-3xl font-bold">{referredUsers?.length || 0}</div>}
                         <p className="text-xs text-muted-foreground mt-1">Users attributed to your brand</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-green-500">Active Conversions</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Loader2 className="h-8 animate-spin"/> : <div className="text-3xl font-bold text-green-400">{activeReferrals}</div>}
                         <p className="text-xs text-muted-foreground mt-1">Partners with processed plans</p>
                    </CardContent>
                </Card>
            </div>

             <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle>Network Ledger</CardTitle>
                    <CardDescription>Historical record of all attributed signups.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Partner Identity</TableHead>
                                <TableHead>Empire Tier</TableHead>
                                <TableHead className="text-right">Activation Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="animate-spin text-primary"/></TableCell></TableRow>
                            ) : referredUsers && referredUsers.length > 0 ? (
                                referredUsers.map(refUser => (
                                    <TableRow key={refUser.id} className="hover:bg-muted/30 transition-colors border-white/5">
                                        <TableCell className="font-medium">{refUser.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[10px]">{refUser.planTier}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={refUser.hasAccess ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'}>
                                                {refUser.hasAccess ? 'Active' : 'Pending Verification'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">You haven't referred any partners yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
