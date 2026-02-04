'use server';

/**
 * @fileOverview Genkit flow for sending an "Action Required" email to sellers via Resend.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import React from 'react';
import { ActionRequiredEmail } from '@/lib/emails/action-required-email';

const SendActionRequiredEmailInputSchema = z.object({
  to: z.string().email().describe("The recipient's email address."),
  feedback: z.string().describe("The admin feedback explaining what needs to be changed."),
});
export type SendActionRequiredEmailInput = z.infer<typeof SendActionRequiredEmailInputSchema>;

const SendActionRequiredEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function sendActionRequiredEmail(input: SendActionRequiredEmailInput) {
  return sendActionRequiredEmailFlow(input);
}

const sendActionRequiredEmailFlow = ai.defineFlow(
  {
    name: 'sendActionRequiredEmailFlow',
    inputSchema: SendActionRequiredEmailInputSchema,
    outputSchema: SendActionRequiredEmailOutputSchema,
  },
  async ({ to, feedback }) => {
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
          from: `"SOMA Quality Control" <no-reply@somads.com>`,
          to: to,
          subject: 'Action Required: Your SOMA Seller Application',
          react: React.createElement(ActionRequiredEmail, { feedback }),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email.');
      }

      return {
        success: true,
        message: 'Action required email sent successfully.',
      };
    } catch (error: any) {
      console.error("Error sending action required email:", error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred.',
      };
    }
  }
);
