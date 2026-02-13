'use client';

import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';

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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import SomaLogo from '@/components/logo';
import { useSignUp } from '@/hooks/use-signup';
import { usePaystack } from '@/hooks/use-paystack';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2, ShieldCheck, Lock, Globe, User, MessageSquare, Landmark, FileText, CheckCircle2, UploadCloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ImageUploader } from '@/components/ui/image-uploader';

const formSchema = z.object({
  fullName: z.string().min(2, 'Legal name is required.'),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  phoneNumber: z.string().optional(),
  storeName: z.string().optional(),
  desiredSubdomain: z.string().optional(),
  niche: z.string().optional(),
  referralCode: z.string().optional(),
  adminCode: z.string().optional(),
  // Ambassador specific
  ambassadorCode: z.string().min(3, 'Unique handle is required.').optional(),
  socialHandle: z.string().optional(),
  targetAudience: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountHolderName: z.string().optional(),
  governmentId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type PlanInterval = 'monthly' | 'yearly' | 'lifetime' | 'free';
type PlanTier = 'MERCHANT' | 'SCALER' | 'SELLER' | 'ENTERPRISE' | 'BRAND' | 'ADMIN' | 'AMBASSADOR';

function SignUpFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { mutate: signUp, isPending: isSigningUp } = useSignUp();
  const { initializePayment, isInitializing } = usePaystack();
  const [isSuccess, setIsSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);

  const planTier = (searchParams.get('planTier') || 'SCALER') as PlanTier;
  const interval = (searchParams.get('interval') as PlanInterval) || 'monthly';
  const refParam = searchParams.get('ref');
  
  const isAmbassador = planTier === 'AMBASSADOR';
  const isFreePlan = (planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN' || planTier === 'AMBASSADOR';
  const needsBoutiqueConfig = ['MERCHANT', 'SCALER', 'ENTERPRISE'].includes(planTier);
  
  const planName = {
    MERCHANT: 'Merchant',
    SCALER: 'Scaler',
    SELLER: 'Seller',
    ENTERPRISE: 'Enterprise',
    BRAND: 'Brand',
    ADMIN: 'Administrator',
    AMBASSADOR: 'Ambassador',
  }[planTier] || 'Scaler';
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      storeName: '',
      desiredSubdomain: '',
      niche: 'Luxury',
      referralCode: '',
      adminCode: '',
      ambassadorCode: '',
      socialHandle: '',
      targetAudience: '',
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      governmentId: '',
    },
  });

  useEffect(() => {
    if (refParam) {
      form.setValue('referralCode', refParam.toUpperCase());
    }
  }, [refParam, form]);

  const onSubmit = (data: FormValues) => {
    // KYC Check for Ambassadors
    if (isAmbassador && !data.governmentId) {
        toast({
            variant: 'destructive',
            title: 'KYC Document Required',
            description: 'Please upload a verified government identity document to continue.',
        });
        return;
    }

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

    const metadata = {
        signupTimestamp: new Date().toISOString(),
        utmSource: searchParams.get('utm_source') || 'Direct',
        utmMedium: searchParams.get('utm_medium') || 'Organic',
        utmCampaign: searchParams.get('utm_campaign') || 'Standard',
        deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop',
    };

    signUp({ ...data, planTier: planTier, plan: interval, metadata }, {
      onSuccess: async (user) => {
        if (!isFreePlan) {
            toast({
              title: 'Identity Provisioned',
              description: "Directing to secure payment handshake...",
            });
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

          toast({
            title: isFreePlan ? 'Access Finalized' : 'Activation Complete',
            description: 'Your strategic hub is being prepared.',
          });
          
          router.push('/backstage/return');
        };

        const onPaystackClose = () => {
          toast({
            variant: 'default',
            title: 'Action Required',
            description: 'Payment is required to complete portal activation.',
          });
          router.push('/backstage/return');
        };

        if (isFreePlan) {
            onPaystackSuccess();
            return;
        }

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
            
            setIsSuccess(true);
        } catch (error: any) {
            console.error("Signup failure:", error);
        }
      },
      onError: (err) => {
        toast({
          variant: 'destructive',
          title: 'Provisioning Error',
          description: err.message || 'Account creation encountered a logic barrier.',
        });
      },
    });
  };

  const isPending = isSigningUp || isInitializing;
  const buttonText = isFreePlan ? 'Establish Identity' : 'Confirm & Proceed to Payment';

  return (
      <div className="w-full max-w-2xl">
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
                            <CardTitle className="text-2xl font-headline text-primary">
                                {isAmbassador ? 'Strategic Partner Application' : `Establish My Legacy: ${planName}`}
                            </CardTitle>
                            <CardDescription>
                                {isAmbassador 
                                    ? 'Join the SOMA Ambassador force and scale your digital yields.' 
                                    : 'Enter your executive credentials to initialize your SOMA boutique.'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="fullName"
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                <Input placeholder="John Doe" {...field} className="bg-black/20 border-primary/20" />
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
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                <Input placeholder="executive@somatoday.com" {...field} className="bg-black/20 border-primary/20" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    </div>

                                    {needsBoutiqueConfig && (
                                        <div className="space-y-6 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                                                <Globe className="h-4 w-4" /> Boutique Configuration
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="storeName"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Store Name</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="Deluxe Emporium" {...field} className="bg-black/20 border-primary/20" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="desiredSubdomain"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Desired Subdomain</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="emporium" {...field} className="bg-black/20 border-primary/20 font-mono" />
                                                        </FormControl>
                                                        <FormDescription>emporium.somatoday.com</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="niche"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Business Niche</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="Luxury, Tech, Fashion..." {...field} className="bg-black/20 border-primary/20" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="phoneNumber"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>WhatsApp Number</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="+1555..." {...field} className="bg-black/20 border-primary/20" />
                                                        </FormControl>
                                                        <FormDescription>For real-time order alerts.</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {isAmbassador && (
                                        <div className="space-y-6 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest">
                                                <CheckCircle2 className="h-4 w-4" /> Marketer Vetting
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="ambassadorCode"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Unique Ambassador Handle</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="SOMA_HERO" {...field} className="bg-black/20 border-primary/20 font-mono" />
                                                        </FormControl>
                                                        <FormDescription>Your custom link suffix.</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="socialHandle"
                                                    render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Primary Social Platform</FormLabel>
                                                        <FormControl>
                                                        <Input placeholder="@handle (IG/X/TikTok)" {...field} className="bg-black/20 border-primary/20" />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="targetAudience"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Target Audience Description</FormLabel>
                                                    <FormControl>
                                                    <Textarea placeholder="Who will you be marketing to?" {...field} className="bg-black/20 border-primary/20 h-20" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                                    <Landmark className="h-3.5 w-3.5" /> Payout Credentials
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField control={form.control} name="bankName" render={({ field }) => (
                                                        <FormItem><FormControl><Input placeholder="Bank / Provider" {...field} className="bg-black/20 border-primary/20 text-xs" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="accountNumber" render={({ field }) => (
                                                        <FormItem><FormControl><Input placeholder="Account/Mobile #" {...field} className="bg-black/20 border-primary/20 text-xs" /></FormControl></FormItem>
                                                    )} />
                                                    <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                                                        <FormItem><FormControl><Input placeholder="Holder Name" {...field} className="bg-black/20 border-primary/20 text-xs" /></FormControl></FormItem>
                                                    )} />
                                                </div>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="governmentId"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <FileText className="h-3.5 w-3.5 text-primary" />
                                                        Identity Verification (KYC)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-4">
                                                            <ImageUploader 
                                                                onSuccess={(url) => field.onChange(url)}
                                                                label="Upload Government ID / Passport"
                                                                aspectRatio="aspect-[16/9]"
                                                            />
                                                            {field.value && (
                                                                <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-500/10 p-2 rounded border border-green-500/20">
                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                    KYC Asset Secured
                                                                </div>
                                                            )}
                                                            <Input type="hidden" {...field} />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>Official ID document required for payout validation.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}

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
                                            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
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
                                <p className="text-xl font-headline font-bold text-primary">Identity Finalized</p>
                                <p className="text-muted-foreground text-sm mt-2">Initializing your strategic hub...</p>
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
         <SignUpFormContent />
      </Suspense>
    </div>
  );
}
