'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';

const onboardingSchema = z.object({
  legalBusinessName: z.string().min(3, 'A business name is required.'),
  warehouseAddress: z.string().min(10, 'A full warehouse address is required.'),
  taxId: z.string().min(5, 'A valid Tax ID or Business Number is required.'),
  contactPhone: z.string().min(10, 'A valid contact phone number is required.'),
  governmentIdUrl: z.string().url({ message: 'A valid ID document URL is required.' }).min(1, 'Please provide a URL to your government ID.'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const SomaShieldTerms = () => (
    <div className="space-y-3 text-sm text-muted-foreground">
        <div className="space-y-1">
            <h4 className="font-semibold text-foreground">1. Authenticity Guarantee</h4>
            <p>The Seller warrants that all items listed are 100% authentic and legally obtained. SOMA maintains a Zero-Tolerance Policy for counterfeits. If a fake is detected, the Seller's account will be banned, and all pending payouts will be frozen for legal review.</p>
        </div>
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground">2. Fulfillment & Shipping</h4>
            <p>Sellers agree to ship orders within 3–5 business days of receiving notification. The Seller is responsible for providing valid tracking information. Failure to ship on time may result in order cancellation and a penalty fee.</p>
        </div>
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground">3. The "No-Circumvention" Rule</h4>
            <p>Sellers must not attempt to contact Moguls or Customers to complete transactions outside of the SOMA platform. Any attempt to bypass the SOMA/Paystack fee structure will result in immediate termination of the partnership.</p>
        </div>
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground">4. Financial Processing & Payouts</h4>
            <p><strong>Centralized Financial Processing</strong>: SOMA serves as the Merchant of Record for all transactions. Customer payments are processed centrally through our secure system. Your earnings (Wholesale Price minus the applicable SOMA commission) are logged to your `payouts_pending` ledger immediately after a sale. <strong>Payout Availability</strong>: To protect against fraud and accommodate customer returns, these pending funds become available for withdrawal only after the order's return window has closed (typically 7 days). <strong>Commission Structure</strong>: SOMA's commission (9% for the free tier, 3% for the Brand tier) is automatically deducted from the wholesale price of each item you sell.</p>
        </div>
         <div className="space-y-1">
            <h4 className="font-semibold text-foreground">5. Return Policy</h4>
            <p>Sellers must define their return policy (e.g., "Returns accepted for 14 days" or "Final Sale"). However, SOMA reserves the right to force a refund if the item is "Not as Described."</p>
        </div>
    </div>
);


const OnboardingSuccess = ({ onAcknowledge }: { onAcknowledge: () => void }) => {
    return (
        <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8"
        >
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold font-headline text-primary">Application Submitted</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                The SOMA Quality Control team will review your warehouse details within 48 hours. You will be notified via email upon approval.
            </p>
            <Button onClick={onAcknowledge} className="mt-8">Go to Finances</Button>
        </motion.div>
    );
};


export default function BackstagePage() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onBlur',
  });
  const { isSubmitting } = form.formState;

  useEffect(() => {
    const isLoading = profileLoading || userLoading;
    if (!isLoading && userProfile) {
        if (userProfile.planTier !== 'SELLER' && userProfile.planTier !== 'BRAND') {
            router.push('/access-denied');
            return;
        }
        if (userProfile.status === 'approved') {
            router.push('/backstage/finances');
            return; // Redirect approved users immediately
        }
        if (userProfile.status === 'pending_review') {
            setIsSuccess(true); // Show success/pending screen
        }
    }
  }, [userProfile, profileLoading, userLoading, router]);

  const handleSubmit = async (data: OnboardingFormValues) => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to services.' });
        return;
    }
    
    try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            verificationData: {
                legalBusinessName: data.legalBusinessName,
                warehouseAddress: data.warehouseAddress,
                taxId: data.taxId,
                contactPhone: data.contactPhone,
                governmentIdUrl: data.governmentIdUrl,
            },
            status: 'pending_review',
            termsAcceptedAt: serverTimestamp(),
        });
        toast({ title: 'Application Submitted!', description: 'We will review your information and get back to you shortly.'});
        setIsSuccess(true);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'An unexpected error occurred.' });
    }
  };

  const isLoading = profileLoading || userLoading;
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // This prevents a flash of the form before redirecting
  if (!userProfile || userProfile.status === 'approved') {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
        <div className="text-center mb-10">
            <SomaLogo className="h-12 w-12 mx-auto" />
            <h1 className="text-4xl font-bold font-headline mt-4 text-primary">SOMA Seller Hub</h1>
            <p className="mt-2 text-lg text-muted-foreground">Supplier Onboarding</p>
        </div>
      
        <Card className="w-full max-w-2xl border-primary/50">
            <AnimatePresence mode="wait">
            {isSuccess ? (
                <OnboardingSuccess onAcknowledge={() => router.push('/backstage/finances')} />
            ) : (
                <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                             <ShieldCheck className="h-6 w-6 text-primary" />
                            Seller Verification
                        </CardTitle>
                        <CardDescription>
                            Please provide your business details for our quality control team.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                <FormField control={form.control} name="legalBusinessName" render={({ field }) => (
                                    <FormItem><FormLabel>Business Legal Name</FormLabel><FormControl><Input placeholder="e.g., Luxe Imports Inc." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="warehouseAddress" render={({ field }) => (
                                    <FormItem><FormLabel>Primary Warehouse Address</FormLabel><FormControl><Input placeholder="123 Supply Chain Ave, Industrial City, Country" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="taxId" render={({ field }) => (
                                        <FormItem><FormLabel>Tax ID / Business Number</FormLabel><FormControl><Input placeholder="Your business registration number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="contactPhone" render={({ field }) => (
                                        <FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input placeholder="+1 (555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="governmentIdUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Government ID URL</FormLabel>
                                        <FormControl><Input placeholder="e.g., https://secure.link/to/my-id.pdf" {...field} /></FormControl>
                                        <FormDescription>A secure link to a PDF or image of your government-issued ID.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                <div className="space-y-4 pt-4">
                                    <h3 className="font-semibold text-primary">SOMA Shield: Seller Terms of Service</h3>
                                    <ScrollArea className="h-48 w-full rounded-md border border-border p-4">
                                        <SomaShieldTerms />
                                    </ScrollArea>
                                    <div className="flex items-start space-x-3 pt-2">
                                        <Checkbox 
                                            id="terms"
                                            checked={agreedToTerms}
                                            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <label
                                                htmlFor="terms"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                               I have read and agree to the SOMA Seller Terms of Service.
                                            </label>
                                        </div>
                                    </div>
                                </div>


                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSubmitting || !agreedToTerms} size="lg" className="h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send className="mr-2 h-5 w-5"/>Submit for Review</>}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </motion.div>
            )}
            </AnimatePresence>
        </Card>
    </div>
  );
}
