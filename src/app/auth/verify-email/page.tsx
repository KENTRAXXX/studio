'use client';

import { useEffect, useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailOpen, ShieldAlert } from 'lucide-react';
import TradeWyseLogo from '@/components/logo';
import Link from 'next/link';

export default function VerifyEmailWaitPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const checkVerification = async () => {
      // If no currentUser, they shouldn't be on this listening page unless they just force reloaded.
      if (!auth.currentUser) {
        router.push('/login');
        return;
      }

      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
         // They are verified! Determine next route (2FA setup or Dashboard)
         toast({ title: 'Email Verified', description: 'Your identity has been confirmed.' });
         try {
             const userDoc = await getDoc(doc(firestore!, 'users', auth.currentUser.uid));
             if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
                 router.push('/auth/2fa/verify');
             } else {
                 router.push('/auth/2fa/setup');
             }
         } catch(e) {
             router.push('/dashboard');
         }
      } else {
          setLoading(false);
      }
    };

    // Initial check
    checkVerification();

    // Active polling engine for Premium UX
    const interval = setInterval(checkVerification, 3000);

    return () => clearInterval(interval);
  }, [auth, firestore, router, toast]);

  const handleOpenMailClient = () => {
      window.location.href = 'mailto:';
  };

  const handleLogOut = async () => {
      if (auth) {
          await auth.signOut();
          router.push('/login');
      }
  };

  if (loading) {
      return <div className="flex min-h-screen items-center justify-center bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black gold-mesh-gradient p-4 sm:p-6">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 pointer-events-none">
            <TradeWyseLogo className="h-12 w-12" />
            <span className="font-headline text-3xl font-bold text-primary tracking-tighter">Trade Wyse</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-primary/30 bg-card/50 backdrop-blur-sm shadow-[0_0_30px_rgba(212,175,55,0.08)]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary flex items-center justify-center gap-3">
            <ShieldAlert className="w-7 h-7" /> Email Verification
          </CardTitle>
          <CardDescription>
             We dispatched a secure magic link to <strong className="text-primary tracking-wide block mt-1">{auth?.currentUser?.email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-2 pb-6">
            
            <div className="relative flex flex-col items-center justify-center py-6">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl scale-150"></div>
                <Loader2 className="h-16 w-16 animate-spin text-primary mb-4 relative z-10" />
                <p className="text-sm text-center text-muted-foreground max-w-[250px] relative z-10 font-medium">
                    Actively listening for the authorization signal. Please click the link in your inbox.
                </p>
            </div>

            <Button 
                onClick={handleOpenMailClient} 
                className="w-full h-12 text-md border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)] flex items-center justify-center gap-2"
                variant="outline"
            >
                <MailOpen className="w-5 h-5" /> Open Default Mail App
            </Button>
            
            <div className="flex flex-col items-center gap-4 mt-6 w-full border-t border-primary/20 pt-6">
                <button onClick={handleLogOut} className="text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-destructive transition-colors">
                    TERMINATE SESSION
                </button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
