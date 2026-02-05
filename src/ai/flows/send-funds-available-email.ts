'use server';

/**
 * @fileOverview Utility for notifying referrers that their matured rewards are available.
 * Decoupled from Genkit to support Edge Runtime.
 */

import React from 'react';
import { FundsAvailableEmail } from '@/lib/emails/funds-available-email';

export type SendFundsAvailableEmailInput = {
  to: string;
  name: string;
  amount: string;
};

export async function sendFundsAvailableEmail(input: SendFundsAvailableEmailInput) {
    const { to, name, amount } = input;
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
