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
  limit
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
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/format';

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

  // 1. Data Fetching for Metrics
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

      return { gmv, netRevenue, liability, totalPendingWithdrawals };
  }, [allOrders, revenueLogs, allPayouts, requests]);

  const combinedRequests = useMemo(() => {
      if (!requests || !allUsers) return [];
      const usersMap = new Map(allUsers.map(u => [u.id, u]));
      return requests.map(req => ({
          ...req,
          user: usersMap.get(req.userId)
      }));
  }, [requests, allUsers]);

  const handleMarkAsPaid = async (request: CombinedRequest) => {
    if (!firestore) return;
    setProcessingId(request.id);

    try {
        const requestRef = doc(firestore, 'withdrawal_requests', request.id);
        const userRef = doc(firestore, 'users', request.userId);
        
        const requestSnap = await getDoc(requestRef);
        if (requestSnap.data()?.status !== 'pending') {
            toast({ variant: 'destructive', title: 'Action Failed', description: `Request is no longer pending.` });
            setProcessingId(null);
            return;
        }

        const batch = writeBatch(firestore);

        // Move pending payouts to completed
        const pendingPayoutsQuery = query(collection(firestore, 'payouts_pending'), where('userId', '==', request.userId), where('status', '==', 'pending'));
        const pendingPayoutsSnap = await getDocs(pendingPayoutsQuery);
        
        pendingPayoutsSnap.forEach(payoutDoc => {
            const completedPayoutRef = doc(collection(firestore, 'payouts_completed'));
            batch.set(completedPayoutRef, { ...payoutDoc.data(), paidAt: new Date().toISOString(), withdrawalId: request.id });
            batch.delete(payoutDoc.ref);
        });

        batch.update(requestRef, {
            status: 'completed',
            paidAt: new Date().toISOString(),
        });

        await batch.commit();
        toast({ title: 'Transfer Confirmed', description: `Payout of ${formatCurrency(Math.round(request.amount * 100))} marked as completed.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Execution Failed', description: error.message });
    } finally {
        setProcessingId(null);
    }
  };
  
  const handleDecline = async (request: CombinedRequest, reason: string) => {
    if (!firestore) return;
    setProcessingId(request.id);
     try {
        const requestRef = doc(firestore, 'withdrawal_requests', request.id);
        await updateDoc(requestRef, {
            status: 'rejected',
            reason: reason,
        });
        toast({ title: 'Request Rejected', description: 'User has been notified via dashboard.' });
     } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
     } finally {
         setProcessingId(null);
     }
  }

  const isLoading = requestsLoading || ordersLoading || revenueLoading || payoutsLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
                <Landmark className="h-8 w-8" />
                Global Treasury Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">Strategic oversight of ecosystem liquidity and platform performance.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 shadow-gold-glow">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Real-Time Ledger Active</span>
        </div>
      </header>

      {/* Row 1: Global Growth Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-primary/20 bg-slate-900/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className="h-20 w-20" />
          </div>
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Ecosystem Volume (GMV)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-white">{formatCurrency(Math.round(metrics.gmv * 100))}</div>
            <p className="text-[10px] text-green-500 font-bold mt-2 flex items-center gap-1 uppercase">
                <TrendingUp className="h-3 w-3" /> Aggregated Network Output
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-slate-900/30 relative overflow-hidden group">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">SOMA Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">{formatCurrency(Math.round(metrics.netRevenue * 100))}</div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase">Fees + Entrance Subscriptions</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5 relative overflow-hidden group">
          <CardHeader>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/60">Payout Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-red-400">{formatCurrency(Math.round(metrics.liability * 100))}</div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase">Total User Funds in Transit</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Withdrawal Queue */}
        <div className="lg:col-span-8 space-y-6">
            <Card className="border-primary/50 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            Payout Fulfillment Queue
                        </CardTitle>
                        <CardDescription>
                            Review and authorize pending withdrawal requests.
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary/20 text-primary font-mono">
                        {combinedRequests.length} REQUESTS
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-black/20">
                    <TableRow className="border-primary/10">
                        <TableHead>Recipient Partner</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Bank Details</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {combinedRequests.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={4} className="h-48 text-center text-muted-foreground italic">
                            The withdrawal queue is currently empty.
                        </TableCell>
                        </TableRow>
                    ) : (
                        combinedRequests.map((req) => (
                        <TableRow key={req.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                            <TableCell>
                            <div className="font-bold text-slate-200">{req.user?.email || 'System Partner'}</div>
                            <div className="flex items-center gap-1 mt-1">
                                <ShieldCheck className="h-3 w-3 text-primary"/>
                                <span className="text-[10px] font-black uppercase text-primary/60">{req.user?.planTier || 'N/A'}</span>
                            </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="text-lg font-bold text-primary font-mono">{formatCurrency(Math.round(req.amount * 100))}</span>
                            </TableCell>
                            <TableCell>
                                <div className="text-xs font-bold text-slate-300">{req.bankDetails.accountName}</div>
                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{req.bankDetails.bankName} • {req.bankDetails.accountNumber}</div>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                {processingId === req.id ? <Loader2 className="animate-spin ml-auto h-5 w-5 text-primary" /> : (
                                    <>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-400/10">Decline</Button>
                                            </DialogTrigger>
                                            <DialogContent className="bg-card border-red-500/50">
                                                <DialogHeader>
                                                    <DialogTitle className="text-red-400 font-headline">Decline Request</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <p className="text-sm text-slate-400 leading-relaxed">Declining request for <span className="font-bold text-white">{formatCurrency(Math.round(req.amount * 100))}</span> from <span className="font-mono text-primary">{req.user?.email}</span>.</p>
                                                    <div className="space-y-2">
                                                        <Label>Administrative Reason</Label>
                                                        <Input 
                                                            id="decline-reason" 
                                                            placeholder="e.g., Verification discrepancy in bank metadata." 
                                                            className="bg-black/40 border-red-500/20"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="ghost" onClick={() => {}} className="border-slate-800">Cancel</Button>
                                                    <Button 
                                                        variant="destructive" 
                                                        onClick={() => {
                                                            const reason = (document.getElementById('decline-reason') as HTMLInputElement)?.value;
                                                            handleDecline(req, reason || 'Discrepancy detected during treasury audit.');
                                                        }}
                                                    >
                                                        Confirm Decline
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                        <Button size="sm" className="btn-gold-glow bg-primary" onClick={() => handleMarkAsPaid(req)}>
                                            <CheckCircle className="mr-2 h-4 w-4"/> Authorize Payout
                                        </Button>
                                    </>
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

        {/* Right: Treasury Operations Sidebar */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="border-primary/20 bg-slate-900/40">
                <CardHeader>
                    <CardTitle className="text-xs font-headline uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Executive Compliance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-slate-200">KYC Authorization</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">Authorizing a payout confirms that you have manually verified the recipient's identity and banking provenance.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400 uppercase tracking-tighter">Total Pending Approval</span>
                            <span className="font-mono font-bold text-primary">{formatCurrency(Math.round(metrics.totalPendingWithdrawals * 100))}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400 uppercase tracking-tighter">Liquid Reserve Target</span>
                            <span className="font-mono font-bold text-green-500">100% COVERED</span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full h-11 border-primary/20 text-primary hover:bg-primary/5 font-bold uppercase tracking-widest text-[10px]">
                        Export Treasury Ledger
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-primary/10 bg-slate-900/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Revenue Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Platform Cuts</span>
                            <span>82%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: '82%' }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                            <span>Subscriptions</span>
                            <span>18%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-600" style={{ width: '18%' }} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
