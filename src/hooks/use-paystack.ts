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

      const result = await initializePaystackTransaction({
        email: args.email,
        payment: args.payment,
        metadata: args.metadata,
      });

      if (!result.access_code) {
          throw new Error('Failed to retrieve access code.');
      }

      const PaystackModule = await import('@paystack/inline-js');
      const PaystackPop = PaystackModule.default;
      
      // @ts-ignore
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
      console.error("Paystack Initialization Error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Payment Gateway Error', 
        description: error.message || 'Could not connect to Paystack.' 
      });
      onClose();
      throw error;
    } finally {
        setIsInitializing(false);
    }
  };

  return { initializePayment, isInitializing };
}
