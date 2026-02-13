'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Banknote, Wallet as WalletIcon, Loader2, AlertTriangle, Clock, Landmark, History, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { formatCurrency } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function AmbassadorWallet() {
    const { user } = useUser();
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

    const { data: payoutDocs, loading: payoutsLoading } = useCollection<any>(payoutsQuery);
    const { data: maturityDocs, loading: maturityLoading } = useCollection<any>(pendingMaturityQuery);

    const availableBalance = useMemo(() => {
        if (!payoutDocs) return 0;
        return payoutDocs.reduce((acc, doc) => acc + (doc.amount || 0), 0);
    }, [payoutDocs]);

    const pendingMaturityBalance = useMemo(() => {
        if (!maturityDocs) return 0;
        return maturityDocs.reduce((acc, doc) => acc + (doc.amount || 0), 0);
    }, [maturityDocs]);
    
    const isLoading = payoutsLoading || profileLoading || maturityLoading;
    const isBalanceTooLow = availableBalance < 50; // Ambassadors minimum $50
    const isUnderReview = userProfile?.walletStatus === 'under_review';

    const recentActivity = useMemo(() => {
        const all = [...(payoutDocs || []), ...(maturityDocs || [])];
        return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
    }, [payoutDocs, maturityDocs]);

    return (
        <>
        <WithdrawalModal
            isOpen={isModalOpen}
            onOpenChange={setIsModalOpen}
            availableBalance={availableBalance}
            userProfile={userProfile}
        />
        <div className="space-y-10 max-w-5xl mx-auto pb-20">
            <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <WalletIcon className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl font-bold font-headline">Treasury & Settlements</h1>
                <p className="text-muted-foreground text-lg">Direct yields from your strategic recruitment efforts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Balance & Withdrawal */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-primary bg-slate-900/40 relative overflow-hidden shadow-2xl">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Available Yield</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-6">
                            <div className="space-y-1">
                                {isLoading ? (
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                ) : (
                                    <p className="text-6xl font-bold text-primary tracking-tighter font-mono">
                                        {formatCurrency(Math.round(availableBalance * 100))}
                                    </p>
                                )}
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Ready for Autorization</p>
                            </div>

                            <div className="pt-4">
                                <Button 
                                    size="lg" 
                                    className="w-full h-16 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest disabled:opacity-50" 
                                    onClick={() => setIsModalOpen(true)}
                                    disabled={isBalanceTooLow || isLoading || isUnderReview}
                                >
                                    <Landmark className="mr-2 h-6 w-6"/> 
                                    {isUnderReview 
                                        ? 'Account Under Audit' 
                                        : (isBalanceTooLow && !isLoading ? `$50.00 Min Required` : 'Request Extraction')
                                    }
                                </Button>
                            </div>

                            {isUnderReview && (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-left text-xs">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>Settlements are temporarily frozen during your identity verification period. This protocol concludes within 48 hours.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {pendingMaturityBalance > 0 && (
                        <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pending Maturity</p>
                                    <p className="text-xl font-bold text-slate-200 font-mono">{formatCurrency(Math.round(pendingMaturityBalance * 100))}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="border-yellow-500/20 text-yellow-500 text-[9px] font-black uppercase">14 Day Hold</Badge>
                        </div>
                    )}
                </div>

                {/* Performance History */}
                <div className="lg:col-span-7">
                    <Card className="border-primary/20 bg-slate-900/20 overflow-hidden min-h-[400px]">
                        <CardHeader className="bg-muted/30 border-b border-primary/10">
                            <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Transmission History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-black/20">
                                    <TableRow className="border-primary/5">
                                        <TableHead className="px-6">Timestamp</TableHead>
                                        <TableHead>Event</TableHead>
                                        <TableHead className="text-right px-6">Yield</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentActivity.length > 0 ? recentActivity.map((tx, idx) => (
                                        <TableRow key={idx} className="border-primary/5 hover:bg-primary/5 transition-colors">
                                            <TableCell className="px-6 text-xs text-slate-500 font-mono">
                                                {format(new Date(tx.createdAt), 'MMM d, HH:mm')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "h-1.5 w-1.5 rounded-full",
                                                        tx.status === 'pending' ? "bg-green-500" : "bg-yellow-500"
                                                    )} />
                                                    <p className="text-[11px] font-bold text-slate-300 truncate max-w-[200px]">{tx.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                <span className="text-xs font-black text-primary font-mono">+$5.00</span>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-64 text-center text-muted-foreground italic text-sm">
                                                No financial signals detected.
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
        </>
    );
}
