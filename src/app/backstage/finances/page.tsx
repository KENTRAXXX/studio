'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useUserProfile } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { DollarSign, Percent, Banknote, Loader2, Wallet, Bank } from 'lucide-react';
import SomaLogo from '@/components/logo';
import { addDays, format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { WithdrawalModal } from '@/components/WithdrawalModal';

type Payout = {
    id: string;
    amount: number;
    createdAt: string;
    orderId: string;
    status: 'pending';
}

type Withdrawal = {
    id:string;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    paidAt?: string;
}

export default function BackstageFinancesPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const [isModalOpen, setIsModalOpen] = useState(false);


    const pendingPayoutsRef = firestore && user ? query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid)) : null;
    const { data: pendingPayouts, loading: payoutsLoading } = useCollection<Payout>(pendingPayoutsRef);
    
    const completedWithdrawalsRef = firestore && user ? query(collection(firestore, 'withdrawal_requests'), where('userId', '==', user.uid), where('status', '==', 'completed'), orderBy('paidAt', 'desc')) : null;
    const { data: completedWithdrawals, loading: withdrawalsLoading } = useCollection<Withdrawal>(completedWithdrawalsRef);

    const { totalEarned, platformFees } = useMemo(() => {
        if (!pendingPayouts) return { totalEarned: 0, platformFees: 0 };
        
        const total = pendingPayouts.reduce((acc, doc) => acc + (doc.amount || 0), 0);

        const commissionRate = userProfile?.planTier === 'BRAND' ? 0.03 : 0.09;
        const payoutPercentage = 1 - commissionRate;
        const fees = total > 0 ? (total / payoutPercentage) * commissionRate : 0;

        return { totalEarned: total, platformFees: fees };
    }, [pendingPayouts, userProfile]);

    const nextPayoutDate = useMemo(() => {
        if (withdrawalsLoading || userLoading) return 'Calculating...';

        const getNextPayoutDate = () => {
            if (completedWithdrawals && completedWithdrawals.length > 0 && completedWithdrawals[0].paidAt) {
                const lastPaidDate = parseISO(completedWithdrawals[0].paidAt);
                const nextDate = addDays(lastPaidDate, 7);
                return format(nextDate, 'MMM d, yyyy');
            }
            
            if (user?.metadata.creationTime) {
                const creationDate = new Date(user.metadata.creationTime);
                const nextDate = addDays(creationDate, 7);
                return format(nextDate, 'MMM d, yyyy');
            }

            return 'TBD';
        };

        return getNextPayoutDate();
    }, [completedWithdrawals, user, withdrawalsLoading, userLoading]);
    
    const isLoading = userLoading || payoutsLoading || withdrawalsLoading || profileLoading;

    return (
        <>
        <WithdrawalModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            availableBalance={totalEarned}
        />
        <div className="flex flex-col min-h-screen bg-background p-4 sm:p-6 text-foreground">
            <div className="text-center mb-10">
                <SomaLogo className="h-12 w-12 mx-auto text-slate-400" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-slate-300">Seller Finances</h1>
                <p className="mt-2 text-lg text-slate-500">Track your earnings and request payouts.</p>
            </div>

            <div className="w-full max-w-7xl mx-auto space-y-8">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
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
                     <div className="space-y-8">
                        <Card className="border-primary text-center bg-slate-900/80">
                            <CardHeader>
                                <Wallet className="h-10 w-10 text-primary mx-auto mb-4" />
                                <CardTitle className="text-muted-foreground text-lg font-medium">Available for Withdrawal</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                ) : (
                                    <p className="text-5xl font-bold text-primary">${totalEarned.toFixed(2)}</p>
                                )}
                            </CardContent>
                        </Card>

                        <Button size="lg" className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsModalOpen(true)}>
                            <Bank className="mr-2 h-6 w-6"/> Request Payout
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
