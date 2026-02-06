'use client';
export const runtime = 'edge';

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

type VerificationRecord = {
    type: string;
    name: string;
    value: string;
};

type StoreData = {
    customDomain?: string;
    domainStatus?: 'unverified' | 'pending_dns' | 'connected';
    ownershipRecord?: VerificationRecord;
    sslValidationRecord?: VerificationRecord;
    cfStatus?: string;
    sslStatus?: string;
    lastCfSync?: string;
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

  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somads.pages.dev';

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
                domain: domainInput.toLowerCase(),
                storeId: user.uid
            })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Registration failed');

        toast({
            title: 'Registry Sync Initiated',
            description: 'Verification records generated. Please update your DNS.',
            action: <Zap className="h-4 w-4 text-primary" />
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Provisioning Error', description: error.message });
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
              ownershipRecord: null,
              sslValidationRecord: null,
              cfStatus: null,
              sslStatus: null,
              cfHostnameId: null
          });
          setDomainInput('');
          setHasSetInitial(false);
          toast({ title: 'Domain Disconnected', description: 'Registry records have been cleared.' });
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
                description: 'Domain verification successful.',
                className: 'bg-green-600 border-green-600 text-white'
            });
        } else {
            toast({
                title: 'Check Complete',
                description: `Current status: ${result.cfData?.status || 'Pending'}. Propagation takes time.`,
            });
        }
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: 'Handshake Error',
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
                <h1 className="text-3xl font-bold font-headline">Custom Domain Control</h1>
                <p className="text-muted-foreground mt-1 text-sm">Orchestrate your global web presence via Cloudflare for SaaS.</p>
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
                    Refresh Status
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

       <Card className="border-primary/50 bg-primary/5 border-2 shadow-gold-glow">
        <CardHeader className="flex flex-row items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <div>
                <CardTitle className="text-primary text-xl">SOMA Authority Proxy</CardTitle>
                <CardDescription className="text-primary/80 font-medium">Use the generated records below to link your registrar to our global edge network.</CardDescription>
            </div>
        </CardHeader>
      </Card>

      <Card className="border-primary/50 overflow-hidden bg-slate-900/20">
        <CardHeader className="bg-muted/30 border-b border-primary/10">
          <CardTitle>Step 1: Domain Mapping</CardTitle>
          <CardDescription>Enter your root domain (e.g., brand.com) or a subdomain (e.g., shop.brand.com).</CardDescription>
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
             <Button onClick={handleSave} disabled={isSaving || domainStatus === 'connected' || !domainInput} className="h-12 px-8 btn-gold-glow bg-primary font-bold">
                {isSaving ? <Loader2 className="animate-spin" /> : 'Register with Cloudflare'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(domainStatus === 'pending_dns' || domainStatus === 'connected') && (
        <Card className={cn(
            "border-primary overflow-hidden bg-slate-900/40",
            domainStatus === 'pending_dns' && "card-gold-pulse"
        )}>
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-primary font-headline">
                        <AlertTriangle className="text-primary h-5 w-5"/> 
                        Step 2: DNS Protocol Sync
                    </CardTitle>
                    {storeData?.lastCfSync && (
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">Last Sync: {new Date(storeData.lastCfSync).toLocaleTimeString()}</p>
                    )}
                </div>
                <CardDescription className="text-slate-300">
                    Add these specific records at your registrar to authorize SSL and traffic routing.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
                {/* 1. Ownership Verification (TXT) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <ShieldAlert className="h-3.5 w-3.5" /> Domain Ownership (Required)
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-black/40 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-primary/5">
                                <TableRow className="border-primary/10">
                                    <TableHead className="text-primary font-bold text-[10px]">TYPE</TableHead>
                                    <TableHead className="text-primary font-bold text-[10px]">HOST / NAME</TableHead>
                                    <TableHead className="text-primary font-bold text-[10px]">VALUE / CONTENT</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="border-transparent">
                                    <TableCell><Badge variant="outline" className="border-primary/50 text-primary">TXT</Badge></TableCell>
                                    <TableCell className="font-mono text-xs text-slate-200">
                                        {storeData?.ownershipRecord?.name || '---'}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <code className="text-[10px] text-primary break-all">{storeData?.ownershipRecord?.value || 'Generating...'}</code>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 hover:bg-primary/10"
                                            onClick={() => storeData?.ownershipRecord && copyToClipboard(storeData.ownershipRecord.value, 'TXT')}
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* 2. Routing & SSL (CNAME) */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <Clock className="h-3.5 w-3.5" /> Traffic Routing & SSL Handshake
                    </div>
                    <div className="rounded-xl border border-primary/20 bg-black/40 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-primary/5">
                                <TableRow className="border-primary/10">
                                    <TableHead className="text-primary font-bold text-[10px]">TYPE</TableHead>
                                    <TableHead className="text-primary font-bold text-[10px]">HOST / NAME</TableHead>
                                    <TableHead className="text-primary font-bold text-[10px]">TARGET / DESTINATION</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow className="border-primary/5">
                                    <TableCell><Badge variant="outline" className="border-primary/50 text-primary">CNAME</Badge></TableCell>
                                    <TableCell className="font-mono text-xs text-slate-200">@ or shop</TableCell>
                                    <TableCell className="font-mono text-xs text-primary font-bold tracking-wider">{ROOT_DOMAIN}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => copyToClipboard(ROOT_DOMAIN, 'CNAME')}>
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                {storeData?.sslValidationRecord && (
                                    <TableRow className="border-transparent">
                                        <TableCell><Badge variant="outline" className="border-primary/50 text-primary">{storeData.sslValidationRecord.type}</Badge></TableCell>
                                        <TableCell className="font-mono text-xs text-slate-200 truncate max-w-[150px]">{storeData.sslValidationRecord.name}</TableCell>
                                        <TableCell className="max-w-xs"><code className="text-[10px] text-primary break-all">{storeData.sslValidationRecord.value}</code></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => copyToClipboard(storeData.sslValidationRecord!.value, 'SSL Record')}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                
                <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-200">Global DNS Propagation</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Propagation status: <span className="text-primary font-bold">{storeData?.cfStatus || 'Pending'}</span></p>
                    </div>
                     <Button onClick={checkStatus} disabled={isCheckingStatus} className="w-full sm:w-auto h-12 px-8 btn-gold-glow bg-primary font-bold">
                        {isCheckingStatus ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                        Check Verification Status
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {domainStatus === 'connected' && (
           <Card className="border-green-500/50 bg-green-500/5 overflow-hidden">
            <CardHeader className="bg-green-500/10 border-b border-green-500/20">
                <CardTitle className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-5 w-5"/> 
                    Boutique Infrastructure Verified
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                 <p className="text-slate-300 leading-relaxed">
                    Identity confirmed. Your executive storefront is correctly resolving via the Cloudflare Edge.
                    <br />
                    <Link href={`https://${storeData?.customDomain || domainInput}`} target="_blank" className="inline-flex items-center font-black text-primary hover:text-primary/80 mt-4 text-lg tracking-tight uppercase">
                        {storeData?.customDomain || domainInput} 
                        <ExternalLink className="ml-2 h-4 w-4"/>
                    </Link>
              </p>
            </CardContent>
        </Card>
      )}
      
      <div className="p-6 border border-slate-800 rounded-2xl bg-slate-900/20 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
              <LinkIcon className="h-5 w-5" />
          </div>
          <div>
              <h4 className="text-sm font-bold text-slate-200 mb-1 uppercase tracking-widest">SaaS Provider Note</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                  Verification records are provided by the SOMA SaaS Engine. We use CNAME-based validation to automatically manage your SSL certificates. Do not remove the TXT ownership record after verification, as it is required for continuous certificate renewal.
              </p>
          </div>
      </div>
    </div>
  );
}
