'use server';

/**
 * @fileOverview Utility for sending payout confirmation emails via Resend.
 * Decoupled from Genkit to support Edge Runtime.
 */

import React from 'react';
import { PayoutConfirmationEmail } from '@/lib/emails/payout-confirmation-email';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';

export type SendPayoutConfirmationEmailInput = {
  to: string;
  name: string;
  amount: number;
  withdrawalId: string;
  token: string;
};

export type SendPayoutConfirmationEmailOutput = {
  success: boolean;
  message: string;
  id?: string;
};

export async function sendPayoutConfirmationEmail(input: SendPayoutConfirmationEmailInput): Promise<SendPayoutConfirmationEmailOutput> {
    const { to, name, amount, withdrawalId, token } = input;
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.error("Resend API key is not configured.");
      return { success: false, message: 'Email service is not configured.' };
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
          react: React.createElement(PayoutConfirmationEmail, { name, amount, confirmationUrl }),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email.');
      }
      
      return { success: true, message: `Payout confirmation email sent to ${to}.`, id: data.id };
    } catch (error: any) {
      console.error("Failed to send payout confirmation email:", error);
      return { success: false, message: error.message || 'An unknown error occurred.' };
    }
}
