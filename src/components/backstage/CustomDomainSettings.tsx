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
    Trash2
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

export function CustomDomainSettings() {
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

  if (storeLoading) return <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <Card className="border-primary/20 bg-slate-900/30 overflow-hidden">
        <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-headline flex items-center gap-2 text-slate-200">
                    <Globe className="h-5 w-5 text-primary" />
                    White-Label Domain
                </CardTitle>
                {domainStatus !== 'unverified' && (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={checkStatus} disabled={isCheckingStatus} className="h-8 text-[10px] uppercase font-bold text-primary">
                            {isCheckingStatus ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                            Refresh Status
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={isDisconnecting} className="h-8 text-[10px] uppercase font-bold text-destructive">
                            <Trash2 className="h-3 w-3 mr-1" /> Disconnect
                        </Button>
                    </div>
                )}
            </div>
            <CardDescription className="text-slate-500">Host your curated brand experience on a custom web address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-end gap-4">
                <div className="w-full sm:flex-1 space-y-2">
                    <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Public Domain</Label>
                    <Input
                        placeholder="e.g., shop.yourbrand.com"
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        disabled={domainStatus === 'connected' || isSaving}
                        className="h-12 border-primary/10 bg-slate-950/50 font-mono"
                    />
                </div>
                {domainStatus === 'unverified' && (
                    <Button onClick={handleSave} disabled={isSaving || !domainInput} className="h-12 px-8 btn-gold-glow bg-primary font-bold">
                        {isSaving ? <Loader2 className="animate-spin" /> : 'Connect Domain'}
                    </Button>
                )}
            </div>

            {(domainStatus === 'pending_dns' || storeData?.vercelMisconfigured) && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                            <ShieldAlert className="h-4 w-4" /> Required DNS Record
                        </div>
                        
                        <div className="rounded-lg bg-black/40 border border-white/5 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-primary/5">
                                    <TableRow className="border-primary/10">
                                        <TableHead className="text-[10px] text-primary">TYPE</TableHead>
                                        <TableHead className="text-[10px] text-primary">HOST</TableHead>
                                        <TableHead className="text-[10px] text-primary">VALUE</TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="border-transparent">
                                        <TableCell className="font-bold text-xs">{storeData?.dnsRecord?.type || (domainInput.split('.').length > 2 ? 'CNAME' : 'A')}</TableCell>
                                        <TableCell className="font-mono text-xs">{storeData?.dnsRecord?.name || (domainInput.split('.').length > 2 ? domainInput.split('.')[0] : '@')}</TableCell>
                                        <TableCell className="font-mono text-[10px] text-primary">{storeData?.dnsRecord?.value || (domainInput.split('.').length > 2 ? 'cname.vercel-dns.com' : '76.76.21.21')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(storeData?.dnsRecord?.value || '76.76.21.21', 'DNS')}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <p className="text-[10px] text-slate-400 italic">Propagation can take up to 24 hours but usually resolves in minutes.</p>
                            <Button onClick={checkStatus} disabled={isCheckingStatus} className="w-full sm:w-auto h-10 btn-gold-glow bg-primary font-bold">
                                {isCheckingStatus ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Verify Configuration
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {domainStatus === 'connected' && (
                <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-200">Domain Verified</p>
                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Global Edge Active</p>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="border-green-500/20 text-green-500 hover:bg-green-500/10 h-10">
                        <Link href={`https://${storeData?.customDomain}`} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-2" /> Visit Boutique
                        </Link>
                    </Button>
                </div>
            )}
        </CardContent>
    </Card>
  );
}
