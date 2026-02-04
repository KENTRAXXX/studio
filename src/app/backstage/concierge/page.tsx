
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useUserProfile, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { sendConciergeEmail } from '@/ai/flows/send-concierge-email';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    MessageSquare, 
    Send, 
    Loader2, 
    Sparkles, 
    ShieldCheck, 
    History, 
    Clock, 
    CheckCircle2, 
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const conciergeSchema = z.object({
  subject: z.string().min(5, 'Please provide a descriptive subject.'),
  priority: z.enum(['standard', 'urgent']),
  message: z.string().min(20, 'Message must be at least 20 characters to provide sufficient context.'),
});

type ConciergeFormValues = z.infer<typeof conciergeSchema>;

type Ticket = {
    id: string;
    subject: string;
    message: string;
    status: 'open' | 'resolved';
    priority: 'standard' | 'urgent';
    createdAt: any;
};

export default function ConciergePage() {
  const { user } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [view, setView] = useState<'form' | 'success'>('form');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Fetch Conversation History
  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'concierge_tickets'),
        where('brandId', '==', user.uid),
        orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: tickets, loading: ticketsLoading } = useCollection<Ticket>(ticketsQuery);

  const form = useForm<ConciergeFormValues>({
    resolver: zodResolver(conciergeSchema),
    defaultValues: {
      subject: '',
      priority: 'standard',
      message: '',
    },
  });

  const onSubmit = async (data: ConciergeFormValues) => {
    if (!user || !firestore || !userProfile) return;

    try {
      const brandName = userProfile.verificationData?.legalBusinessName || 'New Partner';

      // 1. Log to Firestore
      const docRef = await addDoc(collection(firestore, 'concierge_tickets'), {
        brandId: user.uid,
        brandName,
        subject: data.subject,
        message: data.message,
        priority: data.priority,
        status: 'open',
        createdAt: serverTimestamp(),
      });

      // 2. Trigger Admin Notification (Founder Email)
      await sendConciergeEmail({
        fromEmail: user.email!,
        brandName,
        subject: data.subject,
        message: data.message,
        priority: data.priority,
        ticketId: docRef.id,
      });

      setView('success');
      toast({
        title: 'Mission Dispatched',
        description: 'Your request is being routed to the SOMA executive team.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Transmission Error',
        description: error.message || 'Could not reach SOMA HQ. Please try again.',
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-12">
      <div className="text-center">
        <SomaLogo className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary tracking-tight">Executive Concierge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Direct-to-founder strategic support for elite partners.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Conversation History */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="border-primary/20 bg-slate-900/30 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-headline uppercase tracking-widest">Conversations</CardTitle>
                    </div>
                    {view === 'success' && (
                        <Button variant="ghost" size="sm" onClick={() => setView('form')} className="h-7 text-[10px] uppercase font-bold text-primary">
                            New Ticket
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                    {ticketsLoading ? (
                        <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></div>
                    ) : !tickets || tickets.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground italic text-sm">No historical conversations.</div>
                    ) : (
                        <div className="divide-y divide-primary/5">
                            {tickets.map((ticket) => (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={cn(
                                        "w-full text-left p-4 hover:bg-primary/5 transition-all group flex items-start justify-between gap-3",
                                        selectedTicket?.id === ticket.id && "bg-primary/10 border-l-4 border-primary"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "h-1.5 w-1.5 rounded-full",
                                                ticket.status === 'open' ? "bg-green-500 animate-pulse" : "bg-slate-500"
                                            )} />
                                            <p className="text-xs font-bold text-slate-200 truncate">{ticket.subject}</p>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground truncate opacity-60">{ticket.message}</p>
                                        <p className="text-[9px] text-slate-500 mt-2 uppercase tracking-tight">
                                            {ticket.createdAt ? format(ticket.createdAt.toDate ? ticket.createdAt.toDate() : new Date(ticket.createdAt), 'MMM d, h:mm a') : 'Pending...'}
                                        </p>
                                    </div>
                                    {ticket.priority === 'urgent' && <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-[10px] font-headline uppercase tracking-widest flex items-center gap-2 text-primary">
                        <Sparkles className="h-3 w-3" /> SOMA Service SLA
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-[11px] text-muted-foreground space-y-3 leading-relaxed">
                    <p>Executive requests are prioritized by the founder's office.</p>
                    <div className="space-y-1">
                        <p><span className="text-slate-300 font-bold">Standard:</span> 24 Business Hours</p>
                        <p><span className="text-red-400 font-bold">Urgent:</span> < 4 Business Hours</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right: Active View */}
        <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
                {selectedTicket ? (
                    <motion.div 
                        key="viewer" 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card className="border-primary/50 overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-primary/10 flex flex-row items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-2xl font-headline text-primary">{selectedTicket.subject}</CardTitle>
                                        <Badge variant="outline" className={cn(
                                            "uppercase text-[10px]",
                                            selectedTicket.status === 'open' ? "border-green-500 text-green-500 bg-green-500/5" : "border-slate-500 text-slate-500"
                                        )}>
                                            {selectedTicket.status}
                                        </Badge>
                                    </div>
                                    <CardDescription className="mt-1">
                                        Sent on {format(selectedTicket.createdAt.toDate ? selectedTicket.createdAt.toDate() : new Date(selectedTicket.createdAt), 'PPPP p')}
                                    </CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedTicket(null)}>
                                    <History className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Original Request</Label>
                                    <div className="p-6 rounded-xl bg-slate-900/50 border border-primary/10 text-lg leading-relaxed text-slate-200 whitespace-pre-wrap">
                                        {selectedTicket.message}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20 italic text-sm text-slate-400">
                                    <Clock className="h-5 w-5 text-primary shrink-0" />
                                    <p>Our founder is reviewing this request. You will receive a response via email and here in the concierge portal once resolved.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : view === 'success' ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <Card className="border-primary/50 bg-primary/5 p-12">
                            <CardContent className="space-y-6">
                                <div className="mx-auto bg-primary/10 rounded-full p-6 w-fit border border-primary/20">
                                    <ShieldCheck className="h-16 w-16 text-primary animate-pulse" />
                                </div>
                                <h2 className="text-3xl font-bold font-headline text-primary">Message Secured</h2>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Your executive request has been transmitted directly to SOMA HQ. 
                                    Our founder or a senior account manager will respond shortly.
                                </p>
                                <Button 
                                    onClick={() => {
                                        setView('form');
                                        form.reset();
                                    }}
                                    className="mt-4 btn-gold-glow"
                                >
                                    Transmit Another Request
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="form" 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-primary/50 overflow-hidden">
                            <CardHeader className="bg-muted/30 border-b border-primary/10">
                                <CardTitle className="flex items-center gap-2 text-primary font-headline">
                                    <MessageSquare className="h-5 w-5" />
                                    New Executive Request
                                </CardTitle>
                                <CardDescription>
                                    Submit strategic inquiries or high-priority operational needs.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2">
                                                <FormField
                                                    control={form.control}
                                                    name="subject"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Subject</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g., Global Supply Line Inquiry" {...field} className="h-12 border-primary/20" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="priority"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Routing Priority</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-12 border-primary/20">
                                                                    <SelectValue placeholder="Select Priority" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="standard">Standard Support</SelectItem>
                                                                <SelectItem value="urgent">Urgent Escalation</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Detailed Request</FormLabel>
                                                    <FormControl>
                                                        <Textarea 
                                                            placeholder="Please detail your request. High specificity ensures faster resolution." 
                                                            className="min-h-[250px] resize-none border-primary/20 text-lg p-6" 
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Your account credentials and brand metadata are automatically attached.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button 
                                            type="submit" 
                                            disabled={form.formState.isSubmitting} 
                                            className="w-full h-16 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                        >
                                            {form.formState.isSubmitting ? (
                                                <>
                                                    <Loader2 className="animate-spin mr-3 h-6 w-6" />
                                                    Transmitting to Executive HQ...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-3 h-6 w-6" />
                                                    Dispatched to Founder
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Minimal Badge Component since it was missing in some imports
function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'outline', className?: string }) {
    return (
        <div className={cn(
            "px-2 py-0.5 rounded-full font-bold",
            variant === 'default' ? "bg-primary text-primary-foreground" : "border",
            className
        )}>
            {children}
        </div>
    );
}
