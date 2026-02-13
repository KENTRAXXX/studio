'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, ShieldCheck, Zap, DollarSign, Key, Globe, Mail, Loader2, CheckCircle2, Gift, Percent, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { sendTestEmail } from '@/ai/flows/send-test-email';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

type PlatformConfig = {
    standardCommission: number;
    brandCommission: number;
    ambassadorBounty: number;
    recruitDiscount: number;
    isSyncActive: boolean;
    isSignupActive: boolean;
};

export default function PlatformSettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const configRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, 'platform_metadata', 'config');
  }, [firestore]);

  const { data: config, loading: configLoading } = useDoc<PlatformConfig>(configRef);

  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Form State
  const [stdComm, setStdComm] = useState('9.0');
  const [brandComm, setBrandComm] = useState('3.0');
  const [bounty, setBounty] = useState('5.0');
  const [discount, setDiscount] = useState('20');

  useEffect(() => {
      if (config) {
          setStdComm(String(config.standardCommission || '9.0'));
          setBrandComm(String(config.brandCommission || '3.0'));
          setBounty(String(config.ambassadorBounty || '5.0'));
          setDiscount(String(config.recruitDiscount || '20'));
      }
  }, [config]);

  const handleSaveConfig = async () => {
      if (!configRef) return;
      setIsSavingConfig(true);
      try {
          await setDoc(configRef, {
              standardCommission: parseFloat(stdComm),
              brandCommission: parseFloat(brandComm),
              ambassadorBounty: parseFloat(bounty),
              recruitDiscount: parseInt(discount, 10),
              isSyncActive: config?.isSyncActive ?? true,
              isSignupActive: config?.isSignupActive ?? true,
              lastUpdated: new Date().toISOString()
          }, { merge: true });

          toast({ title: 'Config Synchronized', description: 'Global parameters updated across the ecosystem.' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
      } finally {
          setIsSavingConfig(false);
      }
  };

  const handleRunEmailTest = async () => {
    if (!testEmail) {
        toast({ variant: 'destructive', title: 'Address Required', description: 'Enter a recipient email for the diagnostic test.' });
        return;
    }

    setIsTesting(true);
    try {
        const result = await sendTestEmail({ to: testEmail });
        if (result.success) {
            toast({
                title: 'Transmission Success',
                description: 'Check your inbox for the SOMA Digital Handshake.',
                action: <CheckCircle2 className="h-4 w-4 text-green-500" />
            });
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Transmission Failed', description: error.message });
    } finally {
        setIsTesting(false);
    }
  };

  if (configLoading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Platform Orchestration
            </h1>
            <p className="text-muted-foreground mt-1">Configure global economic parameters and system-wide API integrations.</p>
        </div>
        <Button onClick={handleSaveConfig} disabled={isSavingConfig} className="btn-gold-glow bg-primary h-12 px-8 font-black">
            {isSavingConfig ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Deploy All Changes
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-primary/20 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Global Revenue Model
              </CardTitle>
              <CardDescription>Adjust the platform commission rates for all transactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Standard Seller Fee (%)</Label>
                  <Input type="number" value={stdComm} onChange={(e) => setStdComm(e.target.value)} className="bg-black/40 border-primary/10" />
                </div>
                <div className="space-y-2">
                  <Label>Brand Partner Fee (%)</Label>
                  <Input type="number" value={brandComm} onChange={(e) => setBrandComm(e.target.value)} className="bg-black/40 border-primary/10" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5 shadow-gold-glow">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Ambassador Program Config
              </CardTitle>
              <CardDescription>Manage rewards for your performance marketing force.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-primary font-bold">Ambassador Bounty ($)</Label>
                  <Input type="number" value={bounty} onChange={(e) => setBounty(e.target.value)} className="bg-black/40 border-primary/30 h-12 text-lg font-mono" />
                  <p className="text-[10px] text-muted-foreground italic">Paid flat per activated Mogul/Merchant.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary font-bold">Recruit Discount (%)</Label>
                  <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="bg-black/40 border-primary/30 h-12 text-lg font-mono" />
                  <p className="text-[10px] text-muted-foreground italic">Applied to all plan tiers for new referrals.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Transmission Diagnostic
              </CardTitle>
              <CardDescription>Verify the Resend API configuration and Edge runtime delivery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="test-email">Recipient Email Address</Label>
                    <div className="flex gap-3">
                        <Input 
                            id="test-email" 
                            type="email" 
                            placeholder="executive@somatoday.com" 
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="bg-black/40 border-primary/10"
                        />
                        <Button 
                            variant="outline" 
                            className="border-primary/30 text-primary hover:bg-primary/10"
                            onClick={handleRunEmailTest}
                            disabled={isTesting}
                        >
                            {isTesting ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap className="h-4 w-4 mr-2" />}
                            Send Test
                        </Button>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-headline uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Governance Guard
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-4">
              <p>Platform-wide changes are propagated to the Paystack webhook and signup engines instantly.</p>
              <Separator className="bg-primary/10" />
              <p className="italic text-destructive">Warning: Adjusting fee structures will not affect previously logged transactions.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-headline uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                <Globe className="h-4 w-4" /> System Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase">Signups</span>
                <Badge className={cn(config?.isSignupActive ? "bg-green-500" : "bg-red-500")}>
                    {config?.isSignupActive ? "ENABLED" : "PAUSED"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase">Master Sync</span>
                <Badge className={cn(config?.isSyncActive ? "bg-green-500" : "bg-red-500")}>
                    {config?.isSyncActive ? "ACTIVE" : "OFFLINE"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={cn(
            "px-2 py-0.5 rounded-full font-black text-[9px] inline-flex items-center text-primary-foreground tracking-tighter",
            className
        )}>
            {children}
        </div>
    );
}