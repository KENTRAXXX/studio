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
  const { mutate: signUp, mutateWithGoogle: signUpWithGoogle, isPending: isSigningUp } = useSignUp();
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
              title: 'Identity Provisioned',
              description: "Finalizing your empire's secure payment uplink...",
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
            description: isFreePlan ? "Welcome to the elite." : 'Your luxury store is being provisioned across our global edge.',
          });
          
          router.push('/backstage/return');
        };

        const onPaystackClose = () => {
          toast({
            variant: 'default',
            title: 'Payment Deferred',
            description: 'Your account is created, but payment is required for full activation.',
          });
          router.push('/backstage/return');
        };

        if (isFreePlan) {
            onPaystackSuccess();
            return;
        }

        // Wrap payment initialization in a try/catch to handle API failures gracefully
        try {
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
            
            // If we get here, the Paystack modal has been triggered successfully
            setIsSuccess(true);
        } catch (error: any) {
            // Error is already toasted by usePaystack, we just need to ensure the form stays interactive
            console.error("Signup payment flow error:", error);
        }
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: err.message || 'An unexpected error occurred during account creation.',
        });
      },
    });
  };

  const onGoogleSignUp = () => {
    const isFreePlan = (planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN';
    
    // GATELOCK: Executive Authorization Check
    if (planTier === 'ADMIN') {
        const adminCode = form.getValues('adminCode');
        const systemSecret = process.env.NEXT_PUBLIC_ADMIN_GATE_CODE;
        if (!systemSecret || adminCode !== systemSecret) {
            toast({
                variant: 'destructive',
                title: 'Authorization Denied',
                description: 'The provided Executive Access Code is invalid or missing.',
            });
            return;
        }
    }

    signUpWithGoogle({ planTier: planTier, plan: interval, referralCode: form.getValues('referralCode') }, {
      onSuccess: async (user) => {
        if (!isFreePlan) {
            toast({
              title: 'Identity Provisioned',
              description: "Finalizing your empire's secure payment uplink...",
            });
        }

        const onPaystackSuccess = async () => {
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
            description: isFreePlan ? "Welcome to the elite." : 'Your luxury store is being provisioned across our global edge.',
          });
          
          router.push('/backstage/return');
        };

        const onPaystackClose = () => {
          toast({
            variant: 'default',
            title: 'Payment Deferred',
            description: 'Your account is created, but payment is required for full activation.',
          });
          router.push('/backstage/return');
        };

        if (isFreePlan) {
            onPaystackSuccess();
            return;
        }

        try {
            await initializePayment({
                email: user.user.email || '',
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
        } catch (error: any) {
            console.error("Signup payment flow error:", error);
        }
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description: err.message || 'An unexpected error occurred during Google Auth.',
        });
      },
    });
  };

  const isPending = isSigningUp || isInitializing;
  const isFreePlan = (planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN';
  const buttonText = isFreePlan ? 'Create Admin Account' : 'Confirm Plan & Continue to Pay';

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
                    <Card className="border-primary/50 bg-card/50 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-2xl font-headline text-primary">Establish My Legacy: {planName}</CardTitle>
                            <CardDescription>Enter your executive credentials to initialize your SOMA boutique.</CardDescription>
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
                                            <Input placeholder="executive@somatoday.com" {...field} className="bg-black/20 border-primary/20" />
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
                                            <FormLabel>Account Password</FormLabel>
                                            <FormControl>
                                              <div className="relative">
                                                <Input 
                                                  type={showPassword ? "text" : "password"} 
                                                  placeholder="••••••••" 
                                                  {...field} 
                                                  className="bg-black/20 border-primary/20 pr-10"
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
                                                Referral Attribution {refParam && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                                            </FormLabel>
                                            <FormControl>
                                            <Input 
                                                placeholder={refParam ? refParam.toUpperCase() : "Enter partner code (Optional)"} 
                                                {...field} 
                                                disabled={!!refParam}
                                                className={cn(!!refParam && "bg-muted/50 cursor-not-allowed border-primary/20 text-primary font-mono font-bold")}
                                            />
                                            </FormControl>
                                            {refParam && <p className="text-[10px] text-primary/60 uppercase tracking-widest font-bold">Strategic credit applied via link</p>}
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
                                            className="text-xs font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                           I agree to the SOMA Terms of Service, Privacy Policy, and No-Refund Standard.
                                        </label>
                                    </div>
                                    
                                    <Button type="submit" disabled={isPending || !agreedToTerms} className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed font-bold">
                                        {isPending ? (
                                            <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Orchestrating Session...</>
                                        ) : buttonText}
                                    </Button>
                                </form>
                            </Form>

                            <div className="relative my-6">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-primary/20"></div>
                              </div>
                              <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card/50 px-2 text-muted-foreground backdrop-blur-md">Or continue with</span>
                              </div>
                            </div>

                            <Button 
                              type="button" 
                              variant="outline" 
                              disabled={isPending || !agreedToTerms} 
                              onClick={onGoogleSignUp}
                              className="w-full h-14 text-md border-primary/30 text-primary hover:bg-primary/10 font-bold"
                            >
                              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                              </svg>
                              Google
                            </Button>
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
                    <Card className="border-primary/50 bg-primary/5">
                        <CardContent className="p-12 text-center space-y-6">
                            <div className="relative mx-auto w-fit">
                                <Loader2 className="animate-spin h-12 w-12 text-primary"/>
                                <Lock className="absolute inset-0 m-auto h-4 w-4 text-primary/60" />
                            </div>
                            <div>
                                <p className="text-xl font-headline font-bold text-primary">Payment Handshake Initialized</p>
                                <p className="text-muted-foreground text-sm mt-2">Securely processing your plan activation via Paystack...</p>
                            </div>
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-black gold-mesh-gradient p-4 sm:p-6">
      <div className="text-center mb-10">
        <SomaLogo className="h-12 w-12 mx-auto" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-white tracking-tight">Executive Provisioning</h1>
        <p className="mt-2 text-lg text-muted-foreground">Synchronize your identity with the SOMA ecosystem.</p>
      </div>
      <Suspense fallback={<div className="flex h-64 w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
         <SignUpForm />
      </Suspense>
    </div>
  );
}
