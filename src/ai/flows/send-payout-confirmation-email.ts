'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import React from 'react';
import { PayoutConfirmationEmail } from '@/lib/emails/payout-confirmation-email';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';

const SendPayoutConfirmationEmailInputSchema = z.object({
  to: z.string().email(),
  name: z.string(),
  amount: z.number(),
  withdrawalId: z.string(),
  token: z.string(),
});
export type SendPayoutConfirmationEmailInput = z.infer<typeof SendPayoutConfirmationEmailInputSchema>;

const SendPayoutConfirmationEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string().optional(),
});
export type SendPayoutConfirmationEmailOutput = z.infer<typeof SendPayoutConfirmationEmailOutputSchema>;

export async function sendPayoutConfirmationEmail(input: SendPayoutConfirmationEmailInput): Promise<SendPayoutConfirmationEmailOutput> {
  return sendPayoutConfirmationEmailFlow(input);
}

const sendPayoutConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'sendPayoutConfirmationEmailFlow',
    inputSchema: SendPayoutConfirmationEmailInputSchema,
    outputSchema: SendPayoutConfirmationEmailOutputSchema,
  },
  async ({ to, name, amount, withdrawalId, token }) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Resend API key is not configured. Payout confirmation email will not be sent.");
      return { success: false, message: 'Email service is not configured on the server.' };
    }

    const confirmationUrl = `https://${ROOT_DOMAIN}/api/confirm-payout?token=${token}&id=${withdrawalId}`;
    
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"SOMA Platform" <no-reply@somads.com>`,
          to: to,
          subject: 'Action Required: Confirm Your SOMA Payout Request',
          react: <PayoutConfirmationEmail name={name} amount={amount} confirmationUrl={confirmationUrl} />,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Resend API Error:', data);
        throw new Error(data.message || 'Failed to send payout confirmation email.');
      }
      
      console.log(`Payout confirmation email sent successfully via Resend. ID: ${data.id}`);
      return { success: true, message: `Payout confirmation email sent to ${to}.`, id: data.id };
    } catch (error: any) {
      console.error("Failed to send payout confirmation email via Resend:", error);
      return { success: false, message: error.message || 'An unknown error occurred while sending email.' };
    }
  }
);
