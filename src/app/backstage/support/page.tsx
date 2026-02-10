
'use client';

import { useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    MessageSquare, 
    Send, 
    Loader2, 
    Clock, 
    CheckCircle2, 
    User, 
    History,
    Search,
    Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type SupportTicket = {
    id: string;
    subject: string;
    message: string;
    status: 'OPEN' | 'RESOLVED';
    messages: string[];
    createdAt: any;
    customerId?: string;
};

export default function BackstageSupportPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const ticketsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'stores', user.uid, 'supportTickets'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: tickets, isLoading } = useCollection<SupportTicket>(ticketsQuery);

    const filteredTickets = useMemo(() => {
        if (!tickets) return [];
        return tickets.filter(t => 
            t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.message.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tickets, searchTerm]);

    const handleSendReply = async () => {
        if (!firestore || !user || !selectedTicket || !replyText.trim()) return;

        setIsSubmitting(true);
        try {
            const ticketRef = doc(firestore, 'stores', user.uid, 'supportTickets', selectedTicket.id);
            const responseMessage = `[Curator]: ${replyText.trim()}`;
            
            await updateDoc(ticketRef, {
                messages: arrayUnion(responseMessage),
                status: 'OPEN' // Re-open if it was resolved
            });

            setReplyText('');
            toast({ title: 'Reply Transmitted', description: 'Your message has been added to the client thread.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Transmission Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async () => {
        if (!firestore || !user || !selectedTicket) return;

        try {
            const ticketRef = doc(firestore, 'stores', user.uid, 'supportTickets', selectedTicket.id);
            await updateDoc(ticketRef, { status: 'RESOLVED' });
            toast({ title: 'Ticket Resolved', description: 'Inquiry closed in the boutique ledger.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-96 w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-12 px-4">
            <div className="text-center">
                <SomaLogo className="h-12 w-12 mx-auto text-primary" />
                <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Executive Support Portal</h1>
                <p className="mt-2 text-lg text-muted-foreground">Manage persistent client inquiries and boutique requests.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Inbox Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-primary/20 bg-slate-900/30 overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-primary/10 space-y-4">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-headline uppercase tracking-widest text-slate-200">Boutique Inbox</CardTitle>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                <Input 
                                    placeholder="Filter inquiries..." 
                                    className="h-9 text-xs pl-9 border-primary/10 bg-black/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                            {filteredTickets.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground italic text-sm">No strategic inquiries found.</div>
                            ) : (
                                <div className="divide-y divide-primary/5">
                                    {filteredTickets.map((ticket) => (
                                        <button
                                            key={ticket.id}
                                            onClick={() => setSelectedTicket(ticket)}
                                            className={cn(
                                                "w-full text-left p-5 hover:bg-primary/5 transition-all group flex items-start justify-between gap-4",
                                                selectedTicket?.id === ticket.id && "bg-primary/10 border-l-4 border-primary"
                                            )}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={cn(
                                                        "h-2 w-2 rounded-full",
                                                        ticket.status === 'OPEN' ? "bg-green-500 animate-pulse" : "bg-slate-600"
                                                    )} />
                                                    <p className="text-sm font-bold text-slate-200 truncate">{ticket.subject}</p>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-1 opacity-70">{ticket.message}</p>
                                                <p className="text-[10px] text-slate-600 mt-3 uppercase tracking-tighter flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {ticket.createdAt ? format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), 'MMM d, h:mm a') : 'Pending'}
                                                </p>
                                            </div>
                                            {ticket.status === 'RESOLVED' && <CheckCircle2 className="h-4 w-4 text-green-500/50 shrink-0 mt-1" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Active Workspace */}
                <div className="lg:col-span-8">
                    {selectedTicket ? (
                        <Card className="border-primary/50 overflow-hidden min-h-[600px] flex flex-col">
                            <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl font-headline text-primary">{selectedTicket.subject}</CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] uppercase",
                                            selectedTicket.status === 'OPEN' ? "border-green-500 text-green-500" : "text-slate-500"
                                        )}>
                                            {selectedTicket.status}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-mono">ID: {selectedTicket.id.slice(0, 8)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 border-primary/30 text-primary"
                                        onClick={handleResolve}
                                        disabled={selectedTicket.status === 'RESOLVED'}
                                    >
                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Resolved
                                    </Button>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="flex-1 p-0 flex flex-col">
                                <ScrollArea className="flex-1 p-8 h-[400px]">
                                    <div className="space-y-6">
                                        {/* Original Message */}
                                        <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl max-w-[85%]">
                                            <p className="text-[10px] font-black uppercase text-primary/60 mb-2 tracking-widest">Initial Client Inquiry</p>
                                            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                                        </div>

                                        {/* Thread History */}
                                        {selectedTicket.messages?.map((msg, idx) => {
                                            const isCurator = msg.startsWith('[Curator]:');
                                            const displayMsg = isCurator ? msg.replace('[Curator]:', '') : msg;
                                            
                                            return (
                                                <div key={idx} className={cn(
                                                    "flex flex-col space-y-1",
                                                    isCurator ? "items-end" : "items-start"
                                                )}>
                                                    <div className={cn(
                                                        "p-4 rounded-2xl max-w-[85%] border",
                                                        isCurator 
                                                            ? "bg-slate-800 border-white/5 text-slate-200" 
                                                            : "bg-primary/5 border-primary/10 text-slate-200"
                                                    )}>
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayMsg}</p>
                                                    </div>
                                                    <span className="text-[9px] text-slate-600 uppercase font-bold px-2 tracking-tighter">
                                                        {isCurator ? 'Boutique Response' : 'Client Message'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>

                                <div className="p-6 bg-muted/20 border-t border-primary/10">
                                    <div className="flex gap-3">
                                        <Input 
                                            placeholder="Compose strategic response..." 
                                            className="h-12 bg-slate-950 border-primary/20 flex-1"
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                        />
                                        <Button 
                                            className="h-12 w-12 btn-gold-glow bg-primary p-0 flex items-center justify-center shrink-0"
                                            onClick={handleSendReply}
                                            disabled={isSubmitting || !replyText.trim()}
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-[600px] flex flex-col items-center justify-center text-center border-2 border-dashed border-primary/10 rounded-2xl bg-slate-900/10">
                            <div className="bg-primary/5 p-10 rounded-full mb-6">
                                <MessageSquare className="h-20 w-20 text-primary/20" />
                            </div>
                            <h3 className="text-2xl font-bold font-headline text-slate-400 uppercase tracking-tighter">Command Center</h3>
                            <p className="text-slate-500 max-w-sm mt-2">Select an inquiry from the inbox to begin client orchestration.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
