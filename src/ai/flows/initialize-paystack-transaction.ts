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
 * Strictly validates that the code is a real Paystack plan identifier.
 */
function getPlanCode(tier: string, interval: string): string | undefined {
    const suffix = `${tier}_${interval.toUpperCase()}_PLAN_CODE`;
    const envKey = `PAYSTACK_${suffix}`;
    const publicEnvKey = `NEXT_PUBLIC_${suffix}`;
    
    const rawCode = process.env[envKey] || process.env[publicEnvKey];
    
    if (!rawCode || typeof rawCode !== 'string') return undefined;

    const code = rawCode.trim();
    
    // Strictly validate: must start with PLN_, 
    // and must not be a placeholder like "PLN_..." or "PLN_YOUR_CODE"
    const isPlaceholder = 
        code.includes('...') || 
        code.includes('YOUR_') || 
        code.includes('VALUE') ||
        code.length < 8; // Valid PLN_ codes are usually quite long

    if (code.startsWith('PLN_') && !isPlaceholder) {
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

    let resolvedPlanCode: string | undefined;

    if (input.payment.type === 'signup') {
        const { planTier, interval } = input.payment;
        
        if ((planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN') {
            throw new Error("Free plans do not require payment initialization.");
        }

        resolvedPlanCode = getPlanCode(planTier, interval);
        
        // Calculate the amount. 
        // Note: Paystack requires the amount even if a plan is provided for some currency configurations.
        const basePrice = basePrices[planTier] || 0;
        const dollarAmount = interval === 'yearly' ? basePrice * 10 : basePrice;
        
        if (dollarAmount <= 0) {
            throw new Error(`Plan ${planTier} has no price defined.`);
        }

        finalPayload.amount = convertToCents(dollarAmount);
        finalPayload.currency = 'USD';

        if (resolvedPlanCode) {
            finalPayload.plan = resolvedPlanCode;
        }
    } else {
        finalPayload.amount = convertToCents(input.payment.amountInUSD);
        finalPayload.currency = 'USD';
    }

    // Diagnostic logging for the executive team (visible in Cloudflare Logs)
    console.log(`[Paystack] Initializing ${input.payment.type} for ${input.email}. Amount: ${finalPayload.amount} cents. Plan: ${resolvedPlanCode || 'None (One-time charge)'}`);

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
      // Include the payload details in the error if we are in dev or help identify plan errors
      const errorMsg = responseData.message || 'Unknown error';
      throw new Error(`Paystack API Error: ${errorMsg}${resolvedPlanCode ? ` (Plan attempted: ${resolvedPlanCode})` : ''}`);
    }

    if (!responseData.status || !responseData.data) {
        throw new Error('Transaction initialization failed on Paystack.');
    }

    return responseData.data;
}
