'use client';

import { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useToast } from '@/hooks/use-toast';
import { initializePaystackTransaction } from '@/ai/flows/initialize-paystack-transaction';

type PaystackMetadata = {
  [key: string]: any;
};

type PaystackConfig = {
  publicKey: string;
  reference: string;
  email: string;
  amount: number;
  metadata?: PaystackMetadata;
};

type InitializePaymentArgs = {
  email: string;
  amount: number;
  metadata?: PaystackMetadata;
};

export function usePaystack() {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  const [config, setConfig] = useState<PaystackConfig | null>(null);

  const onSuccessDefault = (reference: any) => {
    console.log('Payment successful', reference);
    toast({
      title: 'Payment Successful!',
      description: 'Your payment was completed.',
    });
  };

  const onCloseDefault = () => {
    console.log('Payment popup closed.');
    toast({
      variant: 'default',
      title: 'Payment Canceled',
      description: 'The payment process was not completed.',
    });
  };

  const initializePayment = async (
    { email, amount, metadata }: InitializePaymentArgs,
    onSuccess: (reference: any) => void = onSuccessDefault,
    onClose: () => void = onCloseDefault
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
        amount, // in kobo/cents
        metadata,
      });
      
      const newConfig: PaystackConfig = {
        reference: result.reference,
        email: email,
        amount: amount,
        publicKey: paystackPublicKey,
        metadata,
      };

      // The usePaystackPayment hook needs to be called conditionally,
      // so we manage its config via state and trigger it in a component.
      setConfig(newConfig);
      
      // We pass the callbacks to the PaystackPopup component
      // which will be rendered when config is set.
      return { config: newConfig, onSuccess, onClose };

    } catch (error: any) {
      console.error("Paystack initialization failed", error);
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message || 'Could not initialize payment. Please try again.' });
      setIsInitializing(false);
    }
  };

  // This component handles the actual Paystack popup
  const PaystackPopup = () => {
    const initializePaystack = usePaystackPayment(config as PaystackConfig);

    React.useEffect(() => {
      if (config) {
        const { onSuccess, onClose } = config.metadata?.callbacks || {};
        initializePaystack(onSuccess, onClose);
        // Reset config after initialization to prevent re-triggering
        setConfig(null); 
        setIsInitializing(false);
      }
    }, [config, initializePaystack]);

    return null;
  };
  
  // A wrapper to use for dynamically triggering the payment
  const DynamicPaystackButton = ({ onPaymentInit }: { onPaymentInit: () => Promise<{config: PaystackConfig, onSuccess: (ref: any) => void, onClose: () => void} | undefined> }) => {
    const [popupCallbacks, setPopupCallbacks] = useState<any>(null);
    
    const handleClick = async () => {
      const result = await onPaymentInit();
      if (result) {
        setConfig({
            ...result.config,
            metadata: {
                ...result.config.metadata,
                callbacks: { onSuccess: result.onSuccess, onClose: result.onClose }
            }
        });
      }
    };

    return (
      <>
        <Button onClick={handleClick} disabled={isInitializing}>
          {isInitializing ? <Loader2 className="animate-spin" /> : 'Pay Now'}
        </Button>
        {config && <PaystackPopup />}
      </>
    );
  };


  return { initializePayment, isInitializing };
}
