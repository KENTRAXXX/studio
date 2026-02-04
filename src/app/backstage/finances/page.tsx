'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    startAfter, 
    getDocs, 
    QueryDocumentSnapshot,
    DocumentData
} from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { 
    DollarSign, 
    Percent, 
    Banknote, 
    Loader2, 
    Wallet, 
    Landmark, 
    WalletCards, 
    ChevronDown, 
    Info, 
    ArrowUpRight, 
    ArrowDownLeft,
    Filter,
    AlertTriangle
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { addDays, format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

type Payout = {
    id: string;
    amount: number;
    createdAt: string;
    orderId: string;
    status: 'pending';
    type: 'sale';
}

type Withdrawal = {
    id: string;
    amount: number;
    createdAt: any;
    status: 'pending' | 'processing' | 'completed' | 'rejected' | 'awaiting-confirmation';
    paidAt?: string;
    type: 'withdrawal';
}

type Transaction = Payout | Withdrawal;

const PAGE_SIZE = 20;

const TransactionTableSkeleton = () => (
    <Table>
        <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Description</TableHead>
                <TableHead className="text-slate-400 text-right">Amount</TableHead>
                <TableHead className="text-slate-400 text-center">Status</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i} className="border-slate-800">
                    <TableCell><Skeleton className="h-5 w-24 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32 bg-slate-700" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto bg-slate-700" /></TableCell>
                    <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full bg-slate-700" /></TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

export default function BackstageFinancesPage() {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const firestore = useFirestore();
    const router = useRouter();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'sales' | 'withdrawals'>('all');

    // Pagination States
    const [payoutsList, setPayoutsList] = useState<Payout[]>([]);
    const [withdrawalsHistory, setWithdrawalsHistory] = useState<Withdrawal[]>([]);
    const [lastPayoutVisible, setLastPayoutVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [lastWithdrawalVisible, setLastWithdrawalVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Guard: Redirect if pending review
    useEffect(() => {
        if (!profileLoading && userProfile?.status === 'pending_review') {
            router.push('/backstage/pending-review');
        }
    }, [userProfile, profileLoading, router]);

    // Balance Calculation Query
    const pendingPayoutsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid));
    }, [firestore, user]);

    const { data: allPendingPayouts, loading: balanceLoading } = useCollection<Payout>(pendingPayoutsQuery);
    
    // Initial Data Fetch
    useEffect(() => {
        if (!firestore || !user) return;

        const fetchInitialData = async () => {
            setIsLoadingInitial(true);
            try {
                // Fetch Sales
                const payoutsQ = query(
                    collection(firestore, 'payouts_pending'),
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    limit(PAGE_SIZE)
                );
                const payoutsSnap = await getDocs(payoutsQ);
                const payouts = payoutsSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'sale' } as Payout));
                setPayoutsList(payouts);
                setLastPayoutVisible(payoutsSnap.docs[payoutsSnap.docs.length - 1] || null);

                // Fetch Withdrawals
                const withdrawalsQ = query(
                    collection(firestore, 'withdrawal_requests'),
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    limit(PAGE_SIZE)
                );
                const withdrawalsSnap = await getDocs(withdrawalsQ);
                const withdrawals = withdrawalsSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'withdrawal' } as Withdrawal));
                setWithdrawalsHistory(withdrawals);
                setLastWithdrawalVisible(withdrawalsSnap.docs[withdrawalsSnap.docs.length - 1] || null);

            } catch (error) {
                console.error("Error fetching financial history:", error);
            } finally {
                setIsLoadingInitial(false);
            }
        };

        fetchInitialData();
    }, [firestore, user]);

    const handleLoadMore = async () => {
        if (!firestore || !user || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            if (activeFilter === 'sales' || activeFilter === 'all') {
                if (lastPayoutVisible) {
                    const nextPayoutsQ = query(
                        collection(firestore, 'payouts_pending'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc'),
                        startAfter(lastPayoutVisible),
                        limit(PAGE_SIZE)
                    );
                    const snap = await getDocs(nextPayoutsQ);
                    const nextItems = snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'sale' } as Payout));
                    setPayoutsList(prev => [...prev, ...nextItems]);
                    setLastPayoutVisible(snap.docs[snap.docs.length - 1] || null);
                }
            }

            if (activeFilter === 'withdrawals' || activeFilter === 'all') {
                if (lastWithdrawalVisible) {
                    const nextWithdrawalsQ = query(
                        collection(firestore, 'withdrawal_requests'),
                        where('userId', '==', user.uid),
                        orderBy('createdAt', 'desc'),
                        startAfter(lastWithdrawalVisible),
                        limit(PAGE_SIZE)
                    );
                    const snap = await getDocs(nextWithdrawalsQ);
                    const nextItems = snap.docs.map(d => ({ ...d.data(), id: d.id, type: 'withdrawal' } as Withdrawal));
                    setWithdrawalsHistory(prev => [...prev, ...nextItems]);
                    setLastWithdrawalVisible(snap.docs[snap.docs.length - 1] || null);
                }
            }
        } catch (error) {
            console.error("Error loading more transactions:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Derived Display List
    const filteredHistory = useMemo(() => {
        let list: Transaction[] = [];
        if (activeFilter === 'sales') list = payoutsList;
        else if (activeFilter === 'withdrawals') list = withdrawalsHistory;
        else list = [...payoutsList, ...withdrawalsHistory];

        return list.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
    }, [activeFilter, payoutsList, withdrawalsHistory]);

    const hasMore = useMemo(() => {
        if (activeFilter === 'sales') return !!lastPayoutVisible;
        if (activeFilter === 'withdrawals') return !!lastWithdrawalVisible;
        return !!lastPayoutVisible || !!lastWithdrawalVisible;
    }, [activeFilter, lastPayoutVisible, lastWithdrawalVisible]);

    const { totalEarned, platformFees, commissionRate } = useMemo(() => {
        if (!allPendingPayouts) return { totalEarned: 0, platformFees: 0, commissionRate: 0 };
        const total = allPendingPayouts.reduce((acc, doc) => acc + (doc.amount || 0), 0);
        const rate = userProfile?.planTier === 'BRAND' ? 0.03 : 0.09;
        const payoutPercentage = 1 - rate;
        const fees = total > 0 ? (total / payoutPercentage) * rate : 0;
        return { totalEarned: total, platformFees: fees, commissionRate: rate };
    }, [allPendingPayouts, userProfile]);

    const isGlobalLoading = userLoading || balanceLoading || profileLoading;
    const isBalanceTooLow = totalEarned < 10;
    const isUnderReview = userProfile?.walletStatus === 'under_review';

    return (
        <div className="flex flex-col min-h-screen bg-background p-4 sm:p-6 text-foreground">
            <WithdrawalModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                availableBalance={totalEarned}
                userProfile={userProfile}
            />
            
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
                                    {isGlobalLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <div className="text-3xl font-bold text-slate-200">{formatCurrency(Math.round(totalEarned * 100))}</div>}
                                </CardContent>
                            </Card>
                             <Card className="border-slate-700 bg-slate-900/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium text-slate-400">Platform Fees Paid (Est.)</CardTitle>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="h-3.5 w-3.5 text-slate-500 cursor-help hover:text-primary transition-colors" />
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200 p-3 space-y-1">
                                                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Fee Breakdown</p>
                                                    <div className="text-[11px] space-y-1">
                                                        <div className="flex justify-between gap-4">
                                                            <span>SOMA Platform Fee</span>
                                                            <span className="font-mono">{commissionRate * 100}%</span>
                                                        </div>
                                                        <div className="flex justify-between gap-4">
                                                            <span>Payment Processing</span>
                                                            <span className="font-mono">Standard Gateway Fee</span>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Percent className="h-4 w-4 text-slate-400" />
                                </CardHeader>
                                <CardContent>
                                     {isGlobalLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <div className="text-3xl font-bold text-slate-200">{formatCurrency(Math.round(platformFees * 100))}</div>}
                                </CardContent>
                            </Card>
                             <Card className="border-slate-700 bg-slate-900/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Treasury Status</CardTitle>
                                    <Landmark className="h-4 w-4 text-slate-400" />
                                </CardHeader>
                                <CardContent>
                                   <div className="text-sm font-medium text-green-400 flex items-center gap-2">
                                       <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                       Vault Active
                                   </div>
                                   <p className="text-[10px] text-slate-500 uppercase tracking-tight mt-1">Withdrawals Processed 24/7</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-slate-700 bg-slate-900/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-300">Transaction History</CardTitle>
                                    <CardDescription className="text-slate-500">Audit your incoming sales and outgoing withdrawals.</CardDescription>
                                </div>
                                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                                    {(['all', 'sales', 'withdrawals'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setActiveFilter(f)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all",
                                                activeFilter === f 
                                                    ? "bg-primary text-primary-foreground shadow-lg" 
                                                    : "text-slate-400 hover:text-slate-200"
                                            )}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingInitial ? (
                                    <TransactionTableSkeleton />
                                ) : filteredHistory.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                                    <TableHead className="text-slate-400">Date</TableHead>
                                                    <TableHead className="text-slate-400">Description</TableHead>
                                                    <TableHead className="text-slate-400 text-right">Amount</TableHead>
                                                    <TableHead className="text-slate-400 text-center">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                    {filteredHistory.map((tx) => {
                                                        const date = tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
                                                        const isSale = tx.type === 'sale';
                                                        
                                                        return (
                                                            <TableRow key={tx.id} className="border-slate-800 hover:bg-slate-800/50">
                                                                <TableCell className="text-slate-400">{format(date, 'MMM d, yyyy')}</TableCell>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={cn(
                                                                            "p-1.5 rounded-full",
                                                                            isSale ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                                                        )}>
                                                                            {isSale ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-slate-200">
                                                                                {isSale ? `Order ${tx.orderId}` : 'Withdrawal Request'}
                                                                            </p>
                                                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{tx.type}</p>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className={cn(
                                                                    "text-right font-mono font-bold",
                                                                    isSale ? "text-green-400" : "text-red-400"
                                                                )}>
                                                                    {isSale ? '+' : '-'} {formatCurrency(Math.round(tx.amount * 100))}
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={cn(
                                                                            "text-[10px] uppercase tracking-tighter",
                                                                            tx.status === 'completed' || tx.status === 'pending' ? "text-yellow-400 border-yellow-400/50" : 
                                                                            tx.status === 'rejected' ? "text-red-400 border-red-400/50" : 
                                                                            "text-slate-400 border-slate-700"
                                                                        )}
                                                                    >
                                                                        {tx.status.replace('-', ' ')}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                            </TableBody>
                                        </Table>
                                        {hasMore && (
                                            <div className="mt-6 flex justify-center">
                                                <Button 
                                                    variant="ghost" 
                                                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                                    onClick={handleLoadMore}
                                                    disabled={isLoadingMore}
                                                >
                                                    {isLoadingMore ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <ChevronDown className="mr-2 h-4 w-4" />
                                                    )}
                                                    Load More Activity
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-center">
                                        <WalletCards className="h-16 w-16 text-primary mb-4" />
                                        <p className="text-lg text-muted-foreground">No records found.</p>
                                        <p className="text-sm text-muted-foreground">Your transaction history will appear here as you sell and withdraw.</p>
                                    </div>
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
                                {isGlobalLoading ? (
                                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                ) : (
                                    <>
                                        <p className="text-5xl font-bold text-primary">{formatCurrency(Math.round(totalEarned * 100))}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">Minimum payout: {formatCurrency(1000)}</p>
                                    </>
                                )}
                            </CardContent>

                            <div className="px-6 pb-6 space-y-4">
                                <Button 
                                    size="lg" 
                                    className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:grayscale" 
                                    onClick={() => setIsModalOpen(true)}
                                    disabled={isBalanceTooLow || isGlobalLoading || isUnderReview}
                                >
                                    <Landmark className="mr-2 h-6 w-6"/> 
                                    {isUnderReview 
                                        ? 'Wallet Under Review' 
                                        : (isBalanceTooLow && !isGlobalLoading ? `Minimum ${formatCurrency(1000)} Required` : 'Request Payout')
                                    }
                                </Button>

                                {isUnderReview && (
                                    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-left text-xs">
                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <p>Withdrawals are restricted while your wallet is under manual review. This process usually concludes within 48 hours.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
