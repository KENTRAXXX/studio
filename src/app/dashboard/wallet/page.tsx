'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Banknote, Wallet as WalletIcon, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { formatCurrency } from '@/utils/format';


export default function SomaWalletPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Only fetch records that are ready for payout
    const payoutsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'payouts_pending'), 
            where('userId', '==', user.uid),
            where('status', '==', 'pending')
        );
    }, [firestore, user]);

    // Also fetch maturity-pending for UX feedback
    const pendingMaturityQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'payouts_pending'), 
            where('userId', '==', user.uid),
            where('status', '==', 'pending_maturity')
        );
    }, [firestore, user]);

    const { data: payoutDocs, loading: payoutsLoading } = useCollection(payoutsQuery);
    const { data: maturityDocs, loading: maturityLoading } = useCollection(pendingMaturityQuery);

    const availableBalance = useMemo(() => {
        if (!payoutDocs) return 0;
        return payoutDocs.reduce((acc, doc: any) => acc + (doc.amount || 0), 0);
    }, [payoutDocs]);

    const pendingMaturityBalance = useMemo(() => {
        if (!maturityDocs) return 0;
        return maturityDocs.reduce((acc, doc: any) => acc + (doc.amount || 0), 0);
    }, [maturityDocs]);
    
    const isLoading = userLoading || payoutsLoading || profileLoading || maturityLoading;
    const isBalanceTooLow = availableBalance < 10;
    const isUnderReview = userProfile?.walletStatus === 'under_review';

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

             <Card className="border-primary text-center bg-card relative overflow-hidden">
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

            {pendingMaturityBalance > 0 && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-yellow-500/60" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pending Maturity</p>
                            <p className="text-sm font-bold text-slate-300">{formatCurrency(Math.round(pendingMaturityBalance * 100))}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-yellow-500/20 text-yellow-500/60">14 DAY HOLD</Badge>
                </div>
            )}

            <div className="space-y-4">
                <Button 
                    size="lg" 
                    className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:grayscale" 
                    onClick={() => setIsModalOpen(true)}
                    disabled={isBalanceTooLow || isLoading || isUnderReview}
                >
                    <Banknote className="mr-2 h-6 w-6"/> 
                    {isUnderReview 
                        ? 'Wallet Under Review' 
                        : (isBalanceTooLow && !isLoading ? `Minimum ${formatCurrency(1000)} Required` : 'Request Payout')
                    }
                </Button>

                {isUnderReview && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>Withdrawals are temporarily restricted while your wallet is under manual review for platform integrity. This process usually concludes within 48 hours.</p>
                    </div>
                )}
            </div>

            <p className="text-center text-sm text-muted-foreground">
                This balance reflects your net profit from sales across the platform. Withdrawals are processed within 24-48 hours.
            </p>

        </div>
        </>
    );
}
