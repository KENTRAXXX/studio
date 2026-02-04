
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUserProfile } from '@/firebase';
import { collection, query, where, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, Check, X, FileText, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendWelcomeEmail } from '@/ai/flows/send-welcome-email';

type PendingSeller = {
  id: string;
  email: string;
  status: 'pending_review' | 'approved' | 'rejected';
  verificationData: {
    legalBusinessName: string;
    warehouseAddress: string;
    governmentIdUrl: string;
    contactPhone: string;
    structuredAddress?: {
        city: string;
        country: string;
    };
  };
};

export default function VerificationQueuePage() {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profileLoading) {
      if (!userProfile || userProfile.userRole !== 'ADMIN') {
        router.push('/access-denied');
      }
    }
  }, [userProfile, profileLoading, router]);

  const pendingUsersQuery = firestore 
    ? query(collection(firestore, 'users'), where('status', '==', 'pending_review')) 
    : null;
  
  const { data: pendingSellers, loading: usersLoading } = useCollection<PendingSeller>(pendingUsersQuery);

  const handleDecision = async (seller: PendingSeller, decision: 'approved' | 'rejected') => {
    if (!firestore) return;
    setProcessingId(seller.id);

    try {
      const userRef = doc(firestore, 'users', seller.id);
      await updateDoc(userRef, { status: decision });

      if (decision === 'approved') {
        // 1. Provision a basic store record for reference (if needed by platform logic)
        const storeRef = doc(firestore, 'stores', seller.id);
        const storeSnap = await getDoc(storeRef);
        if (!storeSnap.exists()) {
            await setDoc(storeRef, {
                userId: seller.id,
                storeName: seller.verificationData.legalBusinessName || 'SOMA Supplier',
                status: 'Live',
                createdAt: new Date().toISOString(),
                theme: 'Minimalist',
                currency: 'USD'
            });
        }

        // 2. Trigger the official Welcome to SOMA email
        await sendWelcomeEmail({
          to: seller.email,
          storeName: seller.verificationData.legalBusinessName || 'Your SOMA Store',
        });

        toast({
          title: 'Seller Approved',
          description: `${seller.verificationData.legalBusinessName} is now live and notified.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Seller Rejected',
          description: 'The application has been rejected.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const isLoading = profileLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Verification Queue</h1>
        </div>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Pending Supplier Applications</CardTitle>
          <CardDescription>
            Verify business credentials before granting full Master Catalog access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingSellers || pendingSellers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-primary/20 rounded-lg">
              <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold font-headline text-primary">All Clear</h3>
              <p className="text-muted-foreground mt-2">No pending applications at this time.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Documents</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-bold">
                      {seller.verificationData?.legalBusinessName || 'N/A'}
                      <div className="text-xs text-muted-foreground font-normal">{seller.email}</div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate" title={seller.verificationData?.warehouseAddress}>
                            {seller.verificationData?.structuredAddress 
                                ? `${seller.verificationData.structuredAddress.city}, ${seller.verificationData.structuredAddress.country}`
                                : seller.verificationData?.warehouseAddress || 'N/A'
                            }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">
                      {seller.verificationData?.contactPhone || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      {seller.verificationData?.governmentIdUrl ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={seller.verificationData.governmentIdUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-4 w-4" /> View ID
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-destructive">No ID</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {processingId === seller.id ? (
                        <Loader2 className="animate-spin ml-auto h-6 w-6" />
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700" 
                            onClick={() => handleDecision(seller, 'approved')}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDecision(seller, 'rejected')}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
