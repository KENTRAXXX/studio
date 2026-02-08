'use client';
export const runtime = 'edge';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '../layout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CreditCard, Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import SomaLogo from '@/components/logo';
import { usePaystack } from '@/hooks/use-paystack';
import { useToast } from '@/hooks/use-toast';

const addressSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  street: z.string().min(3, { message: 'Street address is required.' }),
  city: z.string().min(2, { message: 'City is required.' }),
  state: z.string().min(2, { message: 'State / Province is required.' }),
  zip: z.string().min(4, { message: 'ZIP / Postal code is required.' }),
  country: z.string().min(2, { message: 'Country is required.' }),
});


type AddressFormValues = z.infer<typeof addressSchema>;


const InformationStep = ({ onNext, setCheckoutData }: { onNext: () => void, setCheckoutData: (data: Partial<AddressFormValues>) => void }) => {
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    mode: 'onBlur',
  });

  const onSubmit = (data: AddressFormValues) => {
    setCheckoutData(data);
    onNext();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-headline">Contact Information</CardTitle>
          </CardHeader>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <CardHeader className="p-0 pt-4">
            <CardTitle className="text-xl font-headline">Shipping Address</CardTitle>
          </CardHeader>
           <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          <FormField control={form.control} name="street" render={({ field }) => (
              <FormItem><FormLabel>Street Address</FormLabel><FormControl><Input placeholder="123 Luxury Lane" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Beverly Hills" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input placeholder="CA" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            <FormField control={form.control} name="zip" render={({ field }) => (
                <FormItem><FormLabel>ZIP / Postal</FormLabel><FormControl><Input placeholder="90210" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
          </div>
           <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="United States" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" className="h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
              Continue to Shipping
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
};

const ShippingStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const shippingPrice = 4.99;
  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
      <CardHeader className="p-0">
        <CardTitle className="text-xl font-headline">Shipping Method</CardTitle>
      </CardHeader>
      <div className="mt-6">
        <div className="border border-primary/50 rounded-lg p-4 flex justify-between items-center bg-card">
          <div>
            <p className="font-semibold">Standard Shipping</p>
            <p className="text-sm text-muted-foreground">Arrives in 5-7 business days</p>
          </div>
          <p className="font-bold text-primary">${shippingPrice.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex justify-between items-center pt-8">
        <Button variant="link" onClick={onBack}>&larr; Back to Information</Button>
        <Button onClick={onNext} size="lg" className="h-12 text-lg btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
          Continue to Payment
        </Button>
      </div>
    </motion.div>
  );
};


const PaymentStep = ({ onBack, site, checkoutData }: { onBack: () => void; site: string, checkoutData: Partial<AddressFormValues> }) => {
  const router = useRouter();
  const { cart, getCartTotal } = useCart();
  const { toast } = useToast();
  const { initializePayment, isInitializing } = usePaystack();

  const shippingPrice = 4.99;
  const subtotal = getCartTotal();
  const total = subtotal + shippingPrice;


  const handlePayment = async () => {
    if (!checkoutData.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Email is required to proceed.' });
      return;
    }
    
    await initializePayment(
      {
        email: checkoutData.email,
        payment: {
            type: 'cart',
            amountInUSD: total
        },
        metadata: {
          cart: cart.map(item => ({id: item.product.id, name: item.product.name, quantity: item.quantity})),
          shippingAddress: checkoutData,
          storeId: site
        }
      },
      (reference) => {
         const orderId = `SOMA-${reference.trxref.slice(-6).toUpperCase()}`;
         router.push(`/checkout/order-confirmation?orderId=${orderId}`);
      },
      () => {
        toast({ variant: 'default', title: 'Payment Canceled', description: 'Your payment was not completed.' });
      }
    );
  };

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <div className="space-y-6">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-headline">Payment</CardTitle>
            <p className="text-sm text-muted-foreground">All transactions are secure and encrypted.</p>
          </CardHeader>
          
          <div className="border border-primary/50 rounded-lg p-6 bg-card text-center">
            <p className="text-muted-foreground mb-4">Click "Pay Now" to complete your payment securely with Paystack.</p>
            <div className="text-3xl font-bold text-primary mb-6">
              Total: ${total.toFixed(2)}
            </div>
            <Button onClick={handlePayment} disabled={isInitializing} size="lg" className="h-12 text-lg w-full btn-gold-glow bg-primary hover:bg-primary/90 text-primary-foreground">
                {isInitializing ? <Loader2 className="animate-spin" /> : 'Pay Now'}
            </Button>
          </div>

          <div className="flex justify-between items-center pt-8">
            <Button variant="link" onClick={onBack}>&larr; Back to Shipping</Button>
          </div>
        </div>
    </motion.div>
  );
};


export default function CheckoutPage() {
  const params = useParams();
  const site = params.site as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [checkoutData, setCheckoutData] = useState<Partial<AddressFormValues>>({});
  const { cart, getCartTotal } = useCart();
  const shippingPrice = 4.99;
  const subtotal = getCartTotal();
  const total = subtotal + shippingPrice;

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 2));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const updateCheckoutData = (data: Partial<AddressFormValues>) => {
    setCheckoutData(prev => ({...prev, ...data}));
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm border-b border-primary/20">
            <div className="container mx-auto flex h-20 items-center justify-center px-4 sm:px-6 lg:px-8">
               <div className="flex items-center gap-2">
                 <SomaLogo className="h-8 w-8 text-primary" />
                 <span className="font-headline text-2xl font-bold text-primary">SOMA Checkout</span>
               </div>
            </div>
      </header>
    
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 py-12 px-4 sm:px-6 lg:px-8">
        <main>
          <div className="mt-12">
            <AnimatePresence mode="wait">
                {currentStep === 0 && <InformationStep onNext={handleNext} setCheckoutData={updateCheckoutData} />}
                {currentStep === 1 && <ShippingStep onNext={handleNext} onBack={handleBack} />}
                {currentStep === 2 && <PaymentStep onBack={handleBack} site={site} checkoutData={checkoutData} />}
            </AnimatePresence>
          </div>
        </main>
        <aside className="hidden lg:block bg-card p-8 rounded-lg border border-primary/20 h-fit sticky top-28">
            <h2 className="text-xl font-headline font-semibold">Order Summary</h2>
            <Separator className="my-4 bg-primary/20"/>
             <ul className="space-y-4">
                {cart.map(item => (
                    <li key={item.product.id} className="flex items-center gap-4 text-sm">
                        <span>{item.product.name} x {item.quantity}</span>
                        <span className="font-medium ml-auto">${((item.product.suggestedRetailPrice || item.product.price) * item.quantity).toFixed(2)}</span>
                    </li>
                ))}
            </ul>
             <Separator className="my-4 bg-primary/20"/>
            <div className="space-y-2">
                 <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="font-medium">${shippingPrice.toFixed(2)}</span>
                </div>
            </div>
            <Separator className="my-4 bg-primary/20"/>
            <div className="flex justify-between font-bold text-lg text-primary">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
            </div>
        </aside>
      </div>
    </>
  );
}
