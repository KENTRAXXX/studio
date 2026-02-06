'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, ShieldCheck, Zap, DollarSign, Key, Globe, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { sendTestEmail } from '@/ai/flows/send-test-email';
import { useToast } from '@/hooks/use-toast';

export default function PlatformSettingsPage() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

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
        toast({
            variant: 'destructive',
            title: 'Transmission Failed',
            description: error.message
        });
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <header>
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Platform Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure global economic parameters and system-wide API integrations.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-primary/20 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Global Fee Structure
              </CardTitle>
              <CardDescription>Adjust the platform commission rates for all transactions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Standard Seller Fee (%)</Label>
                  <Input type="number" placeholder="9.0" defaultValue="9.0" />
                </div>
                <div className="space-y-2">
                  <Label>Brand Partner Fee (%)</Label>
                  <Input type="number" placeholder="3.0" defaultValue="3.0" />
                </div>
              </div>
              <Button className="btn-gold-glow">Update Economics</Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Edge Transmission Diagnostic
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
                            Send Test Transmission
                        </Button>
                    </div>
                </div>
                <div className="p-4 rounded-lg bg-black/20 border border-white/5 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Configuration Check</p>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Sender Identity:</span>
                        <code className="text-primary">no-reply@somatoday.com</code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">API Gateway:</span>
                        <span className="text-green-500 font-bold">READY (RESEND)</span>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-slate-900/30">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Orchestration
              </CardTitle>
              <CardDescription>Manage keys for Paystack, Resend, and Google Cloud.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-slate-200">Paystack Secret Key</p>
                    <p className="text-xs text-muted-foreground font-mono">sk_live_••••••••••••••••</p>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5">CONNECTED</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-slate-200">Resend API Domain</p>
                    <p className="text-xs text-muted-foreground font-mono">somatoday.com</p>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5">VERIFIED</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xs font-headline uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> System Guard
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-4">
              <p>Platform-wide changes are propagated to all 1,000+ active boutiques within 60 seconds.</p>
              <Separator className="bg-primary/10" />
              <p className="italic">Warning: Adjusting fee structures will affect all pending payout calculations immediately.</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-xs font-headline uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                <Globe className="h-4 w-4" /> Region Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase">Global Signups</span>
                <Badge className="bg-green-500">ENABLED</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase">Master Sync</span>
                <Badge className="bg-green-500">ACTIVE</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'outline', className?: string }) {
    return (
        <div className={cn(
            "px-2 py-0.5 rounded-full font-bold inline-flex items-center",
            variant === 'default' ? "bg-primary text-primary-foreground text-[10px]" : "border border-border text-[10px]",
            className
        )}>
            {children}
        </div>
    );
}
