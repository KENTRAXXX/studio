'use server';

/**
 * @fileOverview Initializes a Paystack transaction.
 * Regular Server Action (Decoupled from Genkit to support Edge Runtime).
 */

import { convertToCents } from '@/lib/currency';
import { z } from 'zod';

const basePrices: Record<string, number> = {
    MERCHANT: 19.99,
    SCALER: 29.00,
    SELLER: 0,
    ENTERPRISE: 33.33,
    BRAND: 21.00,
};

/**
 * Resolves the plan code from environment variables.
 * Checks both PAYSTACK_ and NEXT_PUBLIC_ prefixes to ensure compatibility with Cloudflare secrets.
 * Aggressively cleans the input to handle hidden characters or copy-paste artifacts.
 */
function getPlanCode(tier: string, interval: string): string | undefined {
    const suffix = `${tier}_${interval.toUpperCase()}_PLAN_CODE`;
    const envKey = `PAYSTACK_${suffix}`;
    const publicEnvKey = `NEXT_PUBLIC_${suffix}`;
    
    const rawValue = process.env[envKey] || process.env[publicEnvKey];
    
    if (!rawValue || typeof rawValue !== 'string') {
        return undefined;
    }

    // REMOVE ALL WHITESPACE (including spaces in the middle, tabs, and newlines)
    // This handles cases where plan codes might have been copied with artifacts.
    const code = rawValue.replace(/\s+/g, '');
    
    // Strictly validate: must start with PLN_ and have a reasonable length.
    // Must not contain placeholder indicators like "..." or "YOUR_".
    if (
        code.startsWith('PLN_') && 
        code.length > 5 &&
        !code.includes('...') &&
        !code.includes('YOUR_')
    ) {
        return code;
    }
    
    return undefined;
}

const SignupPaymentSchema = z.object({
    type: z.literal('signup'),
    planTier: z.enum(['MERCHANT', 'SCALER', 'SELLER', 'ENTERPRISE', 'BRAND', 'ADMIN']),
    interval: z.enum(['monthly', 'yearly', 'free', 'lifetime']),
});

const CartPaymentSchema = z.object({
    type: z.literal('cart'),
    amountInUSD: z.number().min(1, "Cart total must be at least $1.00."),
});

const InitializePaystackTransactionInputSchema = z.object({
  email: z.string().email(),
  payment: z.union([SignupPaymentSchema, CartPaymentSchema]),
  metadata: z.any().optional(),
});

export type InitializePaystackTransactionInput = z.infer<typeof InitializePaystackTransactionInputSchema>;

export type InitializePaystackTransactionOutput = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

/**
 * Decoupled from Genkit to avoid pulling gRPC/Telemetry into the Edge Runtime bundle.
 */
export async function initializePaystackTransaction(
  input: InitializePaystackTransactionInput
): Promise<InitializePaystackTransactionOutput> {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key is not configured in environment variables.');
    }

    const finalPayload: any = {
        email: input.email,
        metadata: {
            ...input.metadata,
            payment_type: input.payment.type
        },
    };

    if (input.payment.type === 'signup') {
        const { planTier, interval } = input.payment;
        
        if ((planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN') {
            throw new Error("Free plans do not require payment initialization.");
        }

        const planCode = getPlanCode(planTier, interval);
        
        // Calculate the amount. 
        // Note: Paystack requires the amount even if a plan is provided for some currency configurations.
        const basePrice = basePrices[planTier] || 0;
        const dollarAmount = interval === 'yearly' ? basePrice * 10 : basePrice;
        
        if (dollarAmount <= 0) {
            throw new Error(`Plan ${planTier} has no price defined.`);
        }

        finalPayload.amount = convertToCents(dollarAmount);
        finalPayload.currency = 'USD';

        // Only attach the plan if it was resolved and validated successfully
        if (planCode) {
            finalPayload.plan = planCode;
        }
    } else {
        finalPayload.amount = convertToCents(input.payment.amountInUSD);
        finalPayload.currency = 'USD';
    }

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
      console.error('Paystack API Error Response:', responseData);
      let errorMsg = responseData.message || 'Unknown error';
      
      // Provide actionable feedback for the specific "Plan not found" issue
      if (errorMsg.toLowerCase().includes('plan not found') && finalPayload.plan) {
          errorMsg += ` (Plan ID: ${finalPayload.plan}). Check if this plan was created in Test or Live mode to match your Secret Key.`;
      }
      
      throw new Error(`Paystack API Error: ${errorMsg}`);
    }

    if (!responseData.status || !responseData.data) {
        throw new Error('Transaction initialization failed on Paystack.');
    }

    return responseData.data;
}
