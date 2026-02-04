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
import { DollarSign, Percent, Banknote, Loader2, Wallet, Landmark, WalletCards, ChevronDown } from 'lucide-react';
import SomaLogo from '@/components/logo';
import { addDays, format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { WithdrawalModal } from '@/components/WithdrawalModal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';

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

const PAGE_SIZE = 20;

const TransactionTableSkeleton = () => (
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

    // Pagination States
    const [payoutsList, setPayoutsList] = useState<Payout[]>([]);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Secondary layer of protection: Redirect if pending review
    useEffect(() => {
        if (!profileLoading && userProfile?.status === 'pending_review') {
            router.push('/backstage/pending-review');
        }
    }, [userProfile, profileLoading, router]);

    // 1. Real-time query for BALANCE calculation (fetches all pending to ensure sum is accurate)
    const pendingPayoutsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'payouts_pending'), where('userId', '==', user.uid));
    }, [firestore, user]);

    const { data: allPendingPayouts, loading: balanceLoading } = useCollection<Payout>(pendingPayoutsQuery);
    
    // 2. Paginated fetch for Transaction History Table
    useEffect(() => {
        if (!firestore || !user) return;

        const fetchInitialPayouts = async () => {
            setIsLoadingInitial(true);
            try {
                const q = query(
                    collection(firestore, 'payouts_pending'),
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    limit(PAGE_SIZE)
                );
                
                const snapshot = await getDocs(q);
                const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Payout));
                
                setPayoutsList(items);
                setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
                setHasMore(snapshot.docs.length === PAGE_SIZE);
            } catch (error) {
                console.error("Error fetching initial payouts:", error);
            } finally {
                setIsLoadingInitial(false);
            }
        };

        fetchInitialPayouts();
    }, [firestore, user]);

    const handleLoadMore = async () => {
        if (!firestore || !user || !lastVisible || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const nextQ = query(
                collection(firestore, 'payouts_pending'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc'),
                startAfter(lastVisible),
                limit(PAGE_SIZE)
            );

            const snapshot = await getDocs(nextQ);
            const nextItems = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Payout));

            setPayoutsList(prev => [...prev, ...nextItems]);
            setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (error) {
            console.error("Error loading more payouts:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const completedWithdrawalsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'withdrawal_requests'), where('userId', '==', user.uid), where('status', '==', 'completed'), orderBy('paidAt', 'desc'));
    }, [firestore, user]);

    const { data: completedWithdrawals, loading: withdrawalsLoading } = useCollection<Withdrawal>(completedWithdrawalsQuery);

    const { totalEarned, platformFees } = useMemo(() => {
        if (!allPendingPayouts) return { totalEarned: 0, platformFees: 0 };
        
        const total = allPendingPayouts.reduce((acc, doc) => acc + (doc.amount || 0), 0);
        const commissionRate = userProfile?.planTier === 'BRAND' ? 0.03 : 0.09;
        const payoutPercentage = 1 - commissionRate;
        const fees = total > 0 ? (total / payoutPercentage) * commissionRate : 0;

        return { totalEarned: total, platformFees: fees };
    }, [allPendingPayouts, userProfile]);

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
    
    const isGlobalLoading = userLoading || balanceLoading || withdrawalsLoading || profileLoading;

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
                                    <CardTitle className="text-sm font-medium text-slate-400">Platform Fees Paid (Est.)</CardTitle>
                                    <Percent className="h-4 w-4 text-slate-400" />
                                </CardHeader>
                                <CardContent>
                                     {isGlobalLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <div className="text-3xl font-bold text-slate-200">{formatCurrency(Math.round(platformFees * 100))}</div>}
                                </CardContent>
                            </Card>
                             <Card className="border-slate-700 bg-slate-900/50">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">Next Payout Date</CardTitle>
                                    <Banknote className="h-4 w-4 text-slate-400" />
                                </CardHeader>
                                <CardContent>
                                   {isGlobalLoading ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <div className="text-3xl font-bold text-slate-200">{nextPayoutDate}</div>}
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="border-slate-700 bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="text-slate-300">Transaction History</CardTitle>
                                <CardDescription className="text-slate-500">A log of all your pending payout amounts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingInitial ? (
                                    <TransactionTableSkeleton />
                                ) : payoutsList.length > 0 ? (
                                    <>
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
                                                    {payoutsList.map((payout) => (
                                                        <TableRow key={payout.id} className="border-slate-800 hover:bg-slate-800/50">
                                                            <TableCell className="text-slate-400">{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                                                            <TableCell className="font-mono text-xs text-slate-300">{payout.orderId}</TableCell>
                                                            <TableCell className="text-right font-mono text-green-400">+ {formatCurrency(Math.round(payout.amount * 100))}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">{payout.status}</Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
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
                                                    Load More Transactions
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center text-center">
                                        <WalletCards className="h-16 w-16 text-primary mb-4" />
                                        <p className="text-lg text-muted-foreground">No transactions yet.</p>
                                        <p className="text-sm text-muted-foreground">Your profit journey starts here.</p>
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
                                    <p className="text-5xl font-bold text-primary">{formatCurrency(Math.round(totalEarned * 100))}</p>
                                )}
                            </CardContent>

                            <Button size="lg" className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsModalOpen(true)}>
                                <Landmark className="mr-2 h-6 w-6"/> Request Payout
                            </Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
