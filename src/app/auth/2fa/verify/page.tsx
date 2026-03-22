'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import SomaLogo from '@/components/logo';
import Link from 'next/link';

export default function TwoFactorVerifyPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Track so we only auto-send the email code exactly once when rendering the email mode.
  const emailSentRef = useRef(false);

  useEffect(() => {
    if (auth && firestore) {
      const loadUser2FA = async () => {
        if (!auth.currentUser) {
          router.push('/login');
          return;
        }
        
        try {
          const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
          if (!userDoc.exists() || !userDoc.data().twoFactorEnabled) {
            router.push('/dashboard');
            return;
          }

          const data = userDoc.data();
          setUserData(data);

          if (data.twoFactorMethod === 'email' && !emailSentRef.current) {
             emailSentRef.current = true;
             await sendFreshEmailCode(auth.currentUser.uid, auth.currentUser.email!);
          }

          setLoading(false);
        } catch (error) {
           setLoading(false);
        }
      }
      setTimeout(loadUser2FA, 800);
    }
  }, [auth, firestore, router]);

  const sendFreshEmailCode = async (uid: string, email: string) => {
      try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        
        const userRef = doc(firestore!, 'users', uid);
        await updateDoc(userRef, { tempEmailOtp: code, tempEmailOtpExpiry: expiry });
        
        const response = await fetch('/api/2fa/email/send', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email, code })
        });
        
        const resData = await response.json();
        if (!resData.success) throw new Error(resData.message);
        
        toast({ title: 'Code Dispatched', description: 'A fresh 6-digit SOMA authorization code was sent to your email.' });
      } catch (err) {
        toast({ variant: 'destructive', title: 'Dispatch Error', description: 'Failed to transmit authorization email.' });
      }
  };

  const handleManualResendEmail = () => {
      if (!auth?.currentUser || !firestore) return;
      setIsVerifying(true);
      sendFreshEmailCode(auth.currentUser.uid, auth.currentUser.email!).finally(() => setIsVerifying(false));
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6 || !auth?.currentUser || !userData) return;
    setIsVerifying(true);
    
    try {
        if (userData.twoFactorMethod === 'authenticator') {
            const response = await fetch('/api/2fa/totp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: userData.totpSecret, token: verificationCode })
            });
            const data = await response.json();
            
            if (data.success) {
                toast({ title: 'Clearance Granted', description: 'Authentication successful. Entering portal.' });
                // We must mark the current login session as fully verified!
                // SOMA's dashboard expects the user to just have access if they are logged into Firebase.
                // By updating a session timestamp, we easily know they passed 2FA for this login.
                const userRef = doc(firestore!, 'users', auth.currentUser.uid);
                await updateDoc(userRef, { lastLogin2faVerifiedAt: new Date().toISOString() });
                router.push('/dashboard');
            } else {
                toast({ variant: 'destructive', title: 'Access Denied', description: 'The 6-digit Authenticator sequence was rejected.' });
            }
        } 
        else if (userData.twoFactorMethod === 'email') {
            // Check Firestore strictly to ensure the code matches the dispatched code
            const freshDoc = await getDoc(doc(firestore!, 'users', auth.currentUser.uid));
            if (freshDoc.exists()) {
                const data = freshDoc.data();
                if (data.tempEmailOtp === verificationCode) {
                    if (data.tempEmailOtpExpiry && Date.now() > data.tempEmailOtpExpiry) {
                        toast({ variant: 'destructive', title: 'Code Expired', description: 'This 6-digit code has expired (10 minute limit). Please transmit a new one.' });
                        setIsVerifying(false);
                        return;
                    }
                    toast({ title: 'Clearance Granted', description: 'Authentication successful. Entering portal.' });
                    const userRef = doc(firestore!, 'users', auth.currentUser.uid);
                    await updateDoc(userRef, { lastLogin2faVerifiedAt: new Date().toISOString(), tempEmailOtp: null, tempEmailOtpExpiry: null });
                    router.push('/dashboard');
                } else {
                    toast({ variant: 'destructive', title: 'Access Denied', description: 'The email authentication code is incorrect or expired.' });
                }
            }
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Connection Severed', description: 'Failed to securely negotiate authentication logic.' });
    } finally {
        setIsVerifying(false);
    }
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
            <SomaLogo className="h-12 w-12" />
            <span className="font-headline text-3xl font-bold text-primary tracking-tighter">SomaDS</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-primary/30 bg-card/50 backdrop-blur-sm shadow-[0_0_30px_rgba(212,175,55,0.08)]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary flex items-center justify-center gap-3">
            <ShieldAlert className="w-7 h-7" /> Strict Authentication
          </CardTitle>
          <CardDescription>
            {userData?.twoFactorMethod === 'authenticator' 
               ? 'Enter the 6-digit sequence from your trusted Authenticator App.'
               : 'Enter the 6-digit authorization pin code sent to your email.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center space-y-6 pt-2 pb-6">
            <div className="w-full mt-2">
            <Input 
                type="text" 
                placeholder="ENTER 6-DIGIT PIN" 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-xl font-black tracking-[0.5em] h-14 bg-black/40 border-primary/30 text-primary placeholder:tracking-normal placeholder:font-normal"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
            </div>

            <Button 
            onClick={handleVerify} 
            disabled={verificationCode.length !== 6 || isVerifying}
            className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'UNLOCK PORTAL'}
            </Button>
            
            <div className="flex flex-col items-center gap-4 mt-6 w-full border-t border-primary/20 pt-6">
                {userData?.twoFactorMethod === 'email' && (
                    <button onClick={handleManualResendEmail} disabled={isVerifying} className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">
                        Re-Transmit Code
                    </button>
                )}
                <button onClick={handleLogOut} disabled={isVerifying} className="text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-destructive transition-colors">
                    TERMINATE SESSION
                </button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
