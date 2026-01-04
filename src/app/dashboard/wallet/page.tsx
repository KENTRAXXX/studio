'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Banknote, Landmark, Wallet as WalletIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const getTransactionTypeClass = (type: string) => {
    switch (type) {
        case 'Sale': return 'text-green-400';
        case 'Fee': return 'text-red-400';
        case 'Withdrawal': return 'text-muted-foreground';
        default: return '';
    }
};

const getTransactionSign = (type: string) => {
    return type === 'Sale' ? '+' : '-';
};

export default function SomaWalletPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const payoutsRef = firestore && user ? query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid)) : null;
    const { data: payoutDocs, loading: payoutsLoading } = useCollection(payoutsRef);

    const availableBalance = useMemo(() => {
        if (!payoutDocs) return 0;
        return payoutDocs.reduce((acc, doc) => acc + (doc.amount || 0), 0);
    }, [payoutDocs]);
    
    const handleWithdrawalRequest = () => {
        toast({
            title: "Coming Soon!",
            description: "Automated withdrawals are being finalized.",
        });
    }
    
    const isLoading = userLoading || payoutsLoading;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-headline">SOMA Wallet</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle>Withdrawal Method</CardTitle>
                            <CardDescription>Link your bank account or PayPal to receive payouts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="paypal-email">PayPal Email</Label>
                                <Input id="paypal-email" placeholder="your-email@example.com" />
                            </div>
                             <div className="flex items-center space-x-2">
                                <div className="flex-grow border-t border-muted-foreground/20"></div>
                                <span className="text-xs text-muted-foreground">OR</span>
                                <div className="flex-grow border-t border-muted-foreground/20"></div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="account-number">Bank Account Number</Label>
                                <Input id="account-number" placeholder="•••• •••• •••• 1234" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="routing-number">Routing Number</Label>
                                <Input id="routing-number" placeholder="•••••••••" />
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline">
                                    <Landmark className="mr-2 h-4 w-4"/> Link Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle>Pending Payout History</CardTitle>
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

                    <Button size="lg" className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleWithdrawalRequest}>
                        <Banknote className="mr-2 h-6 w-6"/> Request Payout
                    </Button>
                </div>
            </div>
        </div>
    );
}
