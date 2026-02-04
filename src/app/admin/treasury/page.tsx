'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useUserProfile, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  doc,
  getDocs,
  writeBatch,
  updateDoc,
  getDoc,
  collectionGroup,
  limit,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Loader2,
  CheckCircle,
  ShieldCheck,
  Landmark,
  TrendingUp,
  Wallet,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  ShieldAlert
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';

type WithdrawalRequest = {
  id: string;
  userId: string;
  amount: number;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    iban?: string;
    swiftBic?: string;
  };
  status: 'pending' | 'completed' | 'declined' | 'awaiting-confirmation';
  createdAt: any;
  reason?: string;
};

type UserProfile = {
  id: string;
  planTier: string;
  email: string;
  userRole: 'ADMIN' | 'MOGUL' | 'SELLER';
};

type CombinedRequest = WithdrawalRequest & { user?: UserProfile };

export default function TreasuryPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [corporateTransferAmount, setCorporateTransferAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // 1. Data Fetching for Executive Metrics
  const pendingRequestsQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'withdrawal_requests'), where('status', '==', 'pending'));
  }, [firestore]);

  const allOrdersQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collectionGroup(firestore, 'orders'), limit(1000));
  }, [firestore]);

  const revenueLogsQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'revenue_logs'), limit(1000));
  }, [firestore]);

  const allPayoutsQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'payouts_pending'), limit(1000));
  }, [firestore]);

  const usersQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'users'), limit(1000));
  }, [firestore]);

  const { data: requests, loading: requestsLoading } = useCollection<WithdrawalRequest>(pendingRequestsQ);
  const { data: allOrders, loading: ordersLoading } = useCollection<any>(allOrdersQ);
  const { data: revenueLogs, loading: revenueLoading } = useCollection<any>(revenueLogsQ);
  const { data: allPayouts, loading: payoutsLoading } = useCollection<any>(allPayoutsQ);
  const { data: allUsers, loading: usersLoading } = useCollection<UserProfile>(usersQ);

  // 2. Intelligence Aggregation
  const metrics = useMemo(() => {
      const gmv = allOrders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;
      const netRevenue = revenueLogs?.reduce((acc, l) => acc + (l.amount || 0), 0) || 0;
      const liability = allPayouts?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
      const totalPendingWithdrawals = requests?.reduce((acc, r) => acc + (r.amount || 0), 0) || 0;

      // Breakdown by Type (TRANSACTION vs SUBSCRIPTION)
      const transactionRev = revenueLogs?.filter(l => l.type === 'TRANSACTION').reduce((acc, l) => acc + (l.amount || 0), 0) || 0;
      const subscriptionRev = revenueLogs?.filter(l => l.type === 'SUBSCRIPTION').reduce((acc, l) => acc + (l.amount || 0), 0) || 0;

      return { gmv, netRevenue, liability, totalPendingWithdrawals, transactionRev, subscriptionRev };
  }, [allOrders, revenueLogs, allPayouts, requests]);

  const combinedRequests = useMemo(() => {
      if (!requests || !allUsers) return [];
      const usersMap = new Map(allUsers.map(u => [u.id, u]));
      return requests.map(req => ({
          ...req,
          user: usersMap.get(req.userId)
      }));
  }, [requests, allUsers]);

  // 3. Operational Logic
  const handleMarkAsPaid = async (request: CombinedRequest) => {
    if (!firestore) return;
    setProcessingId(request.id);

    try {
        const batch = writeBatch(firestore);
        const requestRef = doc(firestore, 'withdrawal_requests', request.id);

        // Move partner's pending payouts to completed
        const pendingPayoutsQuery = query(
            collection(firestore, 'payouts_pending'), 
            where('userId', '==', request.userId), 
            where('status', '==', 'pending')
        );
        const pendingPayoutsSnap = await getDocs(pendingPayoutsQuery);
        
        pendingPayoutsSnap.forEach(payoutDoc => {
            const completedPayoutRef = doc(collection(firestore, 'payouts_completed'));
            batch.set(completedPayoutRef, { 
                ...payoutDoc.data(), 
                paidAt: serverTimestamp(), 
                withdrawalId: request.id 
            });
            batch.delete(payoutDoc.ref);
        });

        batch.update(requestRef, {
            status: 'completed',
            paidAt: serverTimestamp(),
        });

        await batch.commit();
        toast({ title: 'Transfer Confirmed', description: `Payout of ${formatCurrency(Math.round(request.amount * 100))} marked as completed.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Execution Failed', description: error.message });
    } finally {
        setProcessingId(null);
    }
  };

  const handleCorporateTransfer = async () => {
      if (!firestore || !corporateTransferAmount) return;
      setIsTransferring(true);

      try {
          const amount = parseFloat(corporateTransferAmount);
          if (isNaN(amount) || amount <= 0) throw new Error("Invalid transfer amount.");
          if (amount > metrics.netRevenue) throw new Error("Transfer amount exceeds platform net profit.");

          // Log the corporate transfer
          await addDoc(collection(firestore, 'corporate_transfers'), {
              amount,
              type: 'WITHDRAWAL',
              status: 'COMPLETED',
              initiatedBy: 'ADMIN',
              createdAt: serverTimestamp()
          });

          toast({
              title: 'Corporate Transfer Logged',
              description: `${formatCurrency(Math.round(amount * 100))} has been allocated to the corporate treasury.`,
          });
          setCorporateTransferAmount('');
          setIsConfirmDialogOpen(false);
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Transfer Error', description: error.message });
      } finally {
          setIsTransferring(false);
      }
  };

  const isLoading = requestsLoading || ordersLoading || revenueLoading || payoutsLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate percentages for the breakdown bars
  const transactionPct = metrics.netRevenue > 0 ? (metrics.transactionRev / metrics.netRevenue) * 100 : 0;
  const subscriptionPct = metrics.netRevenue > 0 ? (metrics.subscriptionRev / metrics.netRevenue) * 100 : 0;

  return (
    <div className="space-y-10 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary flex items-center gap-3">
                <Landmark className="h-10 w-10" />
                Global Treasury Intelligence
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">Strategic oversight of ecosystem liquidity and platform performance.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/5 border border-primary/20 shadow-gold-glow">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Ledger Synchronization Active</span>
        </div>
      </header>

      {/* Row 1: Primary Financial Buckets */}
      <div className="grid gap-8 md:grid-cols-3">
        <Card className="border-primary/20 bg-slate-900/30 relative overflow-hidden group min-h-[180px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Total Ecosystem Volume (GMV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-mono text-white tracking-tighter">
                {formatCurrency(Math.round(metrics.gmv * 100))}
            </div>
            <p className="text-[10px] text-green-500 font-bold mt-3 flex items-center gap-1 uppercase tracking-widest">
                <TrendingUp className="h-3 w-3" /> Aggregated Network Output
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary bg-primary/5 relative overflow-hidden group min-h-[180px] flex flex-col justify-center shadow-gold-glow">
          <div className="absolute inset-0 bg-primary/[0.02] animate-pulse pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">SOMA Net Platform Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-mono text-primary tracking-tighter">
                {formatCurrency(Math.round(metrics.netRevenue * 100))}
            </div>
            <p className="text-[10px] text-primary/60 mt-3 uppercase tracking-widest font-black">Fees + Plan Subscriptions</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5 relative overflow-hidden group min-h-[180px] flex flex-col justify-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400/60">System Payout Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold font-mono text-red-400 tracking-tighter">
                {formatCurrency(Math.round(metrics.liability * 100))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-widest">Total Partner Funds in Transit</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Withdrawal & Payout Queue */}
        <div className="lg:col-span-8 space-y-8">
            <Card className="border-primary/50 overflow-hidden bg-slate-900/20">
                <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between py-6 px-8">
                    <div>
                        <CardTitle className="text-2xl font-headline flex items-center gap-3">
                            <Wallet className="h-6 w-6 text-primary" />
                            Partner Fulfillment Queue
                        </CardTitle>
                        <CardDescription className="text-base">
                            Review and authorize pending partner withdrawal requests.
                        </CardDescription>
                    </div>
                    <Badge className="bg-primary text-primary-foreground font-mono text-sm px-4 py-1">
                        {combinedRequests.length} PENDING
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-black/40">
                    <TableRow className="border-primary/10 h-14">
                        <TableHead className="px-8">Recipient Partner</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Account Provenance</TableHead>
                        <TableHead className="text-right px-8">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {combinedRequests.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={4} className="h-64 text-center text-muted-foreground italic text-lg">
                            The withdrawal queue is currently clear.
                        </TableCell>
                        </TableRow>
                    ) : (
                        combinedRequests.map((req) => (
                        <TableRow key={req.id} className="border-primary/5 hover:bg-primary/5 transition-colors h-20">
                            <TableCell className="px-8">
                                <div className="font-bold text-slate-200 text-lg">{req.user?.email || 'System Partner'}</div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-primary"/>
                                    <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">{req.user?.planTier || 'PRO'}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="text-2xl font-bold text-primary font-mono">{formatCurrency(Math.round(req.amount * 100))}</span>
                            </TableCell>
                            <TableCell>
                                <div className="text-xs font-bold text-slate-300 uppercase tracking-tighter">{req.bankDetails.accountName}</div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-1">{req.bankDetails.bankName} • ****{req.bankDetails.accountNumber.slice(-4)}</div>
                            </TableCell>
                            <TableCell className="text-right px-8 space-x-3">
                                {processingId === req.id ? (
                                    <Loader2 className="animate-spin ml-auto h-6 w-6 text-primary" />
                                ) : (
                                    <Button 
                                        size="lg" 
                                        className="btn-gold-glow bg-primary h-12 px-6 font-bold" 
                                        onClick={() => handleMarkAsPaid(req)}
                                    >
                                        <CheckCircle className="mr-2 h-5 w-5"/> Authorize Transfer
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                        ))
                    )}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </div>

        {/* Right: Operational Controls */}
        <div className="lg:col-span-4 space-y-8">
            <Card className="border-primary/50 bg-slate-900/40 overflow-hidden shadow-2xl">
                <CardHeader className="bg-primary/10 border-b border-primary/20">
                    <CardTitle className="text-sm font-headline uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                        <Building2 className="h-5 w-5" />
                        Corporate Treasury
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Available for Extraction</Label>
                            <span className="text-2xl font-mono font-bold text-primary">{formatCurrency(Math.round(metrics.netRevenue * 100))}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary shadow-gold-glow" style={{ width: '100%' }} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="transfer-amount">Extraction Amount ($)</Label>
                            <Input 
                                id="transfer-amount"
                                type="number"
                                placeholder="0.00"
                                value={corporateTransferAmount}
                                onChange={(e) => setCorporateTransferAmount(e.target.value)}
                                className="h-14 text-xl font-mono border-primary/20 bg-black/40 focus-visible:ring-primary"
                            />
                        </div>

                        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    className="w-full h-16 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest group"
                                    disabled={!corporateTransferAmount || parseFloat(corporateTransferAmount) <= 0 || parseFloat(corporateTransferAmount) > metrics.netRevenue}
                                >
                                    <ArrowRightLeft className="mr-3 h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
                                    Transfer to Corporate
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-primary p-8">
                                <DialogHeader>
                                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                                        <ShieldAlert className="h-10 w-10 text-primary" />
                                    </div>
                                    <DialogTitle className="text-2xl font-headline text-center text-primary">Authorize Executive Transfer</DialogTitle>
                                    <DialogDescription className="text-center pt-2 text-base text-slate-400">
                                        You are about to transfer <span className="text-white font-bold font-mono">{formatCurrency(Math.round(parseFloat(corporateTransferAmount || '0') * 100))}</span> from the platform holdings to the SOMA corporate account.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-6 border-y border-primary/10 my-4 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Source:</span>
                                        <span className="font-bold text-slate-200 uppercase tracking-widest">Platform Net Profit</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Destination:</span>
                                        <span className="font-bold text-slate-200 uppercase tracking-widest">Corporate Treasury</span>
                                    </div>
                                </div>
                                <DialogFooter className="flex-col sm:flex-col gap-3">
                                    <Button 
                                        className="w-full h-14 text-lg btn-gold-glow font-bold" 
                                        onClick={handleCorporateTransfer}
                                        disabled={isTransferring}
                                    >
                                        {isTransferring ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                                        Confirm Executive Transfer
                                    </Button>
                                    <DialogClose asChild>
                                        <Button variant="ghost" className="text-slate-500">Cancel</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 italic text-[11px] text-slate-500 leading-relaxed">
                        <p>Platform profits include accumulated commissions from all supplier transactions and recurring SaaS subscriptions. Extraction requests are logged for global audit compliance.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Platform Yield Distribution - Dynamic ledger audit */}
            <Card className="border-primary/10 bg-slate-900/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Platform Yield Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Transaction Commissions</span>
                            <span>{Math.round(transactionPct)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-1000" 
                                style={{ width: `${transactionPct}%` }} 
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>SaaS Subscriptions</span>
                            <span>{Math.round(subscriptionPct)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-slate-600 transition-all duration-1000" 
                                style={{ width: `${subscriptionPct}%` }} 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}