'use server';

/**
 * @fileOverview Initializes a Paystack transaction.
 * Updated to support discounted plan codes for the Ambassador program.
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
 * Supports a 'DISCOUNTED' variant for Ambassador conversions.
 */
function getPlanCode(tier: string, interval: string, isDiscounted: boolean = false): string | undefined {
    const baseSuffix = `${tier}_${interval.toUpperCase()}`;
    const suffix = isDiscounted ? `${baseSuffix}_DISCOUNTED_PLAN_CODE` : `${baseSuffix}_PLAN_CODE`;
    
    const envKey = `PAYSTACK_${suffix}`;
    const publicEnvKey = `NEXT_PUBLIC_${suffix}`;
    
    const rawValue = process.env[envKey] || process.env[publicEnvKey];
    
    if (!rawValue || typeof rawValue !== 'string') {
        // Fallback to standard plan if discounted plan code isn't configured yet
        if (isDiscounted) return getPlanCode(tier, interval, false);
        return undefined;
    }

    const code = rawValue.replace(/\s+/g, '');
    
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
    discountApplied: z.boolean().optional(),
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

export async function initializePaystackTransaction(
  input: InitializePaystackTransactionInput
): Promise<InitializePaystackTransactionOutput> {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key is not configured.');
    }

    const finalPayload: any = {
        email: input.email,
        metadata: {
            ...input.metadata,
            payment_type: input.payment.type
        },
    };

    if (input.payment.type === 'signup') {
        const { planTier, interval, discountApplied } = input.payment;
        
        if ((planTier === 'SELLER' && interval === 'free') || planTier === 'ADMIN') {
            throw new Error("Free plans do not require payment initialization.");
        }

        const planCode = getPlanCode(planTier, interval, !!discountApplied);
        
        // Calculate the amount (20% off for Ambassador referrals)
        const basePrice = basePrices[planTier] || 0;
        let dollarAmount = interval === 'yearly' ? basePrice * 10 : basePrice;
        
        if (discountApplied) {
            dollarAmount = dollarAmount * 0.8;
        }
        
        if (dollarAmount <= 0) {
            throw new Error(`Plan ${planTier} has no price defined.`);
        }

        finalPayload.amount = convertToCents(dollarAmount);
        finalPayload.currency = 'USD';

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
      console.error('Paystack API Error:', responseData);
      throw new Error(`Paystack API Error: ${responseData.message || 'Unknown error'}`);
    }

    return responseData.data;
}
