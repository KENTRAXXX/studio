'use server';

/**
 * @fileOverview A simplified flow for initializing a Paystack transaction using direct amounts.
 * This version removes plan codes to isolate and debug the "Invalid Amount Sent" error.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { convertToCents } from '@/lib/currency';

// Dollar-based prices for direct testing.
const basePrices: Record<string, number> = {
    MERCHANT: 19.99,
    SCALER: 29.00,
    SELLER: 0,
    ENTERPRISE: 33.33,
    BRAND: 21.00,
};

const SignupPaymentSchema = z.object({
    type: z.literal('signup'),
    planTier: z.enum(['MERCHANT', 'SCALER', 'SELLER', 'ENTERPRISE', 'BRAND']),
    interval: z.enum(['monthly', 'yearly', 'free']),
});

const CartPaymentSchema = z.object({
    type: z.literal('cart'),
    amountInUSD: z.number().min(1, "Cart total must be at least $1.00."),
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

    let finalAmountCents: number;

    // Direct path: Calculate the amount in cents regardless of the type
    if (input.payment.type === 'signup') {
        const { planTier, interval } = input.payment;
        const basePrice = basePrices[planTier] || 0;
        
        if (basePrice === 0) {
            throw new Error("Free plans do not require payment initialization.");
        }

        // Simple yearly logic: 10 months for the price of 12 (approx)
        const dollarAmount = interval === 'yearly' ? basePrice * 10 : basePrice;
        finalAmountCents = convertToCents(dollarAmount);
    } else {
        finalAmountCents = convertToCents(input.payment.amountInUSD);
    }

    // Double check that it's a strict integer
    if (!Number.isInteger(finalAmountCents)) {
        console.error('CRITICAL: finalAmountCents is not an integer:', finalAmountCents);
        finalAmountCents = Math.floor(finalAmountCents);
    }

    // Build a CLEAN payload with NO conflicting 'plan' field
    const finalPayload = {
        email: input.email,
        amount: finalAmountCents, // Must be an Integer
        currency: 'USD',
        metadata: {
            ...input.metadata,
            // Ensure we track the type internally
            payment_type: input.payment.type
        },
    };

    console.log('DEBUG: Initializing Paystack Transaction...');
    console.log('DEBUG: URL: https://api.paystack.co/transaction/initialize');
    console.log('DEBUG: Payload:', JSON.stringify(finalPayload, null, 2));

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('PAYSTACK API ERROR STATUS:', response.status);
      console.error('PAYSTACK API ERROR BODY:', JSON.stringify(responseData, null, 2));
      throw new Error(`Paystack API Error: ${responseData.message || 'Unknown error'}`);
    }

    if (!responseData.status || !responseData.data) {
        console.error('PAYSTACK API SUCCESS LOGIC FAIL:', responseData);
        throw new Error(`Paystack API Error: ${responseData.message || 'Transaction initialization failed'}`);
    }

    console.log('DEBUG: Paystack Initialization Successful.');
    return responseData.data;
  }
);
