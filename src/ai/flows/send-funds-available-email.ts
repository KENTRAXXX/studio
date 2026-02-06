'use server';

/**
 * @fileOverview Utility for notifying referrers that their matured rewards are available.
 * Uses raw HTML template literals for Cloudflare Edge compatibility.
 */

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
      const htmlContent = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 40px;">
          <h1 style="color: #D4AF37; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 24px;">Executive Settlement: Funds Released</h1>
          <p>Hello ${name},</p>
          <p>We are pleased to inform you that your referral rewards have successfully cleared the platform's maturity period and are now available for withdrawal.</p>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; text-transform: uppercase; font-size: 12px; font-weight: bold; letter-spacing: 1px; color: #666;">Amount Released to Wallet</p>
            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #000;">${amount}</p>
          </div>
          <p>These funds have been moved to your active balance. You can request a payout directly to your bank account via the SOMA Wallet dashboard.</p>
          <div style="margin-top: 30px; text-align: center;">
              <a href="https://somatoday.com/dashboard/wallet" style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access My Wallet</a>
          </div>
          <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #999;">
              Thank you for your continued strategic partnership.<br/>
              <strong>SOMA Strategic Assets Group</strong>
          </p>
        </div>
      `;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"SOMA Ecosystem" <no-reply@somatoday.com>`,
          to: to,
          subject: `Funds Released: Your referral rewards are ready`,
          html: htmlContent,
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
