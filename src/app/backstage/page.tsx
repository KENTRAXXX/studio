'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AnimatePresence, motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';

const onboardingSchema = z.object({
  legalBusinessName: z.string().min(3, 'A business name is required.'),
  warehouseAddress: z.string().min(10, 'A full warehouse address is required.'),
  taxId: z.string().min(5, 'A valid Tax ID or Business Number is required.'),
  contactPhone: z.string().min(10, 'A valid contact phone number is required.'),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;


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
            <Button onClick={onAcknowledge} className="mt-8">Go to Dashboard</Button>
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

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onBlur',
  });
  const { isSubmitting } = form.formState;

  useEffect(() => {
    const isLoading = profileLoading || userLoading;
    if (!isLoading) {
        if (userProfile?.planTier !== 'SELLER') {
            router.push('/access-denied');
            return;
        }
        if (userProfile?.status === 'pending_review' || userProfile?.status === 'approved') {
            setIsSuccess(true);
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
            ...data,
            status: 'pending_review'
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
  if (userProfile?.planTier !== 'SELLER') {
      return null;
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
                <OnboardingSuccess onAcknowledge={() => router.push('/dashboard')} />
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
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSubmitting} size="lg" className="h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
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
