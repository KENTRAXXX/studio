'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Banknote, Wallet as WalletIcon, Loader2 } from 'lucide-react';
import { WithdrawalModal } from '@/components/WithdrawalModal';


export default function SomaWalletPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const payoutsRef = firestore && user ? query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid)) : null;
    const { data: payoutDocs, loading: payoutsLoading } = useCollection(payoutsRef);

    const availableBalance = useMemo(() => {
        if (!payoutDocs) return 0;
        return payoutDocs.reduce((acc, doc) => acc + (doc.amount || 0), 0);
    }, [payoutDocs]);
    
    const isLoading = userLoading || payoutsLoading;

    return (
        <>
        <WithdrawalModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            availableBalance={availableBalance}
        />
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">SOMA Wallet</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle>Pending Payout History</CardTitle>
                             <CardDescription>This table shows sales revenue that is pending payout.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payoutDocs && payoutDocs.length > 0 ? (
                                            payoutDocs.map((payout: any) => (
                                                <TableRow key={payout.id}>
                                                    <TableCell className="text-muted-foreground">{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>{payout.orderId}</TableCell>
                                                    <TableCell className="text-right font-mono text-green-400">
                                                        + ${payout.amount.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                                    No pending payouts found.
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
                    <Card className="border-primary text-center">
                        <CardHeader>
                            <WalletIcon className="h-10 w-10 text-primary mx-auto mb-4" />
                            <CardTitle className="text-muted-foreground text-lg font-medium">Available for Withdrawal</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                            ) : (
                                <p className="text-5xl font-bold text-primary">${availableBalance.toFixed(2)}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Button size="lg" className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsModalOpen(true)}>
                        <Banknote className="mr-2 h-6 w-6"/> Request Payout
                    </Button>
                </div>
            </div>
        </div>
        </>
    );
}
