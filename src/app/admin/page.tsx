'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Users, 
    MessageSquare, 
    Landmark,
    ShieldAlert,
    Loader2,
    ShieldCheck
} from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminOverviewPage() {
    const firestore = useFirestore();

    const usersQ = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
    const ticketsQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'concierge_tickets'), where('status', '==', 'open')) : null, [firestore]);
    const payoutsQ = useMemoFirebase(() => firestore ? query(collection(firestore, 'withdrawal_requests'), where('status', '==', 'pending')) : null, [firestore]);

    const { data: users, loading: usersLoading } = useCollection(usersQ);
    const { data: tickets, loading: ticketsLoading } = useCollection(ticketsQ);
    const { data: payouts, loading: payoutsLoading } = useCollection(payoutsQ);

    const isLoading = usersLoading || ticketsLoading || payoutsLoading;

    if (isLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center">
                <ShieldAlert className="h-12 w-12 mx-auto text-primary mb-4" />
                <h1 className="text-4xl font-bold font-headline">Platform Command Center</h1>
                <p className="text-muted-foreground mt-2">Executive oversight and systems management.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Network</CardTitle>
                        <Users className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{users?.length || 0}</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Partners & Moguls</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Open Concierge</CardTitle>
                        <MessageSquare className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{tickets?.length || 0}</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Pending Responses</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Payout Queue</CardTitle>
                        <Landmark className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{payouts?.length || 0}</div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Awaiting Treasury</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Concierge Inbox', href: '/admin/concierge', icon: MessageSquare },
                    { label: 'Verification Queue', href: '/admin/verification-queue', icon: ShieldCheck },
                    { label: 'Treasury Manager', href: '/admin/treasury', icon: Landmark },
                    { label: 'Referral Audit', href: '/admin/referrals', icon: ShieldAlert },
                ].map((action) => (
                    <Button key={action.href} asChild variant="outline" className="h-24 flex flex-col gap-2 border-primary/20 hover:bg-primary/10 transition-all group">
                        <Link href={action.href}>
                            <action.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-xs uppercase tracking-widest">{action.label}</span>
                        </Link>
                    </Button>
                ))}
            </div>
        </div>
    );
}