'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, CheckCircle2, Loader2 } from 'lucide-react';
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

export default function DomainSettingsPage() {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'connected'>('idle');

  const handleVerify = () => {
    setVerificationStatus('checking');
    setTimeout(() => {
      setVerificationStatus('connected');
    }, 2000);
  };

  const getButtonContent = () => {
    switch (verificationStatus) {
      case 'checking':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking...
          </>
        );
      case 'connected':
        return (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Connected
          </>
        );
      default:
        return 'Verify Connection';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Globe className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Domain Settings</h1>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Point your custom domain to our servers to launch your storefront.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-domain" className="text-base">
              Enter your custom domain
            </Label>
            <Input
              id="custom-domain"
              placeholder="e.g., my-awesome-store.com"
              className="max-w-lg"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>DNS Configuration</CardTitle>
          <CardDescription>
            Update your domain's DNS records with the following values.
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
                <TableCell className="font-mono">123.456.78.9</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="outline">CNAME</Badge>
                </TableCell>
                <TableCell className="font-mono">www</TableCell>
                <TableCell className="font-mono">proxy.soma.com</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleVerify}
          disabled={verificationStatus === 'checking'}
          className={cn(
            'transition-all',
            verificationStatus === 'connected'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-primary hover:bg-primary/90',
            'text-primary-foreground'
          )}
        >
          {getButtonContent()}
        </Button>
      </div>
    </div>
  );
}
