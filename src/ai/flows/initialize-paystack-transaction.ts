
'use server';

/**
 * @fileOverview A flow for initializing a Paystack transaction.
 *
 * - initializePaystackTransaction - A function that returns a Paystack authorization URL.
 * - InitializePaystackTransactionInput - The input type for the initializePaystackTransaction function.
 * - InitializePaystackTransactionOutput - The output type for the initializePaystackTransaction function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const InitializePaystackTransactionInputSchema = z.object({
  email: z.string().email().describe('The email of the customer.'),
  amount: z.number().int().positive().optional().describe('The amount in the lowest currency unit (e.g., Kobo, Cents).'),
  plan: z.string().optional().describe('The Paystack plan code for recurring payments.'),
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

    // This logic ensures we send the correct parameters for either a subscription or a one-time payment.
    if (input.plan && input.plan.trim() !== '') {
        // For subscriptions, only send the plan code. Paystack uses the plan's amount and currency.
        body.plan = input.plan;
    } else {
        // For one-time payments, ensure a valid amount is provided and send it as an integer.
        if (typeof input.amount !== 'number' || input.amount <= 0) {
            throw new Error('A valid amount is required for one-time payments.');
        }
        body.amount = Math.round(input.amount); // Ensure it's an integer in cents/kobo
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
