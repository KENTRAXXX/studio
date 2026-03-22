'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';
import SomaLogo from '@/components/logo';
import Link from 'next/link';

export default function TwoFactorSetupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState<'selection' | 'authenticator' | 'email'>('selection');
  
  // Authenticator State
  const [totpSecret, setTotpSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Input State (for both modes)
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [tempEmailCode, setTempEmailCode] = useState('');
  const [tempEmailCodeExpiry, setTempEmailCodeExpiry] = useState(0);

  useEffect(() => {
    if (auth && firestore) {
      // Delay to ensure user token is cached
      const checkUser = async () => {
        if (!auth.currentUser) {
          router.push('/login');
          return;
        }
        
        try {
          const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
          if (userDoc.exists() && userDoc.data().twoFactorEnabled) {
            // They already have 2FA enabled, push them into Dashboard!
            router.push('/dashboard');
          } else {
            setLoading(false);
          }
        } catch (error) {
           setLoading(false);
        }
      }
      setTimeout(checkUser, 1000);
    }
  }, [auth, firestore, router]);

  const handleSelectAuthenticator = async () => {
    if (!auth?.currentUser) return;
    setSetupMode('authenticator');
    setIsVerifying(true);
    
    try {
      const response = await fetch('/api/2fa/totp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.currentUser.email })
      });
      const data = await response.json();
      
      if (data.success) {
        setTotpSecret(data.secret);
        setQrCodeUrl(data.qrcodeUrl);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to initialize Authenticator algorithm' });
      setSetupMode('selection');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectEmail = async () => {
    if (!auth?.currentUser || !firestore) return;
    setSetupMode('email');
    setIsVerifying(true);
    
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      setTempEmailCode(code);
      setTempEmailCodeExpiry(expiry);
      
      const userRef = doc(firestore, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { tempEmailOtp: code, tempEmailOtpExpiry: expiry });
      
      const response = await fetch('/api/2fa/email/send', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email: auth.currentUser.email, code })
      });
      const data = await response.json();
      
      if (!data.success) throw new Error(data.message);
      
      toast({ title: 'Code Dispatched', description: 'Check your email inbox for the 6-digit SOMA code.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Dispatch Error', description: 'Failed to transmit verification email.' });
      setSetupMode('selection');
    } finally {
      setIsVerifying(false);
    }
  };

  const finalizeSetup = async (method: 'authenticator' | 'email') => {
    if (!auth?.currentUser || !firestore) return;
    const userRef = doc(firestore, 'users', auth.currentUser.uid);
    try {
      if (method === 'authenticator') {
        await updateDoc(userRef, { 
            twoFactorEnabled: true, 
            twoFactorMethod: 'authenticator',
            totpSecret: totpSecret 
        });
      } else {
        await updateDoc(userRef, { 
            twoFactorEnabled: true, 
            twoFactorMethod: 'email',
            tempEmailOtp: null,
            tempEmailOtpExpiry: null
        });
      }
      
      toast({ title: 'Security Finalized', description: 'Two-Factor Authentication is actively shielding your portal.' });
      router.push('/dashboard');
    } catch(err) {
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not secure configuration in global database.' });
    }
  };

  const handleVerifyTotp = async () => {
    if (verificationCode.length !== 6) return;
    setIsVerifying(true);
    try {
      const response = await fetch('/api/2fa/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: totpSecret, token: verificationCode })
      });
      const data = await response.json();
      
      if (data.success) {
        await finalizeSetup('authenticator');
      } else {
        toast({ variant: 'destructive', title: 'Token Rejected', description: 'The 6-digit authentication token does not match your App sequence.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Verification Error', description: 'Connectivity failed.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (verificationCode.length !== 6) return;
    setIsVerifying(true);
    
    // Client-side quick check vs temporary code
    if (verificationCode === tempEmailCode) {
       if (Date.now() > tempEmailCodeExpiry) {
           toast({ variant: 'destructive', title: 'Code Expired', description: 'This 6-digit code has expired (10 minute limit). Please request a new one.' });
           setIsVerifying(false);
           return;
       }
       await finalizeSetup('email');
    } else {
       toast({ variant: 'destructive', title: 'Access Denied', description: 'The email authentication code is incorrect or expired.' });
       setIsVerifying(false);
    }
  };

  if (loading) {
      return <div className="flex min-h-screen items-center justify-center bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black gold-mesh-gradient p-4 sm:p-6">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <SomaLogo className="h-12 w-12" />
            <span className="font-headline text-3xl font-bold text-primary tracking-tighter">SomaDS</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-primary/30 bg-card/50 backdrop-blur-sm shadow-[0_0_30px_rgba(212,175,55,0.08)]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary flex items-center justify-center gap-3">
            <ShieldCheck className="w-7 h-7" /> Account Security
          </CardTitle>
          <CardDescription>
            SOMA mandates Two-Factor Authentication (2FA) for all executives. Select your trusted security protocol.
          </CardDescription>
        </CardHeader>

        {setupMode === 'selection' && (
          <CardContent className="space-y-4 pt-4 pb-8">
            <Button 
                onClick={handleSelectAuthenticator} 
                className="w-full h-16 flex items-center justify-between px-6 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                variant="outline"
            >
              <div className="flex items-center gap-4">
                <Smartphone className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg tracking-wide">Authenticator App</span>
              </div>
              <ArrowRight className="w-5 h-5 opacity-50" />
            </Button>

            <Button 
                onClick={handleSelectEmail} 
                className="w-full h-16 flex items-center justify-between px-6 border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                variant="outline"
            >
              <div className="flex items-center gap-4">
                <Mail className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg tracking-wide">Email Pin Code</span>
              </div>
              <ArrowRight className="w-5 h-5 opacity-50" />
            </Button>
          </CardContent>
        )}

        {setupMode === 'authenticator' && (
          <CardContent className="flex flex-col items-center justify-center space-y-6 pt-2 pb-6">
            {isVerifying && !qrCodeUrl ? (
                <Loader2 className="h-12 w-12 animate-spin text-primary my-10" />
            ) : (
                <>
                  <p className="text-sm text-center text-muted-foreground px-4">
                    Install <strong className="text-primary">Google Authenticator</strong> or <strong className="text-primary">Authy</strong> on your mobile device and scan this encrypted code.
                  </p>
                  
                  {qrCodeUrl && (
                      <div className="p-3 bg-white rounded-lg border-2 border-primary/50 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeUrl} alt="2FA QR Code" width="200" height="200" />
                      </div>
                  )}

                  <div className="w-full mt-4">
                    <Input 
                      type="text" 
                      placeholder="ENTER 6-DIGIT TOTP" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-xl font-black tracking-[0.5em] h-14 bg-black/40 border-primary/30 text-primary placeholder:tracking-normal placeholder:font-normal"
                    />
                  </div>

                  <Button 
                    onClick={handleVerifyTotp} 
                    disabled={verificationCode.length !== 6 || isVerifying}
                    className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'VERIFY SEQUENCE & ACTIVATE'}
                  </Button>
                  
                  <button onClick={() => setSetupMode('selection')} className="text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary mt-2 transition-colors">
                    AbORT & SELECT ANOTHER METHOD
                  </button>
                </>
            )}
          </CardContent>
        )}

        {setupMode === 'email' && (
          <CardContent className="flex flex-col items-center justify-center space-y-6 pt-2 pb-6">
             {isVerifying && !tempEmailCode ? (
                 <Loader2 className="h-12 w-12 animate-spin text-primary my-10" />
             ) : (
                <>
                  <p className="text-sm text-center text-muted-foreground px-4">
                    A secure 6-digit access token was just transmitted to:<br/>
                    <strong className="text-primary tracking-wide block mt-2">{auth?.currentUser?.email}</strong>
                  </p>

                  <div className="w-full mt-4">
                    <Input 
                      type="text" 
                      placeholder="ENTER 6-DIGIT CODE" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-xl font-black tracking-[0.5em] h-14 bg-black/40 border-primary/30 text-primary placeholder:tracking-normal placeholder:font-normal"
                    />
                  </div>

                  <Button 
                    onClick={handleVerifyEmail} 
                    disabled={verificationCode.length !== 6 || isVerifying}
                    className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  >
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'VERIFY CODE & ACTIVATE'}
                  </Button>
                  
                  <div className="flex flex-col items-center gap-4 mt-4 w-full border-t border-primary/20 pt-4">
                      <button onClick={handleSelectEmail} disabled={isVerifying} className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">
                        Re-Transmit Code
                      </button>
                      <button onClick={() => setSetupMode('selection')} disabled={isVerifying} className="text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary transition-colors">
                        ABORT & SELECT ANOTHER METHOD
                      </button>
                  </div>
                </>
             )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
