
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    collection, 
    query, 
    orderBy, 
    doc, 
    updateDoc, 
    serverTimestamp,
    getDoc 
} from 'firebase/firestore';
import { useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
    MessageSquare, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    Send, 
    Loader2, 
    UserCheck,
    History,
    Search,
    Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sendConciergeResponseEmail } from '@/ai/flows/send-concierge-response-email';

type ConciergeTicket = {
    id: string;
    brandId: string;
    brandName: string;
    subject: string;
    message: string;
    status: 'open' | 'resolved';
    priority: 'standard' | 'urgent';
    createdAt: any;
    response?: string;
    respondedAt?: any;
};

export default function AdminConciergeInbox() {
    const firestore = useFirestore();
    const { userProfile, loading: profileLoading } = useUserProfile();
    const { toast } = useToast();
    const router = useRouter();

    const [selectedTicket, setSelectedTicket] = useState<ConciergeTicket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Auth Guard
    useEffect(() => {
        if (!profileLoading) {
            if (!userProfile || userProfile.userRole !== 'ADMIN') {
                router.push('/access-denied');
            }
        }
    }, [userProfile, profileLoading, router]);

    // Fetch All Tickets
    const ticketsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'concierge_tickets'),
            orderBy('status', 'asc'), // Show 'open' first
            orderBy('priority', 'desc'), // Show 'urgent' next
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: tickets, loading: ticketsLoading } = useCollection<ConciergeTicket>(ticketsQuery);

    const handleSendReply = async () => {
        if (!firestore || !selectedTicket || !replyText.trim()) return;

        setIsSubmitting(true);
        try {
            // 1. Get Brand User Data for Email
            const brandUserRef = doc(firestore, 'users', selectedTicket.brandId);
            const brandUserSnap = await getDoc(brandUserRef);
            const brandEmail = brandUserSnap.data()?.email;

            if (!brandEmail) throw new Error("Could not find brand contact email.");

            // 2. Update Firestore
            const ticketRef = doc(firestore, 'concierge_tickets', selectedTicket.id);
            await updateDoc(ticketRef, {
                response: replyText.trim(),
                respondedAt: serverTimestamp(),
                status: 'resolved'
            });

            // 3. Dispatch Notification Email
            await sendConciergeResponseEmail({
                to: brandEmail,
                subject: selectedTicket.subject,
                originalMessage: selectedTicket.message,
                responseMessage: replyText.trim(),
                ticketId: selectedTicket.id
            });

            toast({
                title: 'Response Delivered',
                description: `Reply sent to ${selectedTicket.brandName}. Ticket marked as resolved.`,
            });

            setReplyText('');
            setSelectedTicket(null);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Operation Failed',
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveBrand = async (brandId: string) => {
        if (!firestore) return;
        setIsUpdatingStatus(true);
        try {
            const userRef = doc(firestore, 'users', brandId);
            await updateDoc(userRef, {
                status: 'approved'
            });
            toast({ title: 'Brand Verified', description: 'The partner has been granted full catalog access.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Status Update Failed', description: error.message });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    if (profileLoading || ticketsLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
                        <MessageSquare className="h-8 w-8" />
                        Concierge Command Center
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage executive communications and elite partner requests.</p>
                </div>
                <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border border-primary/10">
                    <div className="text-center px-4 border-r border-primary/10">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Open</p>
                        <p className="text-xl font-mono font-bold text-primary">{tickets?.filter(t => t.status === 'open').length || 0}</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Urgent</p>
                        <p className="text-xl font-mono font-bold text-red-500">{tickets?.filter(t => t.priority === 'urgent' && t.status === 'open').length || 0}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Ticket Inbox */}
                <div className="lg:col-span-5 space-y-4">
                    <Card className="border-primary/20 bg-slate-900/30 overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between py-3">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-headline uppercase tracking-widest text-slate-200">Request Queue</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[700px] overflow-y-auto">
                            {!tickets || tickets.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground italic">No tickets in the queue.</div>
                            ) : (
                                <div className="divide-y divide-primary/5">
                                    {tickets.map((ticket) => (
                                        <button
                                            key={ticket.id}
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setReplyText(ticket.response || '');
                                            }}
                                            className={cn(
                                                "w-full text-left p-5 hover:bg-primary/5 transition-all group flex items-start justify-between gap-4",
                                                selectedTicket?.id === ticket.id && "bg-primary/10 border-l-4 border-primary"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        ticket.status === 'open' ? "bg-green-500 animate-pulse" : "bg-slate-600"
                                                    )} />
                                                    <p className="text-sm font-bold text-slate-200 truncate">{ticket.brandName}</p>
                                                </div>
                                                <p className="text-xs font-semibold text-primary/80 truncate mb-2">{ticket.subject}</p>
                                                <p className="text-[11px] text-slate-500 line-clamp-1 opacity-70 mb-3">{ticket.message}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-600 uppercase font-bold tracking-tighter flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {ticket.createdAt ? format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), 'MMM d, h:mm a') : 'Pending'}
                                                    </span>
                                                    {ticket.priority === 'urgent' && (
                                                        <Badge variant="destructive" className="h-4 px-1.5 text-[9px] uppercase font-black">Urgent</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {ticket.status === 'resolved' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-1 opacity-50" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Active Workspace */}
                <div className="lg:col-span-7">
                    {selectedTicket ? (
                        <Card className="border-primary/50 overflow-hidden sticky top-24">
                            <CardHeader className="bg-muted/30 border-b border-primary/10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-2xl font-headline text-primary">{selectedTicket.subject}</CardTitle>
                                        <CardDescription className="mt-1">
                                            Partner: <span className="font-bold text-foreground">{selectedTicket.brandName}</span>
                                            <span className="mx-2">•</span>
                                            ID: <code className="text-xs">{selectedTicket.brandId.slice(0,8)}</code>
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="border-primary/30 h-8"
                                            onClick={() => handleApproveBrand(selectedTicket.brandId)}
                                            disabled={isUpdatingStatus}
                                        >
                                            {isUpdatingStatus ? <Loader2 className="animate-spin h-3 w-3" /> : <UserCheck className="h-3 w-3 mr-1" />}
                                            Verify Brand
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-primary/60 tracking-widest">Inquiry Details</Label>
                                        <div className="p-6 rounded-xl bg-slate-900/50 border border-primary/10 text-lg leading-relaxed text-slate-200">
                                            {selectedTicket.message}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] uppercase font-black text-primary/60 tracking-widest">Administrative Response</Label>
                                            <span className="text-[10px] text-muted-foreground italic">Email will be sent to partner upon resolution</span>
                                        </div>
                                        <Textarea 
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Compose official response to the brand partner..."
                                            className="min-h-[200px] bg-slate-950 border-primary/20 text-lg p-6 focus-visible:ring-primary"
                                            disabled={selectedTicket.status === 'resolved' && !replyText}
                                        />
                                        
                                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                            <Button 
                                                className="flex-1 h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                                onClick={handleSendReply}
                                                disabled={isSubmitting || !replyText.trim()}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="animate-spin mr-3 h-5 w-5" />
                                                        Transmitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="mr-3 h-5 w-5" />
                                                        Send Reply & Resolve
                                                    </>
                                                )}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                className="h-14 border border-slate-800 text-slate-500 hover:text-slate-300"
                                                onClick={() => setSelectedTicket(null)}
                                            >
                                                Close Workspace
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center text-center border-2 border-dashed border-primary/10 rounded-2xl bg-slate-900/10">
                            <div className="bg-primary/5 p-10 rounded-full mb-6">
                                <MessageSquare className="h-20 w-20 text-primary/20" />
                            </div>
                            <h3 className="text-2xl font-bold font-headline text-slate-400">Command Workspace</h3>
                            <p className="text-slate-500 max-w-sm mt-2">Select a ticket from the inbox to begin executive review and response.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
