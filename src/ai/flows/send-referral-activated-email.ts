'use server';

/**
 * @fileOverview Utility for sending referral activation emails via Resend.
 * Decoupled from Genkit to support Edge Runtime.
 */

import React from 'react';
import { ReferralActivatedEmail } from '@/lib/emails/referral-activated-email';

export type SendReferralActivatedEmailInput = {
  to: string;
  referrerName: string;
  protegeName: string;
  creditAmount: string;
};

export async function sendReferralActivatedEmail(input: SendReferralActivatedEmailInput) {
    const { to, referrerName, protegeName, creditAmount } = input;
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
          subject: `Congratulations! Your protege ${protegeName} is now active`,
          react: React.createElement(ReferralActivatedEmail, { 
            referrerName, 
            protegeName, 
            creditAmount 
          }),
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email.');
      }

      return {
        success: true,
        message: 'Referral activation email sent successfully.',
        id: data.id,
      };
    } catch (error: any) {
      console.error("Error sending referral activation email:", error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred.',
      };
    }
}
