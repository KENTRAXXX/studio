'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, CheckCircle2, Loader2, Link as LinkIcon, AlertTriangle, ExternalLink } from 'lucide-react';
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
    
    const tldRegex = /\.(com|org|net|io|co|store|shop|xyz)$/i;
    if (!tldRegex.test(domainInput)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Domain',
            description: 'Please enter a valid domain ending in a common TLD.'
        });
        return;
    }

    setIsSaving(true);
    try {
        await updateDoc(storeRef, {
            customDomain: domainInput,
            domainStatus: 'pending_dns'
        });
        toast({
            title: 'Domain Saved',
            description: 'Please configure your DNS records, then click "Verify Connection".'
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
    try {
        // NOTE: This client-side fetch may be blocked by CORS policies.
        // For a production environment, this fetch should be moved to a serverless function
        // which acts as a proxy to bypass CORS restrictions.
        const response = await fetch(`https://${storeData.customDomain}`);
        const text = await response.text();
        if (text.includes('<meta name="soma-platform-verification" content="true" />')) {
             await updateDoc(storeRef, {
                domainStatus: 'connected'
            });
            toast({
                title: 'Success!',
                description: 'Your domain is now connected and live.',
                className: 'bg-green-600 border-green-600 text-white'
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: 'Could not find the SOMA verification tag on your domain. Please check your DNS settings and try again.'
            });
        }
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Verification Error',
            description: 'Could not reach your domain. Please ensure it is configured correctly and wait a few minutes for DNS to propagate.'
        });
    } finally {
        setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Globe className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Domain Settings</h1>
      </div>

       <Card className="border-primary/50 bg-primary/5 text-primary-foreground">
        <CardHeader className="flex flex-row items-center gap-4">
            <LinkIcon className="h-8 w-8 text-primary" />
            <div>
                <CardTitle className="text-primary">Activate Your Storefront</CardTitle>
                <CardDescription className="text-primary/80">Point your A Record to SOMA's servers to launch your luxury storefront to the world.</CardDescription>
            </div>
        </CardHeader>
      </Card>


      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>1. Connect Your Domain</CardTitle>
          <CardDescription>
            Enter the custom domain you purchased, then save it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:flex-1 space-y-2">
                 <Label htmlFor="custom-domain" className="text-base">Your custom domain</Label>
                <Input
                  id="custom-domain"
                  placeholder="e.g., my-awesome-store.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  disabled={domainStatus === 'connected' || isSaving}
                />
            </div>
             <Button onClick={handleSave} disabled={isSaving || domainStatus === 'connected' || !domainInput}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Domain'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {domainStatus === 'pending_dns' && (
        <Card className="border-destructive/50 card-gold-pulse">
            <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> 2. Update DNS Records</CardTitle>
            <CardDescription>
                Log in to your domain provider (e.g. GoDaddy) and add the following records.
            </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Name</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                    <TableBody>
                        <TableRow><TableCell><Badge variant="outline">A</Badge></TableCell><TableCell className="font-mono">@</TableCell><TableCell className="font-mono">76.76.21.21</TableCell></TableRow>
                        <TableRow><TableCell><Badge variant="outline">CNAME</Badge></TableCell><TableCell className="font-mono">www</TableCell><TableCell className="font-mono">{domainInput}</TableCell></TableRow>
                    </TableBody>
                </Table>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Once you've added the records, click here to verify. DNS changes can take a few minutes to propagate.</p>
                     <Button onClick={handleVerify} disabled={isVerifying} className="w-full sm:w-auto">
                        {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle2 className="mr-2 h-4 w-4"/>}
                        Verify Connection
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {domainStatus === 'connected' && (
           <Card className="border-green-500/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400"><CheckCircle2/> Domain Connected</CardTitle>
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground">
                    Congratulations! Your domain is successfully connected to SOMA. Visit your live store:
                  <Link href={`https://${domainInput}`} target="_blank" className="font-bold underline hover:text-primary ml-2">
                        {domainInput} <ExternalLink className="inline-block ml-1 h-3 w-3"/>
                  </Link>
              </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
