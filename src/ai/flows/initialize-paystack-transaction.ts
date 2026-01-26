'use server';

/**
 * @fileOverview A flow for initializing a Paystack transaction.
 *
 * - initializePaystackTransaction - A function that returns a Paystack authorization URL.
 * - InitializePaystackTransactionInput - The input type for the initializePaystackTransaction function.
 * - InitializePaystackTransactionOutput - The return type for the initializePaystackTransaction function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Server-side source of truth for plan details
const plansConfig: { [key: string]: { pricing: any } } = {
    MERCHANT: { pricing: {
        monthly: { amount: 1999, planCode: process.env.NEXT_PUBLIC_MERCHANT_MONTHLY_PLAN_CODE },
        yearly: { amount: 19900, planCode: process.env.NEXT_PUBLIC_MERCHANT_YEARLY_PLAN_CODE },
    }},
    SCALER: { pricing: {
        monthly: { amount: 2900, planCode: process.env.NEXT_PUBLIC_SCALER_MONTHLY_PLAN_CODE },
        yearly: { amount: 29000, planCode: process.env.NEXT_PUBLIC_SCALER_YEARLY_PLAN_CODE },
    }},
    SELLER: { pricing: {
        free: { amount: 0, planCode: null }
    }},
    ENTERPRISE: { pricing: {
        monthly: { amount: 3333, planCode: process.env.NEXT_PUBLIC_ENTERPRISE_MONTHLY_PLAN_CODE },
        yearly: { amount: 33300, planCode: process.env.NEXT_PUBLIC_ENTERPRISE_YEARLY_PLAN_CODE },
    }},
    BRAND: { pricing: {
        monthly: { amount: 2100, planCode: process.env.NEXT_PUBLIC_BRAND_MONTHLY_PLAN_CODE },
        yearly: { amount: 21000, planCode: process.env.NEXT_PUBLIC_BRAND_YEARLY_PLAN_CODE },
    }},
};


const SignupPaymentSchema = z.object({
    type: z.literal('signup'),
    planTier: z.enum(['MERCHANT', 'SCALER', 'SELLER', 'ENTERPRISE', 'BRAND']),
    interval: z.enum(['monthly', 'yearly', 'free']),
});

const CartPaymentSchema = z.object({
    type: z.literal('cart'),
    amountInCents: z.number().int().min(100, "Cart total must be at least $1.00."),
});

const InitializePaystackTransactionInputSchema = z.object({
  email: z.string().email().describe('The email of the customer.'),
  payment: z.union([SignupPaymentSchema, CartPaymentSchema]),
  metadata: z.any().optional().describe('An object containing any extra data you want to pass to Paystack.'),
});
export type InitializePaystackTransactionInput = z.infer<typeof InitializePaystackTransactionInputSchema>;

const InitializePaystackTransactionOutputSchema = z.object({
  authorization_url: z.string().url(),
  access_code: z.string(),
  reference: z.string(),
});
export type InitializePaystackTransactionOutput = z.infer<typeof InitializePaystackTransactionOutputSchema>;

export async function initializePaystackTransaction(
  input: InitializePaystackTransactionInput
): Promise<InitializePaystackTransactionOutput> {
  return initializePaystackTransactionFlow(input);
}

const initializePaystackTransactionFlow = ai.defineFlow(
  {
    name: 'initializePaystackTransactionFlow',
    inputSchema: InitializePaystackTransactionInputSchema,
    outputSchema: InitializePaystackTransactionOutputSchema,
  },
  async (input) => {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key is not configured.');
    }

    const body: Record<string, any> = {
        email: input.email,
        metadata: input.metadata,
    };
    
    let isSubscription = false;
    let amountInCents = 0;

    if (input.payment.type === 'signup') {
        const { planTier, interval } = input.payment;
        const planDetails = plansConfig[planTier]?.pricing[interval];

        if (!planDetails) {
            throw new Error(`Invalid plan specified: ${planTier} - ${interval}`);
        }
        
        amountInCents = planDetails.amount;
        
        // Use plan code only if it's a valid subscription plan
        if (planDetails.planCode && planDetails.planCode.trim() !== '') {
            isSubscription = true;
            body.plan = planDetails.planCode;
        }

    } else if (input.payment.type === 'cart') {
        amountInCents = input.payment.amountInCents;
    }

    // If it's not a subscription, it's a one-time payment. Add amount and currency.
    if (!isSubscription) {
        // For free signups, amount is 0. This case should be handled client-side.
        if (amountInCents === 0) {
            throw new Error("Free plans do not require payment initialization.");
        }
        
        // Ensure the amount is a rounded integer before validation and sending
        const finalAmount = Math.round(amountInCents);

        // Paystack has a minimum transaction amount for USD, typically $1.00 (100 cents).
        if (finalAmount < 100) {
           throw new Error('Invalid Amount Sent. Amount must be at least $1.00.');
        }

        body.amount = finalAmount;
        body.currency = 'USD';
    }


    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Paystack API Error:', errorBody);
      throw new Error(`Paystack API Error: ${errorBody.message}`);
    }

    const data = await response.json();

    if (!data.status) {
        console.error('Paystack API Error:', data);
        throw new Error(`Paystack API Error: ${data.message}`);
    }

    return data.data;
  }
);
