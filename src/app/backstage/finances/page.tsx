'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { DollarSign, Percent, Banknote, Loader2 } from 'lucide-react';
import SomaLogo from '@/components/logo';
import { addDays, format, parseISO } from 'date-fns';

type Payout = {
    id: string;
    amount: number;
    createdAt: string;
    orderId: string;
    status: 'pending';
}

type Withdrawal = {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    paidAt?: string;
}

export default function BackstageFinancesPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();

    const pendingPayoutsRef = firestore && user ? query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid)) : null;
    const { data: pendingPayouts, loading: payoutsLoading } = useCollection<Payout>(pendingPayoutsRef);
    
    const completedWithdrawalsRef = firestore && user ? query(collection(firestore, 'withdrawal_requests'), where('userId', '==', user.uid), where('status', '==', 'completed'), orderBy('paidAt', 'desc')) : null;
    const { data: completedWithdrawals, loading: withdrawalsLoading } = useCollection<Withdrawal>(completedWithdrawalsRef);

    const { totalEarned, platformFees } = useMemo(() => {
        if (!pendingPayouts) return { totalEarned: 0, platformFees: 0 };
        
        const total = pendingPayouts.reduce((acc, doc) => acc + (doc.amount || 0), 0);
        // Assuming the seller payout is 97% of the wholesale price.
        const fees = total > 0 ? (total / 0.97) * 0.03 : 0;

        return { totalEarned: total, platformFees: fees };
    }, [pendingPayouts]);

    const nextPayoutDate = useMemo(() => {
        if (withdrawalsLoading || userLoading) return 'Calculating...';

        const getNextPayoutDate = () => {
            // Find the latest request with status 'completed'
            if (completedWithdrawals && completedWithdrawals.length > 0 && completedWithdrawals[0].paidAt) {
                const lastPaidDate = parseISO(completedWithdrawals[0].paidAt);
                const nextDate = addDays(lastPaidDate, 7);
                return format(nextDate, 'MMM d, yyyy');
            }
            
            // If none are completed, use user's creation date
            if (user?.metadata.creationTime) {
                const creationDate = new Date(user.metadata.creationTime);
                const nextDate = addDays(creationDate, 7);
                return format(nextDate, 'MMM d, yyyy');
            }

            return 'TBD';
        };

        return getNextPayoutDate();
    }, [completedWithdrawals, user, withdrawalsLoading, userLoading]);
    
    const isLoading = userLoading || payoutsLoading || withdrawalsLoading;

    return (
        <div className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-6 text-foreground">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto text-slate-400" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-slate-300">Seller Finances</h1>
                <p className="mt-2 text-lg text-slate-500">Track your earnings and payouts.</p>
            </div>

            <div className="w-full max-w-6xl space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <Card className="border-slate-700 bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Pending Payout (Net)</CardTitle>
                            <DollarSign className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <div className="text-3xl font-bold text-slate-200">${totalEarned.toFixed(2)}</div>}
                        </CardContent>
                    </Card>
                     <Card className="border-slate-700 bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Platform Fees Paid (Est.)</CardTitle>
                            <Percent className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                             {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <div className="text-3xl font-bold text-slate-200">${platformFees.toFixed(2)}</div>}
                        </CardContent>
                    </Card>
                     <Card className="border-slate-700 bg-slate-900/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Next Payout Date</CardTitle>
                            <Banknote className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                           {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <div className="text-3xl font-bold text-slate-200">{nextPayoutDate}</div>}
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="border-slate-700 bg-slate-900/50">
                    <CardHeader>
                        <CardTitle className="text-slate-300">Transaction History</CardTitle>
                        <CardDescription className="text-slate-500">A log of all your pending payout amounts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                        <TableHead className="text-slate-400">Date</TableHead>
                                        <TableHead className="text-slate-400">Order ID</TableHead>
                                        <TableHead className="text-slate-400 text-right">Net Payout</TableHead>
                                        <TableHead className="text-slate-400 text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingPayouts && pendingPayouts.length > 0 ? (
                                        pendingPayouts.map((payout) => (
                                            <TableRow key={payout.id} className="border-slate-800 hover:bg-slate-800/50">
                                                <TableCell className="text-slate-400">{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="font-mono text-xs text-slate-300">{payout.orderId}</TableCell>
                                                <TableCell className="text-right font-mono text-green-400">+ ${payout.amount.toFixed(2)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">{payout.status}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                            <TableCell colSpan={4} className="text-center h-24 text-slate-500">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
