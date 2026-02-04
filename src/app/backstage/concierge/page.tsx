
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore, useUserProfile } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendConciergeEmail } from '@/ai/flows/send-concierge-email';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MessageSquare, Send, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { motion, AnimatePresence } from 'framer-motion';

const conciergeSchema = z.object({
  subject: z.string().min(5, 'Please provide a descriptive subject.'),
  message: z.string().min(20, 'Message must be at least 20 characters to provide sufficient context.'),
});

type ConciergeFormValues = z.infer<typeof conciergeSchema>;

export default function ConciergePage() {
  const { user } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ConciergeFormValues>({
    resolver: zodResolver(conciergeSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ConciergeFormValues) => {
    if (!user || !firestore || !userProfile) return;

    try {
      const brandName = userProfile.verificationData?.legalBusinessName || 'New Partner';
      const status = userProfile.status || 'Active';

      // 1. Log to Firestore
      await addDoc(collection(firestore, 'support_tickets'), {
        userId: user.uid,
        brandName,
        userStatus: status,
        subject: data.subject,
        message: data.message,
        createdAt: serverTimestamp(),
      });

      // 2. Trigger Admin Notification
      await sendConciergeEmail({
        fromEmail: user.email!,
        brandName,
        userStatus: status,
        subject: data.subject,
        message: data.message,
      });

      setIsSubmitted(true);
      toast({
        title: 'Message Transmitted',
        description: 'Your request has been prioritized for our support team.',
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
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="text-center mb-10">
        <SomaLogo className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary tracking-tight">SOMA Concierge</h1>
        <p className="mt-2 text-lg text-muted-foreground">Direct executive support for elite partners.</p>
      </div>

      <AnimatePresence mode="wait">
        {isSubmitted ? (
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
                  Your message has been delivered to the SOMA executive concierge team. 
                  You will receive a response via email within 24 business hours.
                </p>
                <Button 
                  onClick={() => {
                    setIsSubmitted(false);
                    form.reset();
                  }}
                  variant="outline"
                  className="mt-4 border-primary/20 hover:bg-primary/5"
                >
                  Send Another Message
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="border-primary/50 overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-primary/10">
                    <CardTitle className="flex items-center gap-2 text-primary font-headline">
                      <MessageSquare className="h-5 w-5" />
                      Message Support Team
                    </CardTitle>
                    <CardDescription>
                      Reach out directly for strategic inquiries or complex support needs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 md:p-8">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Strategic Partnership Inquiry" {...field} className="h-12 border-primary/20" />
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
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your request in detail..." 
                                  className="min-h-[200px] resize-none border-primary/20" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>Your brand details and account status are automatically attached.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          disabled={form.formState.isSubmitting} 
                          className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                        >
                          {form.formState.isSubmitting ? (
                            <>
                              <Loader2 className="animate-spin mr-2 h-5 w-5" />
                              Routing to Executive HQ...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-5 w-5" />
                              Transmit Message
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-headline flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" /> Executive Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-4">
                    <p>
                      The SOMA Concierge is a high-priority channel reserved for elite suppliers and partners. 
                    </p>
                    <div className="space-y-2">
                      <p className="font-bold text-slate-300">Operational Hours:</p>
                      <p>Monday – Friday</p>
                      <p>09:00 – 18:00 (GMT+1)</p>
                    </div>
                    <p className="italic">
                      "Excellence is not an act, but a habit. We are here to ensure your brand's habit is success."
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardContent className="p-6 text-center space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Logged Account</p>
                    <p className="font-bold text-sm truncate">{userProfile?.verificationData?.legalBusinessName || 'Partner Account'}</p>
                    <p className="text-xs text-primary font-mono">{userProfile?.email}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
