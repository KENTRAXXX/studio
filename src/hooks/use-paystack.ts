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
   * Note: This is an async function that returns when the popup is launched, 
   * not when the payment completes.
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
      const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (!paystackPublicKey) {
        throw new Error('Paystack public key is not configured in environment.');
      }

      // 1. Initialize the transaction on the backend to get a secure access_code
      // This step ensures the secret key is never exposed to the client.
      const result = await initializePaystackTransaction({
        email: args.email,
        payment: args.payment,
        metadata: args.metadata,
      });

      if (!result.access_code) {
          throw new Error('Failed to retrieve access code from Paystack initialization.');
      }

      // 2. Dynamically import PaystackPop to ensure it only runs in the browser environment
      const PaystackModule = await import('@paystack/inline-js');
      const PaystackPop = PaystackModule.default;
      
      // @ts-ignore - Paystack SDK types can be inconsistent
      const paystack = new PaystackPop();
      
      // 3. Launch the secure Paystack checkout modal
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
      // Re-throw to allow parent components to catch failures
      throw error;
    } finally {
        setIsInitializing(false);
    }
  };

  return { initializePayment, isInitializing };
}
