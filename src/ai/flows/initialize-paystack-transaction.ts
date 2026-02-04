'use server';

/**
 * @fileOverview Initializes a Paystack transaction.
 * Supports both recurring subscriptions (via Plan Codes) and one-time payments.
 * Optimized for strict integer 'amount' handling to prevent API errors.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { convertToCents } from '@/lib/currency';

// Base prices for fallback/one-time calculations
const basePrices: Record<string, number> = {
    MERCHANT: 19.99,
    SCALER: 29.00,
    SELLER: 0,
    ENTERPRISE: 33.33,
    BRAND: 21.00,
};

/**
 * Retrieves the Paystack Plan Code from environment variables.
 * Format: PAYSTACK_TIER_INTERVAL_PLAN_CODE (e.g., PAYSTACK_SCALER_MONTHLY_PLAN_CODE)
 */
function getPlanCode(tier: string, interval: string): string | undefined {
    const key = `PAYSTACK_${tier}_${interval.toUpperCase()}_PLAN_CODE`;
    return process.env[key];
}

const SignupPaymentSchema = z.object({
    type: z.literal('signup'),
    planTier: z.enum(['MERCHANT', 'SCALER', 'SELLER', 'ENTERPRISE', 'BRAND']),
    interval: z.enum(['monthly', 'yearly', 'free', 'lifetime']),
});

const CartPaymentSchema = z.object({
    type: z.literal('cart'),
    amountInUSD: z.number().min(1, "Cart total must be at least $1.00."),
});

const InitializePaystackTransactionInputSchema = z.object({
  email: z.string().email().describe('The email of the customer.'),
  payment: z.union([SignupPaymentSchema, CartPaymentSchema]),
  metadata: z.any().optional().describe('Extra data to pass to Paystack.'),
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

    // Initialize clean payload
    const finalPayload: any = {
        email: input.email,
        metadata: {
            ...input.metadata,
            payment_type: input.payment.type
        },
    };

    /**
     * LOGIC GATE: 
     * 1. Subscriptions (signup): Use 'plan' code if available for recurring billing.
     * 2. One-time (cart/no-plan): Use validated integer 'amount'.
     */
    if (input.payment.type === 'signup') {
        const { planTier, interval } = input.payment;
        
        if (planTier === 'SELLER' && interval === 'free') {
            throw new Error("Free plans do not require payment initialization.");
        }

        const planCode = getPlanCode(planTier, interval);

        if (planCode) {
            console.log(`DEBUG: Initializing RECURRING plan: ${planCode}`);
            finalPayload.plan = planCode;
            // IMPORTANT: For plans, we do NOT send 'amount'. Paystack uses the plan's defined price.
        } else {
            console.log(`DEBUG: No Plan Code found for ${planTier}. Falling back to ONE-TIME charge.`);
            const basePrice = basePrices[planTier] || 0;
            const dollarAmount = interval === 'yearly' ? basePrice * 10 : basePrice;
            
            // convertToCents guarantees a strict integer Number
            finalPayload.amount = convertToCents(dollarAmount);
            finalPayload.currency = 'USD';
        }
    } else {
        // Cart transactions are always one-time validated charges
        finalPayload.amount = convertToCents(input.payment.amountInUSD);
        finalPayload.currency = 'USD';
    }

    console.log('DEBUG: Final Payload to Paystack:', JSON.stringify(finalPayload));

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
      console.error('PAYSTACK API ERROR:', responseData);
      throw new Error(`Paystack API Error: ${responseData.message || 'Unknown error'}`);
    }

    if (!responseData.status || !responseData.data) {
        throw new Error('Transaction initialization failed on Paystack.');
    }

    return responseData.data;
  }
);
