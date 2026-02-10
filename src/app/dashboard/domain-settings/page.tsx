'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Globe, 
    CheckCircle2, 
    Loader2, 
    Link as LinkIcon, 
    AlertTriangle, 
    ExternalLink, 
    ShieldCheck, 
    Zap,
    Copy,
    RefreshCw,
    ShieldAlert,
    Clock,
    Trash2,
    Info,
    ArrowRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type StoreData = {
    customDomain?: string;
    domainStatus?: 'unverified' | 'pending_dns' | 'connected';
    dnsRecord?: {
        type: string;
        name: string;
        value: string;
    };
    vercelVerified?: boolean;
    vercelMisconfigured?: boolean;
    lastVercelSync?: string;
}

export default function DomainSettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storeRef = useMemoFirebase(() => {
    return firestore && user ? doc(firestore, 'stores', user.uid) : null;
  }, [firestore, user]);
  const { data: storeData, loading: storeLoading } = useDoc<StoreData>(storeRef);
  const { toast } = useToast();
  
  const [domainInput, setDomainInput] = useState('');
  const [hasSetInitial, setHasSetInitial] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    if (storeData?.customDomain && !hasSetInitial) {
      setDomainInput(storeData.customDomain);
      setHasSetInitial(true);
    }
  }, [storeData?.customDomain, hasSetInitial]);

  const domainStatus = storeData?.domainStatus || 'unverified';

  const handleSave = async () => {
    if (!user || !domainInput) return;
    
    const tldRegex = /\.(com|org|net|io|co|store|shop|xyz|dev|app|me)$/i;
    if (!tldRegex.test(domainInput)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Domain',
            description: 'Please enter a valid domain name.'
        });
        return;
    }

    setIsSaving(true);
    try {
        const response = await fetch('/api/register-domain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                domain: domainInput.toLowerCase().trim(),
                storeId: user.uid
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Registration failed');

        toast({
            title: 'Vercel Project Synced',
            description: 'Domain attached. Please update your DNS records.',
            action: <Zap className="h-4 w-4 text-primary" />
        });
    } catch (error: any) {
        toast({ 
            variant: 'destructive', 
            title: 'Provisioning Error', 
            description: error.message || 'An unexpected error occurred.' 
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
      if (!storeRef) return;
      setIsDisconnecting(true);
      try {
          await updateDoc(storeRef, {
              customDomain: null,
              domainStatus: 'unverified',
              dnsRecord: null,
              vercelVerified: false,
              vercelMisconfigured: false
          });
          setDomainInput('');
          setHasSetInitial(false);
          toast({ title: 'Domain Disconnected', description: 'Vercel attachment records cleared.' });
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
          setIsDisconnecting(false);
      }
  };

  const checkStatus = async () => {
    if (!user) return;
    setIsCheckingStatus(true);
    
    try {
        const response = await fetch(`/api/check-domain-status?storeId=${user.uid}`);
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Status check failed');

        if (result.status === 'connected') {
            toast({
                title: 'Boutique Live!',
                description: 'Domain verified by Vercel Edge.',
                className: 'bg-green-600 border-green-600 text-white'
            });
        } else {
            toast({
                title: 'Check Complete',
                description: result.vercelData?.misconfigured ? 'DNS Misconfigured. Please verify records.' : 'Awaiting DNS propagation...',
            });
        }
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Verification Error',
            description: error.message
        });
    } finally {
        setIsCheckingStatus(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: `${label} value copied to clipboard.` });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Globe className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold font-headline">Custom Domain Management</h1>
                <p className="text-muted-foreground mt-1 text-sm">Connect your unique brand identity to the SOMA global network.</p>
            </div>
        </div>
        
        {domainStatus !== 'unverified' && (
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={checkStatus} 
                    disabled={isCheckingStatus}
                    className="border-primary/20 hover:bg-primary/5"
                >
                    {isCheckingStatus ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Sync Vercel Status
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="text-muted-foreground hover:text-destructive"
                >
                    {isDisconnecting ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Disconnect
                </Button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card className="border-primary/50 overflow-hidden bg-slate-900/20">
                <CardHeader className="bg-muted/30 border-b border-primary/10">
                <CardTitle>1. Domain Attachment</CardTitle>
                <CardDescription>Enter the domain you purchased from your registrar (e.g., GoDaddy, Namecheap).</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-end gap-4">
                    <div className="w-full sm:flex-1 space-y-2">
                        <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Public Web Address</Label>
                        <Input
                        placeholder="e.g., my-luxury-boutique.com"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        disabled={domainStatus === 'connected' || isSaving}
                        className="h-12 border-primary/20 bg-slate-950 font-mono"
                        />
                    </div>
                    {domainStatus === 'unverified' && (
                        <Button onClick={handleSave} disabled={isSaving || !domainInput} className="h-12 px-8 btn-gold-glow bg-primary font-bold">
                            {isSaving ? <Loader2 className="animate-spin" /> : 'Attach Domain'}
                        </Button>
                    )}
                </div>
                </CardContent>
            </Card>

            {(domainStatus === 'pending_dns' || domainStatus === 'connected' || storeData?.vercelMisconfigured) && (
                <Card className={cn(
                    "border-primary overflow-hidden bg-slate-900/40",
                    (domainStatus === 'pending_dns' || storeData?.vercelMisconfigured) && "card-gold-pulse"
                )}>
                    <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-primary font-headline">
                                <AlertTriangle className={cn("h-5 w-5", storeData?.vercelMisconfigured ? "text-destructive" : "text-primary")}/> 
                                2. DNS Configuration
                            </CardTitle>
                            {storeData?.lastVercelSync && (
                                <p className="text-[10px] font-mono text-muted-foreground uppercase">Verified: {new Date(storeData.lastVercelSync).toLocaleTimeString()}</p>
                            )}
                        </div>
                        <CardDescription className="text-slate-300">
                            Log into your domain registrar and add the following record to point your domain to SOMA.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                                <ShieldAlert className="h-3.5 w-3.5" /> Required DNS Record
                            </div>
                            <div className="rounded-xl border border-primary/20 bg-black/40 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-primary/5">
                                        <TableRow className="border-primary/10">
                                            <TableHead className="text-primary font-bold text-[10px]">TYPE</TableHead>
                                            <TableHead className="text-primary font-bold text-[10px]">HOST / NAME</TableHead>
                                            <TableHead className="text-primary font-bold text-[10px]">VALUE / TARGET</TableHead>
                                            <TableHead className="text-right"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow className="border-transparent">
                                            <TableCell>
                                                <Badge variant="outline" className="border-primary/50 text-primary">
                                                    {storeData?.dnsRecord?.type || (domainInput.split('.').length > 2 ? 'CNAME' : 'A')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-slate-200">
                                                {storeData?.dnsRecord?.name || (domainInput.split('.').length > 2 ? domainInput.split('.')[0] : '@')}
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <code className="text-[10px] text-primary font-bold">
                                                    {storeData?.dnsRecord?.value || (domainInput.split('.').length > 2 ? 'cname.vercel-dns.com' : '76.76.21.21')}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 hover:bg-primary/10"
                                                    onClick={() => copyToClipboard(storeData?.dnsRecord?.value || (domainInput.split('.').length > 2 ? 'cname.vercel-dns.com' : '76.76.21.21'), 'DNS')}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        
                        <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-200">Edge Verification Status</p>
                                <p className={cn(
                                    "text-xs font-bold leading-relaxed",
                                    storeData?.vercelVerified ? "text-green-500" : "text-yellow-500"
                                )}>
                                    {storeData?.vercelVerified ? 'IDENTITY VERIFIED' : 'AWAITING PROPAGATION'}
                                </p>
                            </div>
                            <Button onClick={checkStatus} disabled={isCheckingStatus} className="w-full sm:w-auto h-12 px-8 btn-gold-glow bg-primary font-bold">
                                {isCheckingStatus ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                                Verify DNS Readiness
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {domainStatus === 'connected' && (
                <Card className="border-green-500/50 bg-green-500/5 overflow-hidden">
                    <CardHeader className="bg-green-500/10 border-b border-green-500/20">
                        <CardTitle className="flex items-center gap-2 text-green-400">
                            <ShieldCheck className="h-5 w-5"/> 
                            Identity Successfully Mapped
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <p className="text-slate-300 leading-relaxed">
                            Your luxury boutique is now officially live on your custom domain. SSL certificates have been provisioned and secured.
                            <br />
                            <Link href={`https://${storeData?.customDomain || domainInput}`} target="_blank" className="inline-flex items-center font-black text-primary hover:text-primary/80 mt-4 text-lg tracking-tight uppercase">
                                {storeData?.customDomain || domainInput} 
                                <ExternalLink className="ml-2 h-4 w-4"/>
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                        <Info className="h-3 w-3" /> Strategic Guide
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-4 leading-relaxed">
                    <p>
                        <span className="text-slate-200 font-bold">1. Registrar:</span> Your domain is owned at a registrar (GoDaddy, etc). This is the "Origin."
                    </p>
                    <p>
                        <span className="text-slate-200 font-bold">2. Pointer:</span> Entering your domain here alerts SOMA to expect traffic.
                    </p>
                    <p>
                        <span className="text-slate-200 font-bold">3. DNS Record:</span> You must manually enter the provided A Record or CNAME into your Registrar's dashboard.
                    </p>
                    <p>
                        <span className="text-slate-200 font-bold">4. Secure:</span> Once records match, SOMA automatically applies high-fidelity SSL encryption.
                    </p>
                    <div className="pt-4">
                        <Button asChild variant="link" className="p-0 h-auto text-[10px] font-black uppercase text-primary">
                            <a href="https://vercel.com/docs/concepts/projects/custom-domains" target="_blank">
                                Read Detailed Guide <ArrowRight className="ml-1 h-2 w-2" />
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase text-slate-400">Security Note</CardTitle>
                </CardHeader>
                <CardContent className="text-[11px] text-slate-500 leading-relaxed">
                    Custom domain resolution is processed at the Edge. Most DNS updates resolve within 15 minutes, but global propagation may take up to 24 hours depending on your registrar.
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
