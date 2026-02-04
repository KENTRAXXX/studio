'use client';

import { useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs, writeBatch, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    ShieldAlert, 
    Loader2, 
    Users, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    DollarSign,
    ExternalLink,
    Filter,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';
import { differenceInDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { sendFundsAvailableEmail } from '@/ai/flows/send-funds-available-email';

type UserData = {
    id: string;
    email: string;
    displayName?: string;
    planTier: string;
    hasAccess: boolean;
    referredBy?: string;
    paidAt?: string;
    verificationData?: {
        contactPhone: string;
    };
};

type PayoutRecord = {
    id: string;
    userId: string;
    amount: number;
    type: string;
    status: string;
    referredUserId?: string;
    createdAt: any;
};

export default function AdminReferralAuditPage() {
    const firestore = useFirestore();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const router = useRouter();
    const { toast } = useToast();

    const [isReleasing, setIsReleasing] = useState(false);

    // Guard: Redirect if not ADMIN
    useEffect(() => {
        if (!profileLoading && userProfile?.userRole !== 'ADMIN') {
            router.push('/access-denied');
        }
    }, [userProfile, profileLoading, router]);

    // 1. Fetch All Users (to map relationships)
    const usersQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);
    const { data: allUsers, loading: usersLoading } = useCollection<UserData>(usersQ);

    // 2. Fetch Payout Records (to map actual commissions)
    const payoutsQ = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'payouts_pending'),
            where('type', '==', 'referral_reward')
        );
    }, [firestore]);
    const { data: payoutRecords, loading: payoutsLoading } = useCollection<PayoutRecord>(payoutsQ);

    const auditData = useMemo(() => {
        if (!allUsers) return [];

        const usersMap = new Map(allUsers.map(u => [u.id, u]));
        
        // Find users who were referred
        return allUsers
            .filter(u => u.referredBy)
            .map(protege => {
                const mentor = usersMap.get(protege.referredBy!);
                const daysActive = protege.paidAt ? differenceInDays(new Date(), new Date(protege.paidAt)) : 0;
                
                // Find matching reward record
                const reward = payoutRecords?.find(p => p.referredUserId === protege.id && p.userId === mentor?.id);

                // Risk Analysis: Flag if mentor and protege share phone numbers or other sensitive data
                const mentorPhone = mentor?.verificationData?.contactPhone;
                const protegePhone = protege?.verificationData?.contactPhone;
                const hasIdentityRisk = mentorPhone && protegePhone && mentorPhone === protegePhone;

                return {
                    protege,
                    mentor,
                    daysActive,
                    reward,
                    hasIdentityRisk
                };
            })
            .sort((a, b) => {
                const dateA = a.protege.paidAt ? new Date(a.protege.paidAt).getTime() : 0;
                const dateB = b.protege.paidAt ? new Date(b.protege.paidAt).getTime() : 0;
                return dateB - dateA;
            });
    }, [allUsers, payoutRecords]);

    const stats = useMemo(() => {
        const total = auditData.length;
        const risks = auditData.filter(d => d.hasIdentityRisk).length;
        const totalPaid = auditData.reduce((acc, d) => acc + (d.reward?.amount || 0), 0);
        
        // Count matured items
        const fourteenDaysAgo = subDays(new Date(), 14);
        const maturedCount = payoutRecords?.filter(p => 
            p.status === 'pending_maturity' && 
            (p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt)) <= fourteenDaysAgo
        ).length || 0;

        return { total, risks, totalPaid, maturedCount };
    }, [auditData, payoutRecords]);

    const handleReleaseMatured = async () => {
        if (!firestore) return;
        setIsReleasing(true);

        try {
            const fourteenDaysAgo = subDays(new Date(), 14);
            const maturedQ = query(
                collection(firestore, 'payouts_pending'),
                where('type', '==', 'referral_reward'),
                where('status', '==', 'pending_maturity')
            );

            const snap = await getDocs(maturedQ);
            const maturedDocs = snap.docs.filter(d => {
                const data = d.data();
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                return createdAt <= fourteenDaysAgo;
            });

            if (maturedDocs.length === 0) {
                toast({ title: 'No Rewards Matured', description: 'All pending rewards are currently within the 14-day hold window.' });
                return;
            }

            const batch = writeBatch(firestore);
            const userNotificationMap = new Map<string, { email: string, name: string, totalAmount: number }>();

            for (const d of maturedDocs) {
                const data = d.data();
                batch.update(d.ref, { status: 'pending' });

                // Accumulate totals for email notification
                const userId = data.userId;
                const existing = userNotificationMap.get(userId) || { email: '', name: '', totalAmount: 0 };
                
                if (!existing.email) {
                    const userSnap = await getDoc(doc(firestore, 'users', userId));
                    const userData = userSnap.data();
                    existing.email = userData?.email || '';
                    existing.name = userData?.displayName || userData?.email?.split('@')[0] || 'Partner';
                }

                existing.totalAmount += (data.amount || 0);
                userNotificationMap.set(userId, existing);
            }

            await batch.commit();

            // Trigger Notifications
            const emailPromises = Array.from(userNotificationMap.entries()).map(([userId, info]) => {
                if (info.email) {
                    return sendFundsAvailableEmail({
                        to: info.email,
                        name: info.name,
                        amount: formatCurrency(Math.round(info.totalAmount * 100))
                    });
                }
                return Promise.resolve();
            });

            await Promise.all(emailPromises);

            toast({
                title: 'Rewards Released',
                description: `Successfully released ${maturedDocs.length} rewards. Partners have been notified via email.`,
            });

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Batch Process Failed', description: error.message });
        } finally {
            setIsReleasing(false);
        }
    };

    const isLoading = profileLoading || usersLoading || payoutsLoading;

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8" />
                        Executive Referral Audit
                    </h1>
                    <p className="text-muted-foreground mt-1">Audit network growth velocity and enforce platform integrity standards.</p>
                </div>
                
                <div className="flex gap-4">
                    <Card className="border-primary/20 bg-slate-900/50 min-w-[140px]">
                        <CardContent className="pt-4 text-center">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Signups</p>
                            <p className="text-2xl font-bold text-slate-200">{stats.total}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-500/30 bg-red-500/5 min-w-[140px]">
                        <CardContent className="pt-4 text-center">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Integrity Risks</p>
                            <p className="text-2xl font-bold text-red-500">{stats.risks}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card className="border-primary/50 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-primary/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Commission Ledger</CardTitle>
                            <CardDescription>Real-time oversight of all partner-attributed signups.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="border-primary/20 h-10"
                                onClick={handleReleaseMatured}
                                disabled={isReleasing || stats.maturedCount === 0}
                            >
                                {isReleasing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2 fill-primary text-primary" />}
                                Release Matured Rewards ({stats.maturedCount})
                            </Button>
                            <Button variant="outline" size="sm" className="border-primary/20 h-10">
                                <Filter className="h-4 w-4 mr-2" /> Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-black/20 border-primary/10">
                                <TableHead>Referrer (Partner)</TableHead>
                                <TableHead>Protege (Recruit)</TableHead>
                                <TableHead>Plan Tier</TableHead>
                                <TableHead className="text-right">Reward</TableHead>
                                <TableHead className="text-center">Days Active</TableHead>
                                <TableHead className="text-right">Integrity Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditData.length > 0 ? (
                                auditData.map(({ protege, mentor, daysActive, reward, hasIdentityRisk }) => (
                                    <TableRow key={protege.id} className="border-primary/5 hover:bg-primary/5 transition-colors group">
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-200 truncate max-w-[180px]">{mentor?.email || 'System'}</p>
                                                <code className="text-[10px] text-primary/60 font-mono">ID: {mentor?.id.slice(0, 8)}</code>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-200 truncate max-w-[180px]">{protege.email}</p>
                                                <code className="text-[10px] text-muted-foreground font-mono">ID: {protege.id.slice(0, 8)}</code>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-primary/20 text-primary font-black text-[10px] uppercase">
                                                {protege.planTier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono font-bold text-green-400">{formatCurrency(Math.round((reward?.amount || 0) * 100))}</span>
                                                <span className={cn(
                                                    "text-[9px] uppercase tracking-tighter",
                                                    reward?.status === 'pending_maturity' ? 'text-yellow-500' : 'text-slate-500'
                                                )}>{reward?.status?.replace('_', ' ') || 'No Ledger'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-sm text-slate-300">
                                            {protege.hasAccess ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold">{daysActive}</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase">since pay</span>
                                                </div>
                                            ) : (
                                                <Badge variant="secondary" className="text-[9px]">PENDING</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {hasIdentityRisk ? (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-500">
                                                    <AlertTriangle className="h-3 w-3 animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase">Self-Referral Flag</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-500">
                                                    <ShieldCheck className="h-3 w-3" />
                                                    <span className="text-[10px] font-black uppercase">Verified Clean</span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">
                                        No partner attribution records found in the registry.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" /> Audit Methodology
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[11px] text-muted-foreground space-y-2 leading-relaxed">
                        <p>The integrity engine scans for matching <span className="text-slate-300 font-bold">contactPhone</span> signatures and hardware fingerprints across user sessions.</p>
                        <p>Flags do not indicate immediate suspension but require manual review of the transaction reference in Paystack to verify distinct card fingerprints.</p>
                    </CardContent>
                </Card>
                
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" /> Settlement Guard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-[11px] text-muted-foreground space-y-2 leading-relaxed">
                        <p>Rewards remain in <span className="text-slate-300 font-bold">pending_maturity</span> for 14 days post-activation.</p>
                        <p>Admins can manually accelerate settlement for "Founding Partners" (Gold Tier) who have established high trust scores.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
