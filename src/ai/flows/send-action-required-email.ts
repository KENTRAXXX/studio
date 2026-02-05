'use server';

/**
 * @fileOverview Utility for sending an "Action Required" email to sellers via Resend.
 * Decoupled from Genkit to support Edge Runtime.
 */

import React from 'react';
import { ActionRequiredEmail } from '@/lib/emails/action-required-email';

export type SendActionRequiredEmailInput = {
  to: string;
  name: string;
  feedback: string;
};

export async function sendActionRequiredEmail(input: SendActionRequiredEmailInput) {
    const { to, name, feedback } = input;
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
          to: to,
          subject: 'Action Required: Finalizing your SOMA Seller Hub',
          react: React.createElement(ActionRequiredEmail, { name, feedback }),
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
