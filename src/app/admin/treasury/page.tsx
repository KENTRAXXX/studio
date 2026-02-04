
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useUserProfile, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  doc,
  getDocs,
  writeBatch,
  updateDoc,
  collectionGroup,
  limit,
  addDoc,
  serverTimestamp,
  setDoc,
  orderBy
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
  ShieldAlert,
  Activity,
  RefreshCw,
  Info,
  ShoppingBag,
  Eye,
  ArrowUpRight,
  ChevronRight,
  Percent
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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
};

type UserProfile = {
  id: string;
  planTier: string;
  email: string;
  displayName?: string;
  userRole: 'ADMIN' | 'MOGUL' | 'SELLER';
};

type PlatformMetadata = {
    paystackBalance: number;
    lastSynced: any;
    syncedBy: string;
}

type OrderProduct = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  wholesalePrice?: number;
};

type Order = {
  id: string;
  orderId: string;
  createdAt: string;
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered';
  cart: OrderProduct[];
};

type CombinedRequest = WithdrawalRequest & { user?: UserProfile };

export default function TreasuryPage() {
  const firestore = useFirestore();
  const { userProfile: adminProfile } = useUserProfile();
  const { toast } = useToast();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [corporateTransferAmount, setCorporateTransferAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // 1. Real-time Platform Metadata Listener
  const metaRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, 'platform_metadata', 'treasury');
  }, [firestore]);

  const { data: platformMeta, loading: metaLoading } = useDoc<PlatformMetadata>(metaRef);

  useEffect(() => {
      // Auto-initialize if document missing
      if (!metaLoading && !platformMeta && firestore && adminProfile) {
          setDoc(doc(firestore, 'platform_metadata', 'treasury'), {
              paystackBalance: 0,
              lastSynced: serverTimestamp(),
              syncedBy: 'System'
          });
      }
  }, [metaLoading, platformMeta, firestore, adminProfile]);

  // 2. Intelligence Data Fetching
  const pendingRequestsQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'withdrawal_requests'), where('status', '==', 'pending'));
  }, [firestore]);

  const allOrdersQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore]);

  const revenueLogsQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'revenue_logs'), limit(100));
  }, [firestore]);

  const allPayoutsQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'payouts_pending'), limit(100));
  }, [firestore]);

  const usersQ = useMemoFirebase(() => {
      if (!firestore) return null;
      return query(collection(firestore, 'users'), limit(500));
  }, [firestore]);

  const { data: requests, loading: requestsLoading } = useCollection<WithdrawalRequest>(pendingRequestsQ);
  const { data: orders, loading: ordersLoading } = useCollection<Order>(allOrdersQ);
  const { data: revenueLogs, loading: revenueLoading } = useCollection<any>(revenueLogsQ);
  const { data: allPayouts, loading: payoutsLoading } = useCollection<any>(allPayoutsQ);
  const { data: allUsers, loading: usersLoading } = useCollection<UserProfile>(usersQ);

  // 3. Financial Intelligence Aggregation
  const metrics = useMemo(() => {
      const gmv = orders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;
      const netRevenue = revenueLogs?.reduce((acc, l) => acc + (l.amount || 0), 0) || 0;
      const liability = allPayouts?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
      
      const transactionRev = revenueLogs?.filter(l => l.type === 'TRANSACTION').reduce((acc, l) => acc + (l.amount || 0), 0) || 0;
      const subscriptionRev = revenueLogs?.filter(l => l.type === 'SUBSCRIPTION').reduce((acc, l) => acc + (l.amount || 0), 0) || 0;

      return { gmv, netRevenue, liability, transactionRev, subscriptionRev };
  }, [orders, revenueLogs, allPayouts]);

  const usersMap = useMemo(() => {
      if (!allUsers) return new Map<string, UserProfile>();
      return new Map(allUsers.map(u => [u.id, u]));
  }, [allUsers]);

  const combinedRequests = useMemo(() => {
      if (!requests || !allUsers) return [];
      return requests.map(req => ({
          ...req,
          user: usersMap.get(req.userId)
      }));
  }, [requests, allUsers, usersMap]);

  // Order Stream Data
  const orderStream = useMemo(() => {
      if (!orders) return [];
      return orders.map(order => {
          const parts = (order as any).id.split('/');
          const storeId = parts[parts.indexOf('stores') + 1] || 'unknown';
          const mogul = usersMap.get(storeId);
          
          const feeRecord = revenueLogs?.find(l => l.orderId === order.orderId);
          
          return {
              ...order,
              storeId,
              mogulName: mogul?.displayName || mogul?.email || 'System Store',
              somaFee: feeRecord?.amount || 0
          };
      });
  }, [orders, usersMap, revenueLogs]);

  // Solvency Logic
  const paystackBalance = platformMeta?.paystackBalance || 0;
  const isLiquidityLow = paystackBalance < metrics.liability;
  const liquidityBuffer = paystackBalance - metrics.liability;
  const coverageRatio = metrics.liability > 0 ? (paystackBalance / metrics.liability) * 100 : 100;

  // Extraction Safety Logic
  const transferAmountNum = parseFloat(corporateTransferAmount) || 0;
  const isOverProfitLimit = transferAmountNum > metrics.netRevenue;
  const wouldDipBelowFloor = (paystackBalance - transferAmountNum) < metrics.liability;
  const isExtractionBlocked = isLiquidityLow || isOverProfitLimit || wouldDipBelowFloor;

  // 4. Operations
  const handleSyncBalance = async () => {
      if (!firestore || !adminProfile || !metaRef) return;
      setIsSyncing(true);
      try {
          const amount = parseFloat(newBalanceInput);
          if (isNaN(amount) || amount < 0) throw new Error("Invalid balance amount.");

          await updateDoc(metaRef, {
              paystackBalance: amount,
              lastSynced: serverTimestamp(),
              syncedBy: adminProfile.email
          });

          toast({ title: 'Gateway Synced', description: `Platform liquidity updated to ${formatCurrency(Math.round(amount * 100))}.` });
          setNewBalanceInput('');
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Sync Failed', description: error.message });
      } finally {
          setIsSyncing(false);
      }
  }

  const handleMarkAsPaid = async (request: CombinedRequest) => {
    if (!firestore) return;
    setProcessingId(request.id);

    try {
        const batch = writeBatch(firestore);
        const requestRef = doc(firestore, 'withdrawal_requests', request.id);

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
      if (!firestore || !corporateTransferAmount || isExtractionBlocked) return;
      setIsTransferring(true);

      try {
          const amount = parseFloat(corporateTransferAmount);
          if (isNaN(amount) || amount <= 0) throw new Error("Invalid transfer amount.");

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

  const isLoading = requestsLoading || ordersLoading || revenueLoading || payoutsLoading || usersLoading || metaLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const transactionPct = metrics.netRevenue > 0 ? (metrics.transactionRev / metrics.netRevenue) * 100 : 0;
  const subscriptionPct = metrics.netRevenue > 0 ? (metrics.subscriptionRev / metrics.netRevenue) * 100 : 0;

  return (
    <div className="space-y-10 pb-24">
      {/* Liquidity Alert Protocol */}
      {isLiquidityLow && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive border-2 animate-pulse py-6">
          <ShieldAlert className="h-8 w-8 text-destructive shrink-0" />
          <div className="ml-4">
            <AlertTitle className="text-xl font-headline font-black uppercase tracking-widest">Critical: Liquidity Alert</AlertTitle>
            <AlertDescription className="text-base font-medium mt-1">
              Platform liability ({formatCurrency(Math.round(metrics.liability * 100))}) exceeds Gateway Balance ({formatCurrency(Math.round(paystackBalance * 100))}). 
              <br />
              <strong>Deficit:</strong> {formatCurrency(Math.round(Math.abs(liquidityBuffer) * 100))}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary flex items-center gap-3">
                <Landmark className="h-10 w-10" />
                Treasury Intelligence
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">Real-time audit of ecosystem liquidity and platform yield.</p>
        </div>
        <div className="flex items-center gap-4">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 h-12 px-6">
                        <RefreshCw className="mr-2 h-4 w-4" /> Sync Gateway
                    </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-primary">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-primary">Synchronize Paystack Balance</DialogTitle>
                        <DialogDescription>
                            Input the "Available Balance" from your Paystack dashboard to update solvency metrics.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Gateway Balance ($)</Label>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={newBalanceInput}
                                onChange={(e) => setNewBalanceInput(e.target.value)}
                                className="h-12 text-xl font-mono border-primary/20"
                            />
                        </div>
                        {platformMeta && (
                            <div className="text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                    Last synced: {platformMeta.lastSynced?.toDate ? platformMeta.lastSynced.toDate().toLocaleString() : 'Never'}
                                </p>
                                <p className="text-[10px] text-primary font-bold mt-1 uppercase">Synced By: {platformMeta.syncedBy}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full btn-gold-glow bg-primary h-12 font-bold" 
                            onClick={handleSyncBalance}
                            disabled={isSyncing || !newBalanceInput}
                        >
                            {isSyncing ? <Loader2 className="animate-spin" /> : "Confirm Synchronization"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/5 border border-primary/20 shadow-gold-glow">
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Ledger Listeners Active</span>
            </div>
        </div>
      </header>

      {/* Financial Bucket Grid */}
      <div className="grid gap-8 md:grid-cols-4">
        <Card className="border-primary/20 bg-slate-900/30 relative overflow-hidden group min-h-[180px] flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Ecosystem Volume (GMV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-white tracking-tighter">
                {formatCurrency(Math.round(metrics.gmv * 100))}
            </div>
            <p className="text-[10px] text-green-500 font-bold mt-3 uppercase tracking-widest">Aggregated Gross Sales</p>
          </CardContent>
        </Card>

        <Card className="border-primary bg-primary/5 relative overflow-hidden group min-h-[180px] flex flex-col justify-center shadow-gold-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">SOMA Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-primary tracking-tighter">
                {formatCurrency(Math.round(metrics.netRevenue * 100))}
            </div>
            <p className="text-[10px] text-primary/60 mt-3 uppercase tracking-widest font-black">Fees + Plan Subscriptions</p>
          </CardContent>
        </Card>

        <Card className={cn(
            "relative overflow-hidden group min-h-[180px] flex flex-col justify-center border-2",
            isLiquidityLow ? "border-destructive bg-destructive/5" : "border-red-500/30 bg-red-500/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400/60">System Payout Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-red-400 tracking-tighter">
                {formatCurrency(Math.round(metrics.liability * 100))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-widest">Total Partner Funds Owed</p>
          </CardContent>
        </Card>

        <Card className={cn(
            "relative overflow-hidden group min-h-[180px] flex flex-col justify-center border-2",
            isLiquidityLow ? "border-destructive bg-destructive/10" : "border-green-500/30 bg-green-500/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Gateway Liquidity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
                "text-4xl font-bold font-mono tracking-tighter",
                isLiquidityLow ? "text-destructive" : "text-green-400"
            )}>
                {formatCurrency(Math.round(paystackBalance * 100))}
            </div>
            <p className={cn(
                "text-[10px] font-bold mt-3 uppercase tracking-widest",
                isLiquidityLow ? "text-destructive" : "text-green-500"
            )}>
                {isLiquidityLow ? "DEFICIT DETECTED" : "FULLY PROTECTED"} ({coverageRatio.toFixed(1)}%)
            </p>
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
                        <CardDescription className="text-base">Review and authorize pending partner withdrawal requests.</CardDescription>
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

        {/* Right: Corporate Extraction Controls */}
        <div className="lg:col-span-4 space-y-8">
            <Card className="border-primary/50 bg-slate-900/40 overflow-hidden shadow-2xl">
                <CardHeader className="bg-primary/10 border-b border-primary/20">
                    <CardTitle className="text-sm font-headline uppercase tracking-[0.2em] text-primary flex items-center gap-3">
                        <Building2 className="h-5 w-5" />
                        Corporate Extraction
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <Label className="text-xs font-black uppercase text-slate-500 tracking-widest">Available Profit</Label>
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
                                className={cn(
                                    "h-14 text-xl font-mono border-primary/20 bg-black/40 focus-visible:ring-primary",
                                    isExtractionBlocked && transferAmountNum > 0 && "border-destructive focus-visible:ring-destructive"
                                )}
                            />
                        </div>

                        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    className="w-full h-16 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest group"
                                    disabled={!corporateTransferAmount || transferAmountNum <= 0 || isExtractionBlocked}
                                >
                                    <ArrowRightLeft className="mr-3 h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
                                    {isLiquidityLow ? "Extraction Frozen" : "Extract Profit"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-primary p-8">
                                <DialogHeader>
                                    <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit mb-4">
                                        <ShieldAlert className="h-10 w-10 text-primary" />
                                    </div>
                                    <DialogTitle className="text-2xl font-headline text-center text-primary">Authorize Executive Transfer</DialogTitle>
                                    <DialogDescription className="text-center pt-2 text-base text-slate-400">
                                        Confirm extraction of <span className="text-white font-bold font-mono">{formatCurrency(Math.round(transferAmountNum * 100))}</span> to the SOMA corporate account.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-6 border-y border-primary/10 my-4 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Source:</span>
                                        <span className="font-bold text-slate-200">Platform Net Profit</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Status:</span>
                                        <span className={cn("font-bold", isLiquidityLow ? "text-destructive" : "text-green-500")}>
                                            {isLiquidityLow ? "UNSAFE (LIQUIDITY GAP)" : "LIQUIDITY SECURE"}
                                        </span>
                                    </div>
                                </div>
                                <DialogFooter className="flex-col sm:flex-col gap-3">
                                    <Button 
                                        className="w-full h-14 text-lg btn-gold-glow font-bold" 
                                        onClick={handleCorporateTransfer}
                                        disabled={isTransferring || isExtractionBlocked}
                                    >
                                        {isTransferring ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
                                        Confirm Transfer
                                    </Button>
                                    <DialogClose asChild>
                                        <Button variant="ghost" className="text-slate-500">Cancel</Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {isExtractionBlocked && transferAmountNum > 0 && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold leading-tight uppercase animate-in slide-in-from-top-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>
                                    {isLiquidityLow 
                                        ? "Extraction blocked: Gateway balance must cover all Mogul liabilities before profit can be moved."
                                        : isOverProfitLimit 
                                            ? `Extraction exceeds available profit of ${formatCurrency(Math.round(metrics.netRevenue * 100))}.`
                                            : "Extraction would dip gateway balance below the required liability floor."
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Platform Yield distribution */}
            <Card className="border-primary/10 bg-slate-900/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Platform Yield Mix</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Transactional Commission</span>
                            <span>{Math.round(transactionPct)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${transactionPct}%` }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Subscription Fees</span>
                            <span>{Math.round(subscriptionPct)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-600 transition-all duration-1000" style={{ width: `${subscriptionPct}%` }} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Global Order Stream */}
      <section className="space-y-6">
          <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold font-headline">Global Order Stream</h2>
          </div>
          
          <Card className="border-primary/50 overflow-hidden bg-slate-900/20">
              <Table>
                  <TableHeader className="bg-black/40">
                      <TableRow className="border-primary/10 h-14">
                          <TableHead className="px-8">Order ID</TableHead>
                          <TableHead>Mogul Name</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                          <TableHead className="text-right">SOMA Fee</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right px-8">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {orderStream.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                  Waiting for first ecosystem transaction signal...
                              </TableCell>
                          </TableRow>
                      ) : (
                          orderStream.map((order) => (
                              <TableRow key={order.id} className="border-primary/5 hover:bg-primary/5 transition-colors h-16 group">
                                  <TableCell className="px-8 font-mono text-xs text-primary font-bold">{order.orderId}</TableCell>
                                  <TableCell>
                                      <div className="font-bold text-slate-200 text-sm truncate max-w-[150px]">{order.mogulName}</div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Store ID: {order.storeId.slice(0, 8)}</p>
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-slate-200">
                                      {formatCurrency(Math.round(order.total * 100))}
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-primary">
                                      {formatCurrency(Math.round(order.somaFee * 100))}
                                  </TableCell>
                                  <TableCell className="text-center">
                                      <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5 text-[10px] font-black">
                                          {order.status.toUpperCase()}
                                      </Badge>
                                  </TableCell>
                                  <TableCell className="text-right px-8">
                                      <Dialog>
                                          <DialogTrigger asChild>
                                              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">
                                                  <Eye className="mr-2 h-3 w-3" /> Inspect Split
                                              </Button>
                                          </DialogTrigger>
                                          <DialogContent className="bg-card border-primary sm:max-w-[500px]">
                                              <DialogHeader>
                                                  <DialogTitle className="text-2xl font-headline text-primary">Financial Split: {order.orderId}</DialogTitle>
                                                  <DialogDescription>Detailed audit of fund distribution for this transaction.</DialogDescription>
                                              </DialogHeader>
                                              
                                              <div className="py-6 space-y-8">
                                                  <div className="space-y-4">
                                                      <div className="flex justify-between items-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                                                          <span className="text-sm font-bold text-slate-400">Gross Transaction</span>
                                                          <span className="text-2xl font-bold font-mono text-slate-200">{formatCurrency(Math.round(order.total * 100))}</span>
                                                      </div>
                                                  </div>

                                                  <div className="space-y-4">
                                                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-2">Platform Split Analysis</h4>
                                                      
                                                      <div className="grid gap-4">
                                                          {/* Wholesale to Brand */}
                                                          <div className="flex items-center justify-between">
                                                              <div className="flex items-center gap-3">
                                                                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                                      <Building2 className="h-4 w-4" />
                                                                  </div>
                                                                  <div>
                                                                      <p className="text-xs font-bold text-slate-200">Wholesale to Brand</p>
                                                                      <p className="text-[9px] text-muted-foreground">Supplier Payout (Excl. Commission)</p>
                                                                  </div>
                                                              </div>
                                                              <span className="font-mono text-sm font-bold text-slate-300">
                                                                  {formatCurrency(Math.round((order.total - order.somaFee - (order.total * 0.4)) * 100))}
                                                              </span>
                                                          </div>

                                                          {/* Commission to Mogul */}
                                                          <div className="flex items-center justify-between">
                                                              <div className="flex items-center gap-3">
                                                                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                                                                      <TrendingUp className="h-4 w-4" />
                                                                  </div>
                                                                  <div>
                                                                      <p className="text-xs font-bold text-slate-200">Commission to Mogul</p>
                                                                      <p className="text-[9px] text-muted-foreground">Store Owner Retail Profit</p>
                                                                  </div>
                                                              </div>
                                                              <span className="font-mono text-sm font-bold text-green-400">
                                                                  {formatCurrency(Math.round((order.total * 0.4) * 100))}
                                                              </span>
                                                          </div>

                                                          {/* Fee to SOMA */}
                                                          <div className="flex items-center justify-between">
                                                              <div className="flex items-center gap-3">
                                                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                                      <Percent className="h-4 w-4" />
                                                                  </div>
                                                                  <div>
                                                                      <p className="text-xs font-bold text-slate-200">Fee to SOMA</p>
                                                                      <p className="text-[9px] text-muted-foreground">Platform Infrastructure Cut</p>
                                                                  </div>
                                                              </div>
                                                              <span className="font-mono text-sm font-bold text-primary">
                                                                  {formatCurrency(Math.round(order.somaFee * 100))}
                                                              </span>
                                                          </div>
                                                      </div>
                                                  </div>

                                                  <div className="p-4 rounded-lg bg-slate-900/50 border border-white/5 flex items-center gap-3 text-xs italic text-slate-500">
                                                      <Info className="h-4 w-4 text-primary shrink-0" />
                                                      <p>Calculation based on real-time ledger records from the SOMA financial core.</p>
                                                  </div>
                                              </div>

                                              <DialogFooter>
                                                  <DialogClose asChild>
                                                      <Button variant="outline" className="w-full h-12 border-primary/20 text-primary">Close Auditor</Button>
                                                  </DialogClose>
                                              </DialogFooter>
                                          </DialogContent>
                                      </Dialog>
                                  </TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </Card>
      </section>
    </div>
  );
}
