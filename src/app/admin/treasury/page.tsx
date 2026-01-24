
'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useCollection, useUserProfile } from '@/firebase';
import {
  collection,
  query,
  where,
  doc,
  getDocs,
  writeBatch,
  updateDoc,
  getDoc,
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
import { useRouter } from 'next/navigation';

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
  status: 'pending' | 'completed' | 'declined';
  createdAt: any;
  reason?: string;
};

type UserProfile = {
  id: string;
  planTier: string;
  email: string;
  userRole: 'ADMIN' | 'MOGUL' | 'SELLER';
};

type RevenueLog = {
    id: string;
    amount: number;
}

type CombinedRequest = WithdrawalRequest & { user?: UserProfile };

const useTreasuryData = () => {
    const firestore = useFirestore();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const router = useRouter();

    const [combinedData, setCombinedData] = useState<CombinedRequest[]>([]);
    const [summaryStats, setSummaryStats] = useState({ totalPending: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profileLoading) return;
        if (!userProfile) {
            router.push('/dashboard');
            return;
        }
        if (userProfile.userRole !== 'ADMIN') {
            router.push('/access-denied');
        }
    }, [userProfile, profileLoading, router]);

    useEffect(() => {
        if (!firestore || userProfile?.userRole !== 'ADMIN') return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch pending withdrawal requests
                const requestsQuery = query(collection(firestore, 'withdrawal_requests'), where('status', '==', 'pending'));
                const requestsSnap = await getDocs(requestsQuery);
                const requests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest));

                // 2. Fetch all users
                const usersSnap = await getDocs(collection(firestore, 'users'));
                const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
                const usersMap = new Map(users.map(u => [u.id, u]));
                
                // 3. Fetch revenue logs
                const revenueSnap = await getDocs(collection(firestore, 'revenue_logs'));
                const revenues = revenueSnap.docs.map(d => d.data() as RevenueLog);

                // 4. Combine requests with user data
                const combined = requests.map(req => ({
                    ...req,
                    user: usersMap.get(req.userId)
                }));
                setCombinedData(combined);

                // 5. Calculate summary stats
                const totalPending = requests.reduce((sum, req) => sum + req.amount, 0);
                const totalRevenue = revenues.reduce((sum, rev) => sum + rev.amount, 0);
                setSummaryStats({ totalPending, totalRevenue });

            } catch (error) {
                console.error("Error fetching treasury data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [firestore, userProfile]);
    
    return { combinedData, summaryStats, loading: loading || profileLoading, firestore };
};


const DeclineModal = ({ request, onDecline }: { request: CombinedRequest, onDecline: (reason: string) => Promise<void> }) => {
    const [reason, setReason] = useState('');
    const [isDeclining, setIsDeclining] = useState(false);

    const handleDecline = async () => {
        if (!reason) return;
        setIsDeclining(true);
        await onDecline(reason);
        setIsDeclining(false);
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Decline</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Decline Withdrawal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p>You are about to decline a withdrawal request for <span className="font-bold">${request.amount.toFixed(2)}</span> from user <span className="font-mono text-xs">{request.userId}</span>.</p>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Decline</Label>
                        <Input id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Incorrect bank details" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button variant="ghost">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDecline} disabled={!reason || isDeclining}>
                        {isDeclining ? <Loader2 className="animate-spin" /> : 'Confirm Decline'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function TreasuryPage() {
  const { combinedData, summaryStats, loading, firestore } = useTreasuryData();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleMarkAsPaid = async (request: CombinedRequest) => {
    if (!firestore) return;
    setProcessingId(request.id);

    try {
        const requestRef = doc(firestore, 'withdrawal_requests', request.id);
        const userRef = doc(firestore, 'users', request.userId);
        
        // --- Safety Check ---
        const requestSnap = await getDoc(requestRef);
        if (requestSnap.data()?.status !== 'pending') {
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: `This request is no longer in pending state.`
            });
            setProcessingId(null);
            return;
        }
        const userSnap = await getDoc(userRef);

        const batch = writeBatch(firestore);

        const pendingPayoutsQuery = query(collection(firestore, 'payouts_pending'), where('userId', '==', request.userId));
        const pendingPayoutsSnap = await getDocs(pendingPayoutsQuery);
        
        pendingPayoutsSnap.forEach(payoutDoc => {
            const completedPayoutRef = doc(collection(firestore, 'payouts_completed'));
            batch.set(completedPayoutRef, { ...payoutDoc.data(), paidAt: new Date().toISOString() });
            batch.delete(payoutDoc.ref);
        });

        // Lock bank details on first successful payout
        if (userSnap.exists() && !userSnap.data()?.bankDetails) {
            batch.update(userRef, {
                bankDetails: request.bankDetails
            });
        }

        batch.update(requestRef, {
            status: 'completed',
            paidAt: new Date().toISOString(),
        });

        await batch.commit();

        toast({ title: 'Success', description: `Request for $${request.amount.toFixed(2)} marked as paid.` });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
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
            status: 'declined',
            reason: reason,
        });
        toast({ title: 'Request Declined', description: 'The user has been notified.' });
     } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
     } finally {
         setProcessingId(null);
     }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2">
        <Landmark /> SOMA Treasury
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pending Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${summaryStats.totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{combinedData.length} pending requests</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total SOMA Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">${summaryStats.totalRevenue.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">From 3% seller transaction fees</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Payout Approval Queue</CardTitle>
          <CardDescription>
            Review and process pending withdrawal requests. Actions here are final.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Bank Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedData.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    The withdrawal queue is empty.
                  </TableCell>
                </TableRow>
              ) : (
                combinedData.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.user?.email || 'Unknown User'}</div>
                      <Badge variant="outline" className="mt-1">
                        <ShieldCheck className="h-3 w-3 mr-1"/>
                        {req.user?.planTier || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <span className="text-lg font-bold text-primary">${req.amount.toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm font-medium">{req.bankDetails.accountName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{req.bankDetails.bankName} - {req.bankDetails.accountNumber}</div>
                        {req.bankDetails.iban && <div className="text-xs text-muted-foreground font-mono">IBAN: {req.bankDetails.iban}</div>}
                        {req.bankDetails.swiftBic && <div className="text-xs text-muted-foreground font-mono">SWIFT: {req.bankDetails.swiftBic}</div>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        {processingId === req.id ? <Loader2 className="animate-spin ml-auto" /> : (
                            <>
                                <DeclineModal request={req} onDecline={(reason) => handleDecline(req, reason)} />
                                <Button size="sm" onClick={() => handleMarkAsPaid(req)} disabled={processingId !== null}>
                                    <CheckCircle className="mr-2 h-4 w-4"/> Mark as Paid
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
  );
}
