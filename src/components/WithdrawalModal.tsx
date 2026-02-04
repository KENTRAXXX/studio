'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendPayoutConfirmationEmail } from '@/ai/flows/send-payout-confirmation-email';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Landmark, Loader2, Send, Lock } from 'lucide-react';
import { Separator } from './ui/separator';

const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be greater than zero.' }),
  accountName: z.string().min(2, { message: 'Account name is required.' }),
  accountNumber: z.string().min(5, { message: 'A valid account number is required.' }),
  bankName: z.string().min(3, { message: 'Bank name is required.' }),
  iban: z.string().optional(),
  swiftBic: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type UserProfile = {
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    iban?: string;
    swiftBic?: string;
  }
} | null;

interface WithdrawalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  userProfile: UserProfile;
}

export function WithdrawalModal({ isOpen, onOpenChange, availableBalance, userProfile }: WithdrawalModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasExistingDetails = !!userProfile?.bankDetails?.accountNumber;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      amount: 0,
      accountName: '',
      accountNumber: '',
      bankName: '',
      iban: '',
      swiftBic: '',
    },
  });

  useEffect(() => {
    if (isOpen && hasExistingDetails && userProfile?.bankDetails) {
        form.reset({
            amount: 0,
            accountName: userProfile.bankDetails.accountName,
            accountNumber: userProfile.bankDetails.accountNumber,
            bankName: userProfile.bankDetails.bankName,
            iban: userProfile.bankDetails.iban || '',
            swiftBic: userProfile.bankDetails.swiftBic || '',
        });
    } else if (isOpen) {
        form.reset({ amount: 0, accountName: '', accountNumber: '', bankName: '', iban: '', swiftBic: '' });
    }
  }, [isOpen, hasExistingDetails, userProfile, form]);

  const watchedAmount = form.watch('amount');
  const requestedAmount = typeof watchedAmount === 'number' ? watchedAmount : (parseFloat(watchedAmount) || 0);
  const withdrawalFee = requestedAmount * 0.03;
  const totalDeduction = requestedAmount + withdrawalFee;
  const isAmountInvalid = totalDeduction > availableBalance;

  const handleSubmit = async (data: FormValues) => {
    if (!user || !firestore || !user.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to make a request.' });
      return;
    }

    if (isAmountInvalid) {
        toast({ variant: 'destructive', title: 'Error', description: 'Requested amount plus fee exceeds available balance.' });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const isFirstTime = !hasExistingDetails;
      let status: 'pending' | 'awaiting-confirmation' = 'pending';
      let confirmationToken: string | null = null;
      
      if (isFirstTime) {
          status = 'awaiting-confirmation';
          confirmationToken = crypto.randomUUID();
      }

      const withdrawalRef = collection(firestore, 'withdrawal_requests');
      const newDocRef = await addDoc(withdrawalRef, {
        userId: user.uid,
        amount: data.amount,
        bankDetails: {
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          bankName: data.bankName,
          iban: data.iban,
          swiftBic: data.swiftBic,
        },
        status: status,
        confirmationToken: confirmationToken,
        createdAt: serverTimestamp(),
      });

      if (isFirstTime && confirmationToken) {
          await sendPayoutConfirmationEmail({
              to: user.email,
              name: data.accountName,
              amount: data.amount,
              withdrawalId: newDocRef.id,
              token: confirmationToken
          });
          toast({
              title: 'Confirmation Required',
              description: `We've sent a confirmation link to your email. Please click it to approve this payout request.`,
              duration: 10000,
          });
      } else {
         toast({
            title: 'Request Submitted',
            description: `Your request to withdraw $${data.amount.toFixed(2)} is pending review.`,
          });
      }

      onOpenChange(false);
      form.reset();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary sm:max-w-[425px] md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-headline">
            <Landmark className="h-6 w-6" />
            Request a Withdrawal
          </DialogTitle>
          <DialogDescription>
             Payouts are made via direct bank transfer only.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
             <div className="text-center p-3 rounded-md bg-muted/50">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">${availableBalance.toFixed(2)}</p>
            </div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Withdraw ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 rounded-lg border border-border/50 p-4">
                 <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Withdrawal Fee (3%)</span>
                    <span>${withdrawalFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                    <span>Total Deduction</span>
                    <span>${totalDeduction.toFixed(2)}</span>
                </div>
                 {isAmountInvalid && <p className="text-sm font-medium text-destructive pt-2">Insufficient funds for this withdrawal amount.</p>}
            </div>
            
            <Separator className="pt-4"/>
            <h3 className="font-semibold text-primary">Receiving Account Details</h3>
            
            {hasExistingDetails && userProfile?.bankDetails ? (
                <div className="space-y-3 rounded-lg border border-border/50 p-4 bg-muted/50">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-foreground">Verified Payout Account</h4>
                        <Lock className="h-4 w-4 text-primary"/>
                    </div>
                    <div className="text-sm">
                        <p><span className="font-medium text-muted-foreground">Bank:</span> {userProfile.bankDetails.bankName}</p>
                        <p><span className="font-medium text-muted-foreground">Account:</span> ****{userProfile.bankDetails.accountNumber.slice(-4)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        To protect your security, payout details are locked after the first withdrawal. Please contact support to change your bank account.
                    </p>
                </div>
            ) : (
                <>
                    <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                            <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Global Bank Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                            <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                            <Input placeholder="International Bank Account Number" {...field} />
                        </FormControl>
                        <FormDescription>Required for some regions.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="swiftBic"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>SWIFT / BIC Code</FormLabel>
                        <FormControl>
                            <Input placeholder="Bank's SWIFT/BIC code" {...field} />
                        </FormControl>
                        <FormDescription>Required for most international transfers.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </>
            )}

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting || isAmountInvalid || requestedAmount <= 0} className="w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}