'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Banknote, Wallet as WalletIcon, Loader2 } from 'lucide-react';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { formatCurrency } from '@/utils/format';


export default function SomaWalletPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const payoutsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid));
    }, [firestore, user]);

    const { data: payoutDocs, loading: payoutsLoading } = useCollection(payoutsQuery);

    const availableBalance = useMemo(() => {
        if (!payoutDocs) return 0;
        return payoutDocs.reduce((acc, doc: any) => acc + (doc.amount || 0), 0);
    }, [payoutDocs]);
    
    const isLoading = userLoading || payoutsLoading || profileLoading;
    const isBalanceTooLow = availableBalance < 10;

    return (
        <>
        <WithdrawalModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            availableBalance={availableBalance}
            userProfile={userProfile}
        />
        <div className="space-y-8 max-w-md mx-auto">
            <h1 className="text-3xl font-bold font-headline text-center">SOMA Wallet</h1>

             <Card className="border-primary text-center">
                <CardHeader>
                    <WalletIcon className="h-10 w-10 text-primary mx-auto mb-4" />
                    <CardTitle className="text-muted-foreground text-lg font-medium">Available for Withdrawal</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    ) : (
                        <>
                            <p className="text-5xl font-bold text-primary">{formatCurrency(Math.round(availableBalance * 100))}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">Minimum payout: {formatCurrency(1000)}</p>
                        </>
                    )}
                </CardContent>
            </Card>

            <Button 
                size="lg" 
                className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={() => setIsModalOpen(true)}
                disabled={isBalanceTooLow || isLoading}
            >
                <Banknote className="mr-2 h-6 w-6"/> 
                {isBalanceTooLow && !isLoading ? `Minimum ${formatCurrency(1000)} Required` : 'Request Payout'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
                This balance reflects your net profit from sales across the platform. Withdrawals are processed within 24-48 hours.
            </p>

        </div>
        </>
    );
}
