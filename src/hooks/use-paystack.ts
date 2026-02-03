'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { initializePaystackTransaction, type InitializePaystackTransactionInput } from '@/ai/flows/initialize-paystack-transaction';

type InitializePaymentArgs = Omit<InitializePaystackTransactionInput, 'metadata'> & {
    metadata?: InitializePaystackTransactionInput['metadata'];
}

export function usePaystack() {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);

  const initializePayment = async (
    args: InitializePaymentArgs,
    onSuccess: (reference: any) => void,
    onClose: () => void
  ) => {
    if (!args.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email is required to proceed.' });
      return;
    }
    
    // For free plans, don't call paystack
    if (args.payment.type === 'signup' && args.payment.interval === 'free') {
        onSuccess({ trxref: `free-signup-${Date.now()}`});
        return;
    }
    
    setIsInitializing(true);
    
    try {
      const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!paystackPublicKey) {
        throw new Error('Paystack public key is not configured.');
      }

      // 1. Initialize the transaction on the backend to get a secure access_code
      const result = await initializePaystackTransaction({
        email: args.email,
        payment: args.payment,
        metadata: args.metadata,
      });

      // 2. Dynamically import PaystackPop to ensure it only runs in the browser
      const PaystackModule = await import('@paystack/inline-js');
      const PaystackPop = PaystackModule.default;
      const paystack = new PaystackPop();
      
      paystack.resumeTransaction(result.access_code, {
        onSuccess: (response: any) => {
          onSuccess(response);
        },
        onCancel: () => {
          onClose();
        },
      });

    } catch (error: any) {
      console.error("Paystack initialization failed", error);
      toast({ 
        variant: 'destructive', 
        title: 'Payment Error', 
        description: error.message || 'Could not initialize payment. Please try again.' 
      });
      onClose();
    } finally {
        setIsInitializing(false);
    }
  };

  return { initializePayment, isInitializing };
}
