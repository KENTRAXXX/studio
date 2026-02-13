
'use client';

import { useTransition, useEffect } from 'react';
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
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { TIER_REGISTRY, type PlanTier } from '@/lib/tiers';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  referralCode: z.string().optional(),
  adminCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type PlanInterval = 'monthly' | 'yearly' | 'lifetime' | 'free';

export default function SignUpFormContent() {
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
  
  // 1. RECRUIT ATTRIBUTION LOGIC
  // Check URL first, then fall back to the 30-day persistent cookie
  const getReferralContext = () => {
      const urlRef = searchParams.get('ref');
      if (urlRef) return urlRef.toUpperCase();
      
      const cookie = document.cookie.split('; ').find(row => row.startsWith('soma_referral_code='));
      return cookie ? cookie.split('=')[1] : '';
  };

  const initialRef = getReferralContext();
  
  const planName = TIER_REGISTRY[planTier]?.label || 'Empire';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      referralCode: initialRef,
      adminCode: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    const isFreePlan = (planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN' || planTier === 'AMBASSADOR';
    
    if (planTier === 'ADMIN') {
        const systemSecret = process.env.NEXT_PUBLIC_ADMIN_GATE_CODE;
        if (!systemSecret || data.adminCode !== systemSecret) {
            toast({ variant: 'destructive', title: 'Authorization Denied', description: 'Invalid Executive Access Code.' });
            return;
        }
    }

    signUp({ ...data, planTier: planTier, plan: interval }, {
      onSuccess: async (user) => {
        if (!isFreePlan) {
            toast({ title: 'Identity Provisioned', description: "Directing to secure payment handshake..." });
        }

        const onPaystackSuccess = async () => {
          if (firestore && user.user.uid) {
              try {
                  const userRef = doc(firestore, 'users', user.user.uid);
                  await updateDoc(userRef, { hasAccess: true });
              } catch (e) {
                  console.error("Status sync failed:", e);
              }
          }
          toast({ title: isFreePlan ? 'Access Finalized' : 'Activation Complete', description: 'Your strategic hub is being prepared.' });
          router.push('/backstage/return');
        };

        const onPaystackClose = () => {
          toast({ variant: 'default', title: 'Action Required', description: 'Payment is required to complete portal activation.' });
          router.push('/backstage/return');
        };

        if (isFreePlan) {
            onPaystackSuccess();
            return;
        }

        try {
            await initializePayment({
                email: data.email,
                payment: { type: 'signup', planTier, interval },
                metadata: {
                  userId: user.user.uid,
                  plan: interval,
                  planTier: planTier,
                  template: 'gold-standard',
                  referralCode: data.referralCode // Crucial for webhook attribution
                },
              },
              onPaystackSuccess,
              onPaystackClose
            );
            setIsSuccess(true);
        } catch (error: any) {
            console.error("Signup failure:", error);
        }
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: 'Provisioning Error', description: err.message || 'Account creation encountered a logic barrier.' });
      },
    });
  };

  const isPending = isSigningUp || isInitializing;
  const isFreePlan = (planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN' || planTier === 'AMBASSADOR';
  const buttonText = isFreePlan ? 'Initialize Identity' : 'Confirm & Proceed to Payment';

  return (
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
            {!isSuccess ? (
                 <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <Card className="border-primary/50 bg-card/50 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-2xl font-headline text-primary">Establish My Legacy: {planName}</CardTitle>
                            <CardDescription>Enter your executive credentials to initialize your SOMA boutique.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl><Input placeholder="executive@somatoday.com" {...field} className="bg-black/20 border-primary/20" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Password</FormLabel>
                                            <FormControl>
                                              <div className="relative">
                                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} className="bg-black/20 border-primary/20 pr-10" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none">
                                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                              </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    {planTier === 'ADMIN' && (
                                        <FormField control={form.control} name="adminCode" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-primary font-bold flex items-center gap-2"><Lock className="h-3 w-3" /> Executive Access Code</FormLabel>
                                                <FormControl>
                                                  <div className="relative">
                                                    <Input type={showAdminCode ? "text" : "password"} placeholder="Enter System Secret" {...field} className="bg-primary/5 border-primary/20 pr-10"/>
                                                    <button type="button" onClick={() => setShowAdminCode(!showAdminCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none">
                                                      {showAdminCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                  </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    )}

                                     <FormField control={form.control} name="referralCode" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">Referral Attribution {field.value && <Sparkles className="h-3.5 w-3.5 text-primary" />}</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="Enter partner code (Optional)" 
                                                    {...field} 
                                                    className={cn(field.value && "bg-primary/5 border-primary/20 text-primary font-mono font-bold uppercase")}
                                                />
                                            </FormControl>
                                            {field.value && <p className="text-[10px] text-primary/60 uppercase tracking-widest font-bold">Ambassador Discount applied via registry</p>}
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <div className="flex items-center space-x-2 pt-4">
                                        <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => startTransition(() => setAgreedToTerms(checked as boolean))} />
                                        <label htmlFor="terms" className="text-xs font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                           I agree to the SOMA Terms of Service and No-Refund Standard.
                                        </label>
                                    </div>
                                    
                                    <Button type="submit" disabled={isPending || !agreedToTerms} className="w-full h-14 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                                        {isPending ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Provisioning Role...</> : buttonText}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                 <motion.div key="redirecting" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
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
