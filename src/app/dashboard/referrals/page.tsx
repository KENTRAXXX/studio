'use client';

import { useMemo } from 'react';
import { useUser, useUserProfile, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Loader2, Users, CheckCircle, Link as LinkIcon, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ReferredUser = {
    id: string;
    email: string;
    hasAccess: boolean; // This determines if they are 'Active'
    planTier: string;
}

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
            <div className="flex items-center gap-4">
                <Gift className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Referral Hub</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-primary/50 bg-slate-900/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5 text-primary" />
                            Universal Referral Link
                        </CardTitle>
                        <CardDescription>Direct recruits to this URL to auto-apply your credit.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-black/40 rounded-lg border border-primary/10">
                            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <code className="text-xs text-primary truncate flex-1">{referralLink || 'Generating link...'}</code>
                        </div>
                        <Button onClick={handleCopyLink} className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                            Copy Referral Link
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-primary" />
                            Ambassador Code
                        </CardTitle>
                        <CardDescription>Your unique alphanumeric identifier.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-3xl font-bold font-mono tracking-[0.3em] p-4 bg-muted rounded-lg border border-primary/20">
                            {profileLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto" /> : userProfile?.referralCode || '...'}
                        </div>
                        <Button onClick={handleCopyCode} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/5">
                            <Copy className="mr-2 h-4 w-4"/> Copy Manual Code
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Network</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Loader2 className="h-8 animate-spin"/> : <div className="text-3xl font-bold">{referredUsers?.length || 0}</div>}
                         <p className="text-xs text-muted-foreground mt-1">Users attributed to your brand</p>
                    </CardContent>
                </Card>
                <Card>
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
                                    <TableRow key={refUser.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-medium">{refUser.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-primary/20 text-primary">{refUser.planTier}</Badge>
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
