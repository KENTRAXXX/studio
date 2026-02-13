'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUserProfile, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Check, X, FileText, MapPin, MessageSquareText, Users, ShoppingBag, Globe, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sendWelcomeEmail } from '@/ai/flows/send-welcome-email';
import { sendActionRequiredEmail } from '@/ai/flows/send-action-required-email';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type PendingUser = {
  id: string;
  email: string;
  userRole: 'SELLER' | 'AMBASSADOR' | 'MOGUL';
  status: 'pending_review' | 'approved' | 'rejected' | 'action_required';
  verificationFeedback?: string;
  verificationData?: {
    legalBusinessName: string;
    warehouseAddress: string;
    governmentIdUrl: string;
    contactPhone: string;
    structuredAddress?: {
        city: string;
        country: string;
    };
  };
  ambassadorData?: {
    socialHandle: string;
    targetAudience: string;
    governmentIdUrl: string;
    payoutDetails: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
    };
  };
};

const RequestChangesModal = ({ user, onComplete }: { user: PendingUser, onComplete: () => void }) => {
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleRequest = async () => {
        if (!firestore || !feedback.trim()) return;
        setIsSubmitting(true);
        try {
            const userRef = doc(firestore, 'users', user.id);
            await updateDoc(userRef, {
                status: 'action_required',
                verificationFeedback: feedback.trim()
            });

            await sendActionRequiredEmail({
                to: user.email,
                name: user.verificationData?.legalBusinessName || user.email.split('@')[0],
                feedback: feedback.trim()
            });

            toast({ title: 'Feedback Sent', description: 'Partner has been notified to make changes.' });
            onComplete();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                    <MessageSquareText className="h-4 w-4 mr-1" /> Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-primary">
                <DialogHeader>
                    <DialogTitle className="text-primary font-headline">Action Required</DialogTitle>
                    <DialogDescription>
                        Explain to the {user.userRole.toLowerCase()} what needs to be corrected.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="feedback">Message to Partner</Label>
                        <Textarea 
                            id="feedback" 
                            placeholder="e.g. ID is blurry, please re-upload..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleRequest} disabled={!feedback.trim() || isSubmitting} className="w-full btn-gold-glow bg-primary">
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send Feedback'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
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

  const pendingUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('status', '==', 'pending_review'));
  }, [firestore]);
  
  const { data: pendingUsers, loading: usersLoading } = useCollection<PendingUser>(pendingUsersQuery);

  const handleDecision = async (targetUser: PendingUser, decision: 'approved' | 'rejected') => {
    if (!firestore) return;
    setProcessingId(targetUser.id);

    try {
      const userRef = doc(firestore, 'users', targetUser.id);
      await updateDoc(userRef, { status: decision });

      if (decision === 'approved' && targetUser.userRole !== 'AMBASSADOR') {
        // Provision store only for Suppliers/Merchants
        const storeRef = doc(firestore, 'stores', targetUser.id);
        const storeSnap = await getDoc(storeRef);
        if (!storeSnap.exists()) {
            await setDoc(storeRef, {
                userId: targetUser.id,
                storeName: targetUser.verificationData?.legalBusinessName || 'SOMA Supplier',
                status: 'Live',
                createdAt: new Date().toISOString(),
                theme: 'Minimalist',
                currency: 'USD'
            });
        }

        await sendWelcomeEmail({
          to: targetUser.email,
          storeName: targetUser.verificationData?.legalBusinessName || 'Your SOMA Store',
        });
      }

      toast({
        title: `${targetUser.userRole} ${decision === 'approved' ? 'Verified' : 'Rejected'}`,
        description: `Credentials processed for ${targetUser.email}.`,
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Action Failed', description: error.message });
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
          <h1 className="text-3xl font-bold font-headline">Executive Vetting Queue</h1>
        </div>
      </div>

      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>Pending Partner Applications</CardTitle>
          <CardDescription>
            Audit credentials for Suppliers and Ambassadors before granting platform access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pendingUsers || pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-primary/20 rounded-lg">
              <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold font-headline text-primary">Queue Cleared</h3>
              <p className="text-muted-foreground mt-2">All identities verified and synchronized.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role & Identity</TableHead>
                  <TableHead>Vetting Details</TableHead>
                  <TableHead>Account/KYC</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((pUser) => {
                  const isAmbassador = pUser.userRole === 'AMBASSADOR';
                  const idUrl = isAmbassador ? pUser.ambassadorData?.governmentIdUrl : pUser.verificationData?.governmentIdUrl;

                  return (
                    <TableRow key={pUser.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                            <Badge className={cn(
                                "w-fit text-[10px] font-black uppercase tracking-widest h-5",
                                isAmbassador ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-primary/20 text-primary border-primary/50"
                            )}>
                                {pUser.userRole}
                            </Badge>
                            <span className="font-bold text-slate-200">{pUser.email}</span>
                            <code className="text-[9px] text-muted-foreground font-mono">UID: {pUser.id.slice(0, 8)}</code>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {isAmbassador ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                    <Share2 className="h-3 w-3 text-primary" /> {pUser.ambassadorData?.socialHandle || 'Private Profile'}
                                </div>
                                <p className="text-[10px] text-muted-foreground italic line-clamp-2">
                                    "Target: {pUser.ambassadorData?.targetAudience || 'General Luxury'}"
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                    <ShoppingBag className="h-3 w-3 text-primary" /> {pUser.verificationData?.legalBusinessName || 'N/A'}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <MapPin className="h-3 w-3" /> 
                                    <span className="truncate">{pUser.verificationData?.warehouseAddress || 'No Address'}</span>
                                </div>
                            </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                            {idUrl ? (
                                <Button variant="outline" size="sm" asChild className="h-7 text-[10px] border-primary/20">
                                    <a href={idUrl} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-1 h-3 w-3" /> Inspect KYC
                                    </a>
                                </Button>
                            ) : (
                                <Badge variant="destructive" className="text-[9px] h-5">NO IDENTITY ASSET</Badge>
                            )}
                            {isAmbassador && (
                                <div className="text-[9px] font-mono text-muted-foreground uppercase">
                                    {pUser.ambassadorData?.payoutDetails.bankName} • ****{pUser.ambassadorData?.payoutDetails.accountNumber.slice(-4)}
                                </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {processingId === pUser.id ? (
                          <Loader2 className="animate-spin ml-auto h-6 w-6 text-primary" />
                        ) : (
                          <>
                            <RequestChangesModal user={pUser} onComplete={() => {}} />
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 h-8" 
                              onClick={() => handleDecision(pUser, 'approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="h-8"
                              onClick={() => handleDecision(pUser, 'rejected')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}