'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { initializePaystackTransaction } from '@/ai/flows/initialize-paystack-transaction';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

type PaystackMetadata = {
  [key: string]: any;
};

type InitializePaymentArgs = {
  email: string;
  amount: number;
  metadata?: PaystackMetadata;
};

export function usePaystack() {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);

  const initializePayment = async (
    { email, amount, metadata }: InitializePaymentArgs,
    onSuccess: (reference: any) => void,
    onClose: () => void
  ) => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email is required to proceed.' });
      return;
    }
    
    setIsInitializing(true);
    
    try {
      const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!paystackPublicKey) {
        throw new Error('Paystack public key is not configured.');
      }

      const result = await initializePaystackTransaction({
        email,
        amount,
        metadata,
      });

      const handler = window.PaystackPop.setup({
        key: paystackPublicKey,
        email: email,
        amount: amount,
        ref: result.reference,
        metadata: metadata,
        onClose: () => {
          onClose();
        },
        callback: (response: any) => {
          onSuccess(response);
        },
      });
      
      handler.openIframe();

    } catch (error: any) {
      console.error("Paystack initialization failed", error);
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Could not initialize payment. Please try again.' });
    } finally {
        setIsInitializing(false);
    }
  };

  return { initializePayment, isInitializing };
}
