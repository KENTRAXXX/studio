
'use client';

import { Suspense, useTransition, useEffect } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { useSignUp } from '@/hooks/use-signup';
import { usePaystack } from '@/hooks/use-paystack';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  referralCode: z.string().optional(),
  adminCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type PlanInterval = 'monthly' | 'yearly' | 'lifetime' | 'free';
type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND' | 'ADMIN';


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
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);

  const planTier = (searchParams.get('planTier') || 'SCALER') as PlanTier;
  const interval = (searchParams.get('interval') as PlanInterval) || 'monthly';
  const refParam = searchParams.get('ref');
  
  const planName = {
    MERCHANT: 'Merchant',
    SCALER: 'Scaler',
    SELLER: 'Seller',
    ENTERPRISE: 'Enterprise',
    BRAND: 'Brand',
    ADMIN: 'Administrator',
  }[planTier] || 'Scaler';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      referralCode: '',
      adminCode: '',
    },
  });

  // Handle URL-based Referral Attribution
  useEffect(() => {
    if (refParam) {
      form.setValue('referralCode', refParam.toUpperCase());
    }
  }, [refParam, form]);

  const onSubmit = (data: FormValues) => {
    const isFreePlan = (planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN';
    
    // GATELOCK: Executive Authorization Check
    if (planTier === 'ADMIN') {
        const systemSecret = process.env.NEXT_PUBLIC_ADMIN_GATE_CODE;
        if (!systemSecret || data.adminCode !== systemSecret) {
            toast({
                variant: 'destructive',
                title: 'Authorization Denied',
                description: 'The provided Executive Access Code is invalid or missing.',
            });
            return;
        }
    }

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

        if (isFreePlan) {
            onPaystackSuccess();
            return;
        }

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

        setIsSuccess(true);
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
  const isFreePlan = (planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN';
  const buttonText = isFreePlan ? 'Create Admin Account' : 'Create Account & Pay';

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
                                              <div className="relative">
                                                <Input 
                                                  type={showPassword ? "text" : "password"} 
                                                  placeholder="••••••••" 
                                                  {...field} 
                                                  className="pr-10"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => setShowPassword(!showPassword)}
                                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                                >
                                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                              </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />

                                    {planTier === 'ADMIN' && (
                                        <FormField
                                            control={form.control}
                                            name="adminCode"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-primary font-bold flex items-center gap-2">
                                                    <Lock className="h-3 w-3" /> Executive Access Code
                                                </FormLabel>
                                                <FormControl>
                                                  <div className="relative">
                                                    <Input 
                                                        type={showAdminCode ? "text" : "password"}
                                                        placeholder="Enter System Secret" 
                                                        {...field} 
                                                        className="bg-primary/5 border-primary/20 pr-10"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => setShowAdminCode(!showAdminCode)}
                                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                                                    >
                                                      {showAdminCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                  </div>
                                                </FormControl>
                                                <FormDescription>Administrator registration requires system-level authorization.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    )}

                                     <FormField
                                        control={form.control}
                                        name="referralCode"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                Referral Code {refParam && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                                            </FormLabel>
                                            <FormControl>
                                            <Input 
                                                placeholder={refParam ? refParam.toUpperCase() : "Enter code (Optional)"} 
                                                {...field} 
                                                disabled={!!refParam}
                                                className={cn(!!refParam && "bg-muted/50 cursor-not-allowed border-primary/20 text-primary font-mono font-bold")}
                                            />
                                            </FormControl>
                                            {refParam && <p className="text-[10px] text-primary/60 uppercase tracking-widest font-bold">Partner attribution applied via link</p>}
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
                            <p className="text-lg font-medium">Provisioning Session...</p>
                            <p className="text-muted-foreground text-sm">Synchronizing your credentials with the platform.</p>
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
