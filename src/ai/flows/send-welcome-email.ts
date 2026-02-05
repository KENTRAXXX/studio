'use server';

import React from 'react';
import { WelcomeEmail } from '@/lib/emails/welcome-email';

export type SendWelcomeEmailInput = {
  to: string;
  storeName: string;
};

export type SendWelcomeEmailOutput = {
  success: boolean;
  message: string;
  id?: string;
};

export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<SendWelcomeEmailOutput> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Resend API key is not configured.");
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
          to: input.to,
          subject: 'Welcome to SOMA! Your Store is LIVE!',
          react: React.createElement(WelcomeEmail, { storeName: input.storeName }),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send welcome email.');
      }
      
      return { success: true, message: `Welcome email sent to ${input.to}.`, id: data.id };
    } catch (error: any) {
      console.error("Failed to send welcome email via Resend:", error);
      return { success: false, message: error.message || 'An unknown error occurred.' };
    }
}
