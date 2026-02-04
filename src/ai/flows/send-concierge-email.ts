
'use server';

/**
 * @fileOverview Genkit flow for sending concierge support messages to the admin.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SendConciergeEmailInputSchema = z.object({
  fromEmail: z.string().email(),
  brandName: z.string(),
  userStatus: z.string(),
  subject: z.string(),
  message: z.string(),
});
export type SendConciergeEmailInput = z.infer<typeof SendConciergeEmailInputSchema>;

const SendConciergeEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export async function sendConciergeEmail(input: SendConciergeEmailInput) {
  return sendConciergeEmailFlow(input);
}

const sendConciergeEmailFlow = ai.defineFlow(
  {
    name: 'sendConciergeEmailFlow',
    inputSchema: SendConciergeEmailInputSchema,
    outputSchema: SendConciergeEmailOutputSchema,
  },
  async ({ fromEmail, brandName, userStatus, subject, message }) => {
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
          from: `"SOMA Concierge" <no-reply@somads.com>`,
          to: 'tedd@somads.com', // Admin recipient
          subject: `Concierge: ${subject} [${brandName}]`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; line-height: 1.6;">
              <h2 style="color: #DAA520;">New Concierge Message</h2>
              <p><strong>From:</strong> ${fromEmail}</p>
              <p><strong>Brand:</strong> ${brandName}</p>
              <p><strong>Account Status:</strong> ${userStatus}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p><strong>Subject:</strong> ${subject}</p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          `
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send concierge email.');
      }

      return {
        success: true,
        message: 'Message delivered to SOMA Concierge.',
      };
    } catch (error: any) {
      console.error("Error sending concierge email:", error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred.',
      };
    }
  }
);
