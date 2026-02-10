'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    collection, 
    query, 
    where, 
    limit, 
    or, 
    addDoc, 
    serverTimestamp,
    getDocs
} from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage,
    FormDescription 
} from '@/components/ui/form';
import { 
    MessageSquare, 
    Send, 
    Loader2, 
    CheckCircle2, 
    ArrowLeft,
    ShieldCheck,
    Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { sendSupportTicketCustomerEmail } from '@/ai/flows/send-support-ticket-customer-email';
import { sendSupportTicketOwnerEmail } from '@/ai/flows/send-support-ticket-owner-email';

const contactSchema = z.object({
  name: z.string().min(2, 'Please provide your name.'),
  email: z.string().email('A valid email address is required for follow-up.'),
  subject: z.string().min(5, 'Please provide a descriptive subject.'),
  message: z.string().min(20, 'Please provide more details regarding your inquiry.'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function ContactFormContent() {
    const params = useParams();
    const router = useRouter();
    const identifier = params.domain as string;
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isSuccess, setIsSuccess] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [storeName, setStoreName] = useState('Boutique');
    const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
    const [isResolving, setIsResolving] = useState(true);

    useEffect(() => {
        const resolveStore = async () => {
            if (!firestore || !identifier) return;

            try {
                const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
                const normalizedIdentifier = identifier.toLowerCase();
                
                let slug = normalizedIdentifier;
                if (normalizedIdentifier.endsWith(`.${rootDomain}`)) {
                    slug = normalizedIdentifier.replace(`.${rootDomain}`, '');
                }
                if (slug.startsWith('www.')) {
                    slug = slug.replace('www.', '');
                }

                const q = query(
                    collection(firestore, 'stores'),
                    or(
                        where('userId', '==', slug),
                        where('customDomain', '==', normalizedIdentifier),
                        where('slug', '==', slug)
                    ),
                    limit(1)
                );

                const snap = await getDocs(q);
                if (!snap.empty) {
                    const data = snap.docs[0].data();
                    setStoreId(data.userId);
                    setStoreName(data.storeName || 'Boutique');
                    setOwnerEmail(data.contactEmail || null);
                }
            } catch (error) {
                console.error("Failed to resolve boutique:", error);
            } finally {
                setIsResolving(false);
            }
        };

        resolveStore();
    }, [firestore, identifier]);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            email: '',
            subject: '',
            message: '',
        },
    });

    const onSubmit = async (data: ContactFormValues) => {
        if (!firestore || !storeId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Communication link not established.' });
            return;
        }

        try {
            const bundledMessage = `Customer: ${data.name}\nEmail: ${data.email}\n\n${data.message}`;

            const ticketsRef = collection(firestore, 'stores', storeId, 'supportTickets');
            const ticketDoc = await addDoc(ticketsRef, {
                subject: data.subject,
                message: bundledMessage,
                status: 'OPEN',
                storeId: storeId,
                messages: [bundledMessage],
                createdAt: serverTimestamp(),
            });

            const storeUrl = typeof window !== 'undefined' ? window.location.origin : `https://${identifier}`;
            
            await sendSupportTicketCustomerEmail({
                to: data.email,
                customerName: data.name,
                storeName: storeName,
                ticketId: ticketDoc.id,
                storeUrl: storeUrl
            });

            if (ownerEmail) {
                await sendSupportTicketOwnerEmail({
                    to: ownerEmail,
                    customerName: data.name,
                    customerEmail: data.email,
                    subject: data.subject,
                    storeName: storeName
                });
            }

            setIsSuccess(true);
            toast({
                title: 'Message Dispatched',
                description: 'Your strategic inquiry has been recorded.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Transmission Failed',
                description: error.message || 'Could not reach the boutique server.',
            });
        }
    };

    if (isResolving) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors group">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to {storeName}
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold font-headline text-white tracking-tight">Executive Support</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Submit a strategic inquiry directly to the curator of <span className="text-primary font-bold">{storeName}</span>.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {isSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <Card className="border-primary/50 bg-primary/5 p-12">
                                <CardContent className="space-y-6">
                                    <div className="mx-auto bg-primary/10 rounded-full p-6 w-fit border border-primary/20">
                                        <CheckCircle2 className="h-16 w-16 text-primary animate-pulse" />
                                    </div>
                                    <h2 className="text-3xl font-bold font-headline text-primary">Inquiry Secured</h2>
                                    <p className="text-muted-foreground max-md mx-auto">
                                        Your request has been transmitted directly to the boutique ledger. 
                                        You will receive a confirmation email shortly.
                                    </p>
                                    <Button asChild size="lg" className="mt-4 btn-gold-glow" onClick={() => router.push('/')}>
                                        <Link href="/">Return to Boutique</Link>
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
                            <Card className="border-primary/50 overflow-hidden bg-slate-900/20 shadow-2xl">
                                <CardHeader className="bg-muted/30 border-b border-primary/10 p-8">
                                    <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
                                        <MessageSquare className="h-6 w-6" />
                                        Boutique Support Portal
                                    </CardTitle>
                                    <CardDescription>
                                        Your communication is secured by the SOMA platform protocol.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Your Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="John Doe" {...field} className="h-12 bg-primary/5 border-primary/10" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Email Address</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="john@example.com" {...field} className="h-12 bg-primary/5 border-primary/10" />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="subject"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Subject</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g., Private Collection Inquiry" {...field} className="h-12 bg-primary/5 border-primary/10" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="message"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Detailed Request</FormLabel>
                                                        <FormControl>
                                                            <Textarea 
                                                                placeholder="Please provide specific details regarding your inquiry..." 
                                                                className="min-h-[200px] bg-primary/5 border-primary/10 resize-none text-lg p-6" 
                                                                {...field} 
                                                            />
                                                        </FormControl>
                                                        <FormDescription>High specificity ensures a faster resolution from the curator.</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button 
                                                type="submit" 
                                                disabled={form.formState.isSubmitting} 
                                                className="w-full h-16 text-xl btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest"
                                            >
                                                {form.formState.isSubmitting ? (
                                                    <>
                                                        <Loader2 className="animate-spin mr-3 h-6 w-6" />
                                                        Transmitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="mr-3 flex items-center justify-center">
                                                            <Send className="h-6 w-6" />
                                                        </span>
                                                        Transmit to curator
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-primary/10 space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Secure Link</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">Identity Protection</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Your inquiry is encrypted and transmitted via the secure SOMA Executive Gateway.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-primary/10 space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Globe className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Global Support</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">Curator Response</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Our network of elite curators typically responds to strategic inquiries within 24 business hours.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
