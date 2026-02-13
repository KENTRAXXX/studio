
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';

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
import { Eye, EyeOff, Loader2, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupLink, setSignupLink] = useState('/plan-selection');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.startsWith('ambassador.')) {
        setSignupLink('/signup?planTier=AMBASSADOR&interval=free');
      }
    }
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!auth) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Welcome Back',
        description: 'Accessing your SOMA dashboard...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid credentials. Please check your email and password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black gold-mesh-gradient p-4 sm:p-6">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <SomaLogo className="h-12 w-12" />
            <span className="font-headline text-3xl font-bold text-primary tracking-widest uppercase">SOMA</span>
        </Link>
        <h1 className="text-4xl font-bold font-headline text-white">Executive Login</h1>
        <p className="mt-2 text-muted-foreground">Access your luxury commerce control center.</p>
      </div>

      <Card className="w-full max-w-md border-primary/30 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Authentication
          </CardTitle>
          <CardDescription>Enter your credentials to proceed.</CardDescription>
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
                      <Input placeholder="executive@somads.com" {...field} className="bg-black/20 border-primary/20" />
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
              
              <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {isLoading ? <Loader2 className="animate-spin" /> : 'Enter Ecosystem'}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account yet?
            </p>
            <Button asChild variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
                <Link href={signupLink}>
                    Claim Your Access <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
            
            <div className="pt-6 border-t border-white/5">
                <Link 
                    href="/signup?planTier=ADMIN&interval=free" 
                    className="text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
                >
                    <ShieldCheck className="h-3 w-3" /> Platform Administration Gateway
                </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
