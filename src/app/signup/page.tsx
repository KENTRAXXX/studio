'use client';

import { Suspense, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { useSignUp } from '@/hooks/use-signup';
import { usePaystack } from '@/hooks/use-paystack';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  referralCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type PlanInterval = 'monthly' | 'yearly' | 'lifetime' | 'free';
type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND';


function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { mutate: signUp, isPending: isSigningUp } = useSignUp();
  const { initializePayment, isInitializing } = usePaystack();
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isPendingTransition, startTransition] = useTransition();

  const planTier = (searchParams.get('planTier') || 'SCALER') as PlanTier;
  const interval = (searchParams.get('interval') as PlanInterval) || 'monthly';
  
  const planName = {
    MERCHANT: 'Merchant',
    SCALER: 'Scaler',
    SELLER: 'Seller',
    ENTERPRISE: 'Enterprise',
    BRAND: 'Brand',
  }[planTier] || 'Scaler';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      referralCode: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    const isFreePlan = planTier === 'SELLER' && interval === 'free';
    
    signUp({ ...data, planTier: planTier, plan: interval }, {
      onSuccess: async (user) => {
        if (!isFreePlan) {
            toast({
              title: 'Account Created',
              description: "Welcome! Let's get you set up.",
            });
        }

        const onPaystackSuccess = async () => {
          // Optimistically update status to improve UX while webhook processes
          if (firestore && user.user.uid) {
              try {
                  const userRef = doc(firestore, 'users', user.user.uid);
                  await updateDoc(userRef, { hasAccess: true });
              } catch (e) {
                  console.error("Optimistic access update failed:", e);
              }
          }

          toast({
            title: isFreePlan ? 'Account Created!' : 'Payment Successful!',
            description: isFreePlan ? "You're all set." : 'Your store is being provisioned. This may take a moment.',
          });
          
          // Unified redirection to the return page for premium loading state
          router.push('/backstage/return');
        };

        const onPaystackClose = () => {
          toast({
            variant: 'default',
            title: 'Payment Incomplete',
            description: 'Your store will not be created until payment is complete. You can restart from your dashboard.',
          });
          router.push('/backstage/return');
        };

        await initializePayment({
            email: data.email,
            payment: {
                type: 'signup',
                planTier,
                interval
            },
            metadata: {
              userId: user.user.uid,
              plan: interval,
              planTier: planTier,
              template: 'gold-standard',
            },
          },
          onPaystackSuccess,
          onPaystackClose
        );

        if (!isFreePlan) {
            setIsSuccess(true);
        }
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: err.message || 'An unknown error occurred.',
        });
      },
    });
  };

  const isPending = isSigningUp || isInitializing;
  const isFreePlan = planTier === 'SELLER' && interval === 'free';
  const buttonText = isFreePlan ? 'Create Free Account' : 'Create Account & Pay';

  return (
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
            {!isSuccess ? (
                 <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <Card className="border-primary/50">
                        <CardHeader>
                            <CardTitle>Sign Up for {planName}</CardTitle>
                            <CardDescription>Enter your details to create an account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                            <Input placeholder="your.email@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="referralCode"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Referral Code (Optional)</FormLabel>
                                            <FormControl>
                                            <Input placeholder="Enter code" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    
                                    <div className="flex items-center space-x-2 pt-4">
                                        <Checkbox 
                                            id="terms" 
                                            checked={agreedToTerms}
                                            onCheckedChange={(checked) => {
                                                startTransition(() => {
                                                    setAgreedToTerms(checked as boolean)
                                                });
                                            }}
                                        />
                                        <label
                                            htmlFor="terms"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                           By signing up, you agree to the SOMA Terms of Service and No-Refund Policy.
                                        </label>
                                    </div>
                                    
                                    <Button type="submit" disabled={isPending || !agreedToTerms} className="w-full h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed">
                                        {isPending ? <Loader2 className="animate-spin" /> : buttonText}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                 <motion.div
                    key="redirecting"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                 >
                    <Card className="border-primary/50">
                        <CardContent className="p-6 text-center">
                            <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4"/>
                            <p className="text-lg font-medium">Redirecting to Paystack...</p>
                            <p className="text-muted-foreground text-sm">Please complete the payment in the popup.</p>
                        </CardContent>
                    </Card>
                 </motion.div>
            )}
        </AnimatePresence>
      </div>
  )
}


export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6">
      <div className="text-center mb-10">
        <SomaLogo className="h-12 w-12 mx-auto" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary">Create Your SOMA Account</h1>
        <p className="mt-2 text-lg text-muted-foreground">Join the future of luxury e-commerce.</p>
      </div>
      <Suspense fallback={<div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
         <SignUpForm />
      </Suspense>
    </div>
  );
}
