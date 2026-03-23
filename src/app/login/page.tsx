'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

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
  const firestore = useFirestore();
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
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);

      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user).catch(console.error);
        toast({
          title: 'Verification Required',
          description: 'A secure link was dispatched to your inbox.',
        });
        router.push('/auth/verify-email');
        return;
      }

      const userDoc = await getDoc(doc(firestore!, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
        router.push('/auth/2fa/verify');
        return;
      } else if (userDoc.exists() && !userDoc.data().twoFactorEnabled) {
        router.push('/auth/2fa/setup');
        return;
      }

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

  const onGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      if (!userCredential.user.emailVerified) {
        toast({
          variant: 'destructive',
          title: 'Verification Required',
          description: 'Your Google account email is not mathematically verified by Google.',
        });
        router.push('/auth/verify-email');
        return;
      }

      const userDoc = await getDoc(doc(firestore!, 'users', userCredential.user.uid));
      if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
        router.push('/auth/2fa/verify');
        return;
      } else if (userDoc.exists() && !userDoc.data().twoFactorEnabled) {
        router.push('/auth/2fa/setup');
        return;
      }

      toast({
        title: 'Welcome Back',
        description: 'Accessing your SOMA dashboard...',
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An error occurred during Google sign in.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async () => {
    const email = form.getValues('email');
    if (!email || !email.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Identity Required',
        description: 'Please type your executive email address first before resetting your password.',
      });
      return;
    }

    if (!auth) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Server error — please try again.');
      toast({
        title: 'Secure Link Dispatched',
        description: 'A dedicated terminal link to reset your password has been routed to your email.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: error.message || 'Could not communicate with the authentication server.',
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
          <span className="font-headline text-3xl font-bold text-primary tracking-tighter">SomaDS</span>
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <button
                        type="button"
                        onClick={onForgotPassword}
                        disabled={isLoading}
                        className="text-[10px] uppercase font-black tracking-widest text-primary/70 hover:text-primary transition-colors disabled:opacity-50"
                      >
                        Reset Password?
                      </button>
                    </div>
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
            disabled={isLoading}
            onClick={onGoogleSignIn}
            className="w-full h-12 text-md border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)]"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>

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
