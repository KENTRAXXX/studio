'use server';

/**
 * @fileOverview Utility for sending payout confirmation emails via Resend.
 * Uses raw HTML template literals for Cloudflare Edge compatibility.
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';

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
      const htmlContent = `
        <div style="font-family: sans-serif; padding: 40px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #D4AF37; margin-bottom: 24px;">Confirm Your Withdrawal Request</h1>
          <p style="font-size: 16px; color: #333;">Hi ${name},</p>
          <p style="font-size: 16px; color: #333;">A withdrawal request for <strong>$${amount.toFixed(2)}</strong> was just submitted for your SOMA account.</p>
          <p style="font-size: 16px; color: #333;">To protect your account, please confirm that you initiated this request by clicking the button below. This is a one-time verification for your payout destination.</p>
          <div style="margin-top: 32px; text-align: center;">
            <a href="${confirmationUrl}" style="background: #D4AF37; color: #000; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirm Payout Request</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 32px;">If you did not make this request, please change your password immediately and contact support.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">Thanks,<br/>The SOMA Strategic Assets Group</p>
        </div>
      `;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"SOMA Platform" <no-reply@somatoday.com>`,
          to: to,
          subject: 'Action Required: Confirm Your SOMA Payout Request',
          html: htmlContent,
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
