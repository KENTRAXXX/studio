'use client';

import { Suspense } from 'react';
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
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

const plans: { [key: string]: { id: string; name: string; amount: number } } = {
    monthly: { id: 'monthly', name: 'The Scaler', amount: 2900 },
    lifetime: { id: 'lifetime', name: 'The Mogul', amount: 50000 },
};

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { mutate: signUp, isPending: isSigningUp } = useSignUp();
  const { initializePayment, isInitializing } = usePaystack();
  const [isSuccess, setIsSuccess] = useState(false);

  const planId = searchParams.get('plan') || 'lifetime';
  const selectedPlan = plans[planId] || plans.lifetime;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
  });

  const onSubmit = (data: FormValues) => {
    signUp(data, {
      onSuccess: async (user) => {
        toast({
          title: 'Account Created',
          description: "Welcome! Let's get you set up.",
        });

        // In a real app, template would be part of the user's choices
        const template = 'gold-standard';

        const onPaystackSuccess = () => {
          console.log('Paystack success callback triggered.');
          toast({
            title: 'Payment Successful!',
            description: 'Your store is being provisioned. This may take a moment.',
          });
          // The webhook handles store creation, so just redirect
          router.push('/dashboard/my-store');
        };

        const onPaystackClose = () => {
          console.log('Paystack popup closed.');
          toast({
            variant: 'default',
            title: 'Payment Incomplete',
            description: 'Your store will not be created until payment is complete. You can restart from your dashboard.',
          });
          router.push('/dashboard/my-store');
        };

        await initializePayment({
            email: data.email,
            amount: selectedPlan.amount,
            metadata: {
              userId: user.user.uid,
              plan: selectedPlan.id,
              template: template,
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

  return (
      <div className="w-full max-w-md">
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
                                    <Button type="submit" disabled={isPending} className="w-full h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                                        {isPending ? <Loader2 className="animate-spin" /> : 'Create Account & Pay'}
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
