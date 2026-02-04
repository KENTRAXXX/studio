'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import React from 'react';
import { WelcomeEmail } from '@/lib/emails/welcome-email';

const SendWelcomeEmailInputSchema = z.object({
  to: z.string().email().describe("The recipient's email address."),
  storeName: z.string().describe("The name of the new store."),
});
export type SendWelcomeEmailInput = z.infer<typeof SendWelcomeEmailInputSchema>;

const SendWelcomeEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string().optional(),
});
export type SendWelcomeEmailOutput = z.infer<typeof SendWelcomeEmailOutputSchema>;

export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<SendWelcomeEmailOutput> {
  return sendWelcomeEmailFlow(input);
}

const sendWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'sendWelcomeEmailFlow',
    inputSchema: SendWelcomeEmailInputSchema,
    outputSchema: SendWelcomeEmailOutputSchema,
  },
  async ({ to, storeName }) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Resend API key is not configured. Welcome email will not be sent.");
      return { success: false, message: 'Email service is not configured on the server.' };
    }

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
          subject: 'Welcome to SOMA! Your Store is LIVE!',
          // Using React.createElement to fix parsing error in .ts file
          react: React.createElement(WelcomeEmail, { storeName: storeName }),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Resend API Error:', data);
        throw new Error(data.message || 'Failed to send welcome email.');
      }
      
      console.log(`Welcome email sent successfully via Resend. ID: ${data.id}`);
      return { success: true, message: `Welcome email sent to ${to}.`, id: data.id };
    } catch (error: any) {
      console.error("Failed to send welcome email via Resend:", error);
      return { success: false, message: error.message || 'An unknown error occurred while sending welcome email.' };
    }
  }
);
