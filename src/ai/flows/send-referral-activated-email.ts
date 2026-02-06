'use server';

/**
 * @fileOverview Utility for sending referral activation emails via Resend.
 * Uses raw HTML template literals for Cloudflare Edge compatibility.
 */

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
      const htmlContent = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 40px;">
          <h1 style="color: #D4AF37; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 24px;">Congratulations, Partner!</h1>
          <p>Hello ${referrerName},</p>
          <p>Success has resonated within your network. Your protege, <strong>${protegeName}</strong>, has just officially launched their SOMA boutique!</p>
          <div style="padding: 30px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; text-transform: uppercase; font-size: 12px; font-weight: bold; letter-spacing: 1px; color: #666;">Referral Credit Added</p>
            <p style="margin: 0; font-size: 36px; font-weight: bold; color: #000;">${creditAmount}</p>
          </div>
          <p>This credit has been instantly deposited into your <strong>SOMA Wallet</strong> as a reward for expanding the elite ecosystem. Your mentorship is helping build the future of luxury commerce.</p>
          <div style="margin-top: 30px; text-align: center;">
              <a href="https://somatoday.com/dashboard/wallet" style="background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View My Wallet</a>
          </div>
          <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #999;">
              Thank you for your continued leadership in the SOMA network.<br/>
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
          subject: `Congratulations! Your protege ${protegeName} is now active`,
          html: htmlContent,
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
