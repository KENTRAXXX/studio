
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

  /**
   * Initializes a payment transaction and opens the Paystack inline popup.
   */
  const initializePayment = async (
    args: InitializePaymentArgs,
    onSuccess: (reference: any) => void,
    onClose: () => void
  ) => {
    if (!args.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email is required to proceed.' });
      return;
    }
    
    // For free plans, skip Paystack and return success immediately
    if (args.payment.type === 'signup' && args.payment.interval === 'free') {
        onSuccess({ trxref: `free-signup-${Date.now()}`});
        return;
    }
    
    setIsInitializing(true);
    
    try {
      // 1. Initialize the transaction on the backend to get a secure access_code
      const result = await initializePaystackTransaction({
        email: args.email,
        payment: args.payment,
        metadata: args.metadata,
      });

      if (!result.access_code) {
          throw new Error('Failed to retrieve access code from Paystack initialization.');
      }

      // 2. Dynamically import PaystackPop to ensure it only runs in the browser environment
      const PaystackModule: any = await import('@paystack/inline-js');
      // Handle both default and named exports for maximum compatibility
      const PaystackPop = PaystackModule.default || PaystackModule.PaystackPop;
      
      if (!PaystackPop) {
          throw new Error('Paystack SDK could not be loaded.');
      }

      const paystack = new PaystackPop();
      
      // 3. Launch the secure Paystack checkout modal using the access code
      paystack.resumeTransaction(result.access_code, {
        onSuccess: (response: any) => {
          onSuccess(response);
        },
        onCancel: () => {
          onClose();
        },
      });

    } catch (error: any) {
      console.error("Paystack Checkout Initialization Error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Payment Gateway Error', 
        description: error.message || 'Could not connect to the payment gateway. Please try again.' 
      });
      onClose();
      throw error;
    } finally {
        setIsInitializing(false);
    }
  };

  return { initializePayment, isInitializing };
}
