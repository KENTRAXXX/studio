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
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (storeData?.customDomain) {
      setDomainInput(storeData.customDomain);
    }
  }, [storeData]);

  const domainStatus = storeData?.domainStatus || 'unverified';

  const handleVerify = async () => {
    if (!storeRef) return;
    
    // Simple TLD check
    const tldRegex = /\.(com|org|net|io|co|store|shop|xyz)$/i;
    if (!tldRegex.test(domainInput)) {
        toast({
            variant: 'destructive',
            title: 'Invalid Domain',
            description: 'Please enter a valid domain ending in a common TLD (e.g., .com, .store).'
        });
        return;
    }

    setIsVerifying(true);
    try {
        await updateDoc(storeRef, {
            customDomain: domainInput,
            domainStatus: 'pending_dns'
        });
        toast({
            title: 'Verification Pending',
            description: 'Your domain is now pending DNS configuration.'
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not save domain status.'
        });
    } finally {
        setIsVerifying(false);
    }
  };

  const getButtonContent = () => {
    if (isVerifying) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>;
    if (domainStatus === 'connected') return <><CheckCircle2 className="mr-2 h-4 w-4" /> Connected</>;
    if (domainStatus === 'pending_dns') return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Awaiting DNS</>;
    return 'Save & Verify';
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
            Enter the custom domain you purchased from a provider like GoDaddy or Namecheap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:flex-1 space-y-2">
                 <Label htmlFor="custom-domain" className="text-base">
                Your custom domain
                </Label>
                <Input
                id="custom-domain"
                placeholder="e.g., my-awesome-store.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                disabled={domainStatus === 'connected'}
                />
            </div>
             <Button
                onClick={handleVerify}
                disabled={isVerifying || domainStatus === 'connected' || !domainInput}
                className={cn(
                    'transition-all w-full sm:w-auto',
                    domainStatus === 'connected' ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90',
                    'text-primary-foreground'
                )}
                >
                {getButtonContent()}
            </Button>
          </div>
          {domainStatus === 'connected' && (
              <p className="text-sm text-green-500 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4"/>
                  Your domain is successfully connected to SOMA. Visit your live store:
                  <Link href={`https://${domainInput}`} target="_blank" className="font-bold underline hover:text-primary">
                        {domainInput} <ExternalLink className="inline-block ml-1 h-3 w-3"/>
                  </Link>
              </p>
          )}
        </CardContent>
      </Card>

      {domainStatus === 'pending_dns' && (
        <Card className="border-destructive/50 card-gold-pulse">
            <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/> 2. Update DNS Records</CardTitle>
            <CardDescription>
                Action Required: Log in to your domain provider and update your DNS records with the following values.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                <TableRow>
                    <TableCell>
                    <Badge variant="outline">A Record</Badge>
                    </TableCell>
                    <TableCell className="font-mono">@</TableCell>
                    <TableCell className="font-mono">75.2.60.5</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                    <Badge variant="outline">CNAME</Badge>
                    </TableCell>
                    <TableCell className="font-mono">www</TableCell>
                    <TableCell className="font-mono">{domainInput}</TableCell>
                </TableRow>
                </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-4">DNS changes can take up to 48 hours to propagate. We will automatically check the status and connect your domain once the changes are detected.</p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
