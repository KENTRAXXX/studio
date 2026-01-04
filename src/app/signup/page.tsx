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

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

const plans: { [key: string]: { id: string; name: string; amount: number; planType: 'monthly' | 'lifetime' | 'free' } } = {
    MERCHANT: { id: 'MERCHANT', name: 'Merchant', amount: 1999, planType: 'monthly' },
    MOGUL: { id: 'MOGUL', name: 'Mogul', amount: 50000, planType: 'lifetime' },
    SCALER: { id: 'SCALER', name: 'Scaler', amount: 2900, planType: 'monthly' },
    SELLER: { id: 'SELLER', name: 'Seller', amount: 0, planType: 'free' },
    ENTERPRISE: { id: 'ENTERPRISE', name: 'Enterprise', amount: 3333, planType: 'monthly' },
};

function LegalCompliance() {
  return (
    <div className="mt-6 space-y-6 text-sm text-muted-foreground">
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Terms of Service</h3>
            <div className="space-y-2">
                <h4 className="font-semibold text-foreground/80">1. License to Use</h4>
                <p>Upon successful payment of the setup fee, you are granted a non-exclusive, non-transferable, revocable license to use the SOMA store engine for the purpose of creating and operating a single online storefront. This license is contingent upon your adherence to these terms.</p>
            </div>
            <div className="space-y-2">
                <h4 className="font-semibold text-foreground/80">2. Prohibited Content</h4>
                <p>You may not sell, offer, or display any illegal, counterfeit, or fraudulent goods. This includes, but is not limited to, items that infringe on third-party intellectual property rights. We reserve the right to suspend or terminate any store found in violation of this policy without notice.</p>
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">No-Refund Policy</h3>
            <div className="rounded-lg border-2 border-primary bg-primary/10 p-4">
                <p className="font-semibold text-foreground">Due to the digital nature of the SOMA platform and the immediate delivery of the Master Catalog assets, all setup fees (including monthly and lifetime plans) are strictly non-refundable once the Store Cloning process has been initiated.</p>
            </div>
        </div>

        <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Privacy & Data</h3>
            <p>We take your security seriously. All payments are processed securely via Paystack, a PCI-compliant payment gateway. SOMA does not store your full credit card details on our servers.</p>
        </div>
    </div>
  )
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { mutate: signUp, isPending: isSigningUp } = useSignUp();
  const { initializePayment, isInitializing } = usePaystack();
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTransitioning, startTransition] = useTransition();

  const planTier = searchParams.get('planTier') || 'MOGUL';
  const selectedPlan = plans[planTier] || plans.MOGUL;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
  });

  const onSubmit = (data: FormValues) => {
    signUp({ ...data, planTier: selectedPlan.id, plan: selectedPlan.planType }, {
      onSuccess: async (user) => {
        toast({
          title: 'Account Created',
          description: "Welcome! Let's get you set up.",
        });

        // If the plan has a payment amount, proceed to Paystack
        if (selectedPlan.amount > 0) {
            const onPaystackSuccess = () => {
              console.log('Paystack success callback triggered.');
              toast({
                title: 'Payment Successful!',
                description: 'Your store is being provisioned. This may take a moment.',
              });
              // Redirect to the appropriate dashboard based on plan
              const redirectPath = planTier === 'SELLER' ? '/backstage' : '/dashboard/my-store';
              router.push(redirectPath);
            };

            const onPaystackClose = () => {
              console.log('Paystack popup closed.');
              toast({
                variant: 'default',
                title: 'Payment Incomplete',
                description: 'Your store will not be created until payment is complete. You can restart from your dashboard.',
              });
              const redirectPath = planTier === 'SELLER' ? '/backstage' : '/dashboard';
              router.push(redirectPath);
            };

            await initializePayment({
                email: data.email,
                amount: selectedPlan.amount,
                metadata: {
                  userId: user.user.uid,
                  plan: selectedPlan.planType,
                  planTier: selectedPlan.id,
                  template: 'gold-standard', // Default template
                },
              },
              onPaystackSuccess,
              onPaystackClose
            );
            setIsSuccess(true);
        } else {
            // For free plans (e.g., Seller)
            toast({
                title: 'Account Created!',
                description: "You're all set. Let's get you onboarded."
            });
            const redirectPath = planTier === 'SELLER' ? '/backstage' : '/dashboard';
            router.push(redirectPath);
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
  const buttonText = selectedPlan.amount > 0 ? 'Create Account & Pay' : 'Create Free Account';

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
                            <CardTitle>Sign Up for {selectedPlan.name}</CardTitle>
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
                                    
                                    <LegalCompliance />
                                    
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
                                           I acknowledge that I have read and agree to the SOMA Terms of Service and No-Refund Policy.
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
      <Suspense fallback={<div>Loading...</div>}>
         <SignUpForm />
      </Suspense>
    </div>
  );
}
