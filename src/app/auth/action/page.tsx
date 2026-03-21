'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import SomaLogo from '@/components/logo';
import Link from 'next/link';

function AuthActionHandler() {
  const searchParams = useSearchParams();
  const auth = useAuth();
  const router = useRouter();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resetForm'>('loading');
  const [message, setMessage] = useState('Verifying your secure token...');
  const [newPassword, setNewPassword] = useState('');
  
  useEffect(() => {
    if (!auth || !mode || !oobCode) {
      if (auth && (!mode || !oobCode)) {
        setStatus('error');
        setMessage('Invalid link. The token may have expired or is improperly formatted.');
      }
      return;
    }

    const handleAction = async () => {
      try {
        if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) {
              await auth.currentUser.reload();
          }
          setStatus('success');
          setMessage('Identity verified. Your email has been successfully secured. You may now return to your original tab or log in.');
        } else if (mode === 'resetPassword') {
          // Verify code exists and is valid before showing input
          await verifyPasswordResetCode(auth, oobCode);
          setStatus('resetForm');
          setMessage('Enter your new executive dashboard password.');
        } else {
          setStatus('error');
          setMessage('Unsupported authentication request.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'An error occurred during verification.');
      }
    };

    handleAction();
  }, [auth, mode, oobCode]);

  const handlePasswordReset = async () => {
    if (!auth || !oobCode) return;
    setStatus('loading');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
      setMessage('Password successfully rotated. You may now access the ecosystem.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to update credentials. The token may have expired.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black gold-mesh-gradient p-4 sm:p-6">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <SomaLogo className="h-12 w-12" />
            <span className="font-headline text-3xl font-bold text-primary tracking-widest uppercase">SOMA</span>
        </Link>
      </div>

      <Card className="w-full max-w-md border-primary/30 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline text-primary">System Authentication</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-8 pt-4 space-y-6">
          {status === 'loading' && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
          {status === 'success' && <CheckCircle className="h-16 w-16 text-primary" />}
          {status === 'error' && <XCircle className="h-16 w-16 text-destructive" />}
          
          {status === 'resetForm' && (
            <div className="w-full space-y-4">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="New Secure Password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 bg-black/20 border-primary/20"
                />
              </div>
              <Button 
                onClick={handlePasswordReset} 
                className="w-full h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                disabled={newPassword.length < 6}
              >
                Confirm Protocol Update
              </Button>
            </div>
          )}

          {(status === 'success' || status === 'error') && (
            <Button asChild className="w-full mt-4 h-12 btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              <Link href="/login">Return to Gateway</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <AuthActionHandler />
    </Suspense>
  );
}
