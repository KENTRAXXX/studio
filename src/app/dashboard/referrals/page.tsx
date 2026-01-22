'use client';

import { useMemo } from 'react';
import { useUser, useUserProfile, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Loader2, Users, CheckCircle } from 'lucide-react';
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

    const referralsQuery = useMemo(() => {
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
        toast({ title: 'Copied!', description: 'Your referral code has been copied to the clipboard.' });
    };
    
    const isLoading = profileLoading || referralsLoading;

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Gift className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline">Referral Program</h1>
            </div>

            <Card className="border-primary/50">
                <CardHeader>
                    <CardTitle>Your Unique Referral Code</CardTitle>
                    <CardDescription>Share this code with friends. When they sign up, you get rewarded.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                    {profileLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <div className="flex-1 w-full text-center sm:text-left text-3xl font-bold font-mono tracking-widest p-4 bg-muted rounded-lg border border-primary/20">
                            {userProfile?.referralCode || '...'}
                        </div>
                    )}
                    <Button onClick={handleCopyCode} size="lg" className="w-full sm:w-auto h-14 text-lg">
                        <Copy className="mr-2"/> Copy Code
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Loader2 className="h-8 animate-spin"/> : <div className="text-3xl font-bold">{referredUsers?.length || 0}</div>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Loader2 className="h-8 animate-spin"/> : <div className="text-3xl font-bold">{activeReferrals}</div>}
                         <p className="text-xs text-muted-foreground">Users who have completed payment.</p>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>My Referred Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={3} className="text-center h-24"><Loader2 className="animate-spin"/></TableCell></TableRow>
                            ) : referredUsers && referredUsers.length > 0 ? (
                                referredUsers.map(refUser => (
                                    <TableRow key={refUser.id}>
                                        <TableCell className="font-medium">{refUser.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{refUser.planTier}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge className={refUser.hasAccess ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                                                {refUser.hasAccess ? 'Active' : 'Pending'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">You haven't referred anyone yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    )
}
