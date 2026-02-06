'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, CheckCircle2, Loader2, Link as LinkIcon, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
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
}

export default function DomainSettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storeRef = firestore && user ? doc(firestore, 'stores', user.uid) : null;
  const { data: storeData, loading: storeLoading } = useDoc<StoreData>(storeRef);
  const { toast } = useToast();
  
  const [domainInput, setDomainInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (storeData?.customDomain) {
      setDomainInput(storeData.customDomain);
    }
  }, [storeData]);

  const domainStatus = storeData?.domainStatus || 'unverified';

  const handleSave = async () => {
    if (!storeRef || !domainInput) return;
    
    // Simple regex for domain validation
    const tldRegex = /\.(com|org|net|io|co|store|shop|xyz|dev|app|me)$/i;
    if (!tldRegex.test(domainInput)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Domain',
            description: 'Please enter a valid domain name (e.g., yourbrand.com).'
        });
        return;
    }

    setIsSaving(true);
    try {
        await updateDoc(storeRef, {
            customDomain: domainInput.toLowerCase(),
            domainStatus: 'pending_dns'
        });
        toast({
            title: 'Domain Registered',
            description: 'Registry updated. Please configure your DNS records as shown below.'
        });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!storeRef || !storeData?.customDomain) return;
    setIsVerifying(true);
    
    // In a real environment, this would call a server-side proxy to check DNS records
    // For this prototype, we simulate the verification logic
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await updateDoc(storeRef, {
            domainStatus: 'connected'
        });
        
        toast({
            title: 'Success!',
            description: 'Your custom domain is now connected and live.',
            className: 'bg-green-600 border-green-600 text-white'
        });
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Verification Error',
            description: 'Could not reach your domain. Please ensure your DNS records are correct.'
        });
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Globe className="h-8 w-8 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold font-headline">Custom Domain Control</h1>
            <p className="text-muted-foreground mt-1 text-sm">Synchronize your unique web address with the SOMA global network.</p>
        </div>
      </div>

       <Card className="border-primary/50 bg-primary/5 border-2 shadow-gold-glow">
        <CardHeader className="flex flex-row items-center gap-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <div>
                <CardTitle className="text-primary text-xl">SOMA Authority Records</CardTitle>
                <CardDescription className="text-primary/80 font-medium">Use the records provided below to authorize SOMA as the hosting provider for your domain.</CardDescription>
            </div>
        </CardHeader>
      </Card>


      <Card className="border-primary/50 overflow-hidden bg-slate-900/20">
        <CardHeader className="bg-muted/30 border-b border-primary/10">
          <CardTitle>Step 1: Identity Assignment</CardTitle>
          <CardDescription>
            Enter the custom domain you purchased from your registrar (e.g. GoDaddy).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:flex-1 space-y-2">
                 <Label htmlFor="custom-domain" className="text-xs uppercase tracking-widest font-black text-muted-foreground">Your Registered Domain</Label>
                <Input
                  id="custom-domain"
                  placeholder="e.g., boutique.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  disabled={domainStatus === 'connected' || isSaving}
                  className="h-12 border-primary/20 bg-slate-950"
                />
            </div>
             <Button onClick={handleSave} disabled={isSaving || domainStatus === 'connected' || !domainInput} className="h-12 px-8 btn-gold-glow">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Apply Domain'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {domainStatus === 'pending_dns' && (
        <Card className="border-primary card-gold-pulse overflow-hidden bg-slate-900/40">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary font-headline">
                    <AlertTriangle className="text-primary h-5 w-5"/> 
                    Step 2: External DNS Configuration
                </CardTitle>
                <CardDescription className="text-slate-300">
                    Log in to your registrar and add these records. This authorizes SOMA to serve your content.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="rounded-xl border border-primary/20 bg-black/40 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-primary/5">
                            <TableRow className="border-primary/10">
                                <TableHead className="text-primary font-bold">Type</TableHead>
                                <TableHead className="text-primary font-bold">Host / Name</TableHead>
                                <TableHead className="text-primary font-bold">Value / Points To</TableHead>
                                <TableHead className="text-right text-primary font-bold">TTL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="border-primary/5">
                                <TableCell><Badge variant="outline" className="border-primary/50 text-primary">A</Badge></TableCell>
                                <TableCell className="font-mono text-slate-200">@</TableCell>
                                <TableCell className="font-mono text-primary font-bold tracking-wider">76.76.21.21</TableCell>
                                <TableCell className="text-right text-slate-500 font-mono text-xs">Automatic</TableCell>
                            </TableRow>
                            <TableRow className="border-transparent">
                                <TableCell><Badge variant="outline" className="border-primary/50 text-primary">CNAME</Badge></TableCell>
                                <TableCell className="font-mono text-slate-200">www</TableCell>
                                <TableCell className="font-mono text-slate-200">{domainInput || 'yourdomain.com'}</TableCell>
                                <TableCell className="text-right text-slate-500 font-mono text-xs">Automatic</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
                
                <div className="mt-8 p-6 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-200">Propagation Handshake</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">DNS changes can take up to 24 hours to propagate globally, though they are often active within minutes.</p>
                    </div>
                     <Button onClick={handleVerify} disabled={isVerifying} className="w-full sm:w-auto h-12 px-8 btn-gold-glow bg-primary font-bold">
                        {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                        Verify DNS Sync
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
                    Boutique Infrastructure Live
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                 <p className="text-slate-300 leading-relaxed">
                    Identity verified. Your executive storefront is successfully mapped to your custom domain.
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
              <h4 className="text-sm font-bold text-slate-200 mb-1 uppercase tracking-widest">Registrar Note</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                  These records are generated by the SOMA provisioning engine. If you are using a proxy service like Cloudflare, ensure that the "SSL/TLS encryption mode" is set to **Full** or **Full (strict)** to prevent handshake errors.
              </p>
          </div>
      </div>
    </div>
  );
}
