'use client';

import { useState } from 'react';
import { useAuth, useUser } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, Mail, Key, Lock, Loader2, Smartphone } from 'lucide-react';
import SomaLogo from '@/components/logo';

export default function BackstageSettingsPage() {
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    if (!auth || !user?.email) return;

    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Reset Email Sent',
        description: `A security link has been dispatched to ${user.email}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Transmission Failed',
        description: error.message || 'Could not send reset email. Please contact support.',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center">
        <SomaLogo className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-4xl font-bold font-headline mt-4 text-primary tracking-tight">Account & Security</h1>
        <p className="mt-2 text-lg text-muted-foreground">Manage your credentials and platform security protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Security Protocols Card */}
        <Card className="border-primary/20 bg-slate-900/30">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Security Protocols
            </CardTitle>
            <CardDescription>Update your access credentials and authentication methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-slate-200">Password Reset</Label>
                  <p className="text-xs text-muted-foreground">Receive a secure link to change your password.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={handlePasswordReset}
                  disabled={isSendingReset}
                >
                  {isSendingReset ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Send Link
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-slate-200 flex items-center gap-2">
                    Two-Factor Auth (2FA)
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-widest font-black">Elite</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security via mobile app or SMS.</p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Identity & Session Card */}
        <Card className="border-primary/20 bg-slate-900/30">
          <CardHeader>
            <CardTitle className="text-xl font-headline flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Identity Verification
            </CardTitle>
            <CardDescription>Your account is secured by the SOMA Shield protocol.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg border border-primary/10 bg-primary/5 italic text-sm text-slate-400">
              <p>Your current login email is: <span className="text-slate-200 font-mono">{user?.email}</span></p>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 opacity-60 grayscale cursor-not-allowed">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <Smartphone className="h-5 w-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-400 font-headline">Biometric Unlock</h4>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">Coming in v2.0</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex items-start gap-4 max-w-2xl mx-auto">
        <Key className="h-6 w-6 text-primary shrink-0 mt-1" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Global Security Standard</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            SOMA employs advanced encryption and session management to protect the integrity of the Master Catalog. 
            Passwords must contain at least 8 characters, including a special symbol.
          </p>
        </div>
      </div>
    </div>
  );
}
