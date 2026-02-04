'use server';

/**
 * @fileOverview Genkit flow for notifying referrers that their matured rewards are available.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import React from 'react';
import { FundsAvailableEmail } from '@/lib/emails/funds-available-email';

const SendFundsAvailableEmailInputSchema = z.object({
  to: z.string().email(),
  name: z.string(),
  amount: z.string(),
});
export type SendFundsAvailableEmailInput = z.infer<typeof SendFundsAvailableEmailInputSchema>;

const SendFundsAvailableEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string().optional(),
});

export async function sendFundsAvailableEmail(input: SendFundsAvailableEmailInput) {
  return sendFundsAvailableEmailFlow(input);
}

const sendFundsAvailableEmailFlow = ai.defineFlow(
  {
    name: 'sendFundsAvailableEmailFlow',
    inputSchema: SendFundsAvailableEmailInputSchema,
    outputSchema: SendFundsAvailableEmailOutputSchema,
  },
  async ({ to, name, amount }) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Resend API key is missing.");
      return { success: false, message: 'Email service configuration error.' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"SOMA Ecosystem" <no-reply@somads.com>`,
          to: to,
          subject: `Funds Released: Your referral rewards are ready`,
          react: React.createElement(FundsAvailableEmail, { 
            name, 
            amount 
          }),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email.');
      }

      return {
        success: true,
        message: 'Funds available email sent successfully.',
        id: data.id,
      };
    } catch (error: any) {
      console.error("Error sending funds available email:", error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred.',
      };
    }
  }
);
