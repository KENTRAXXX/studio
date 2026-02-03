'use server';

/**
 * @fileOverview Initializes a Paystack transaction.
 * Supports both recurring subscriptions (via Plan Codes) and one-time payments.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { convertToCents } from '@/lib/currency';

// Base prices for fallback calculations
const basePrices: Record<string, number> = {
    MERCHANT: 19.99,
    SCALER: 29.00,
    SELLER: 0,
    ENTERPRISE: 33.33,
    BRAND: 21.00,
};

/**
 * Retrieves the Paystack Plan Code from environment variables.
 * These must be created in the Paystack Dashboard first.
 */
function getPlanCode(tier: string, interval: string): string | undefined {
    const key = `PAYSTACK_${tier}_${interval.toUpperCase()}_PLAN_CODE`;
    return process.env[key];
}

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

    // Start with a clean base payload
    const finalPayload: any = {
        email: input.email,
        metadata: {
            ...input.metadata,
            payment_type: input.payment.type
        },
    };

    /**
     * LOGIC GATE: 
     * 1. If it's a signup and a Plan Code exists, send ONLY the plan (RECURRING).
     * 2. Otherwise, send ONLY the amount and currency (ONE-TIME).
     * Sending both often triggers the "Invalid Amount Sent" error.
     */
    if (input.payment.type === 'signup') {
        const { planTier, interval } = input.payment;
        
        if (planTier === 'SELLER' && interval === 'free') {
            throw new Error("Free plans do not require payment initialization.");
        }

        const planCode = getPlanCode(planTier, interval);

        if (planCode) {
            console.log(`DEBUG: Using Recurring Plan Code: ${planCode}`);
            finalPayload.plan = planCode;
            // Note: We do NOT send 'amount' here. Paystack uses the plan's defined price.
        } else {
            console.log(`DEBUG: No Plan Code found for ${planTier} ${interval}. Falling back to one-time charge.`);
            const basePrice = basePrices[planTier] || 0;
            const dollarAmount = interval === 'yearly' ? basePrice * 10 : basePrice;
            
            finalPayload.amount = convertToCents(dollarAmount);
            finalPayload.currency = 'USD';
        }
    } else {
        // Cart transactions are always one-time
        finalPayload.amount = convertToCents(input.payment.amountInUSD);
        finalPayload.currency = 'USD';
    }

    console.log('DEBUG: Final Payload to Paystack:', JSON.stringify(finalPayload, null, 2));

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
      console.error('PAYSTACK API ERROR:', JSON.stringify(responseData, null, 2));
      throw new Error(`Paystack API Error: ${responseData.message || 'Unknown error'}`);
    }

    if (!responseData.status || !responseData.data) {
        throw new Error('Transaction initialization failed on Paystack.');
    }

    return responseData.data;
  }
);
