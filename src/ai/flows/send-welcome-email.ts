'use server';

/**
 * @fileOverview Utility for sending welcome emails via Resend.
 * Uses raw HTML template literals for Cloudflare Edge compatibility.
 */

export type SendWelcomeEmailInput = {
  to: string;
  storeName: string;
};

export type SendWelcomeEmailOutput = {
  success: boolean;
  message: string;
  id?: string;
};

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com';

export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<SendWelcomeEmailOutput> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Resend API key is not configured.");
      return { success: false, message: 'Email service is not configured on the server.' };
    }

    try {
      const htmlContent = `
        <div style="font-family: sans-serif; padding: 40px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
          <h1 style="color: #D4AF37; margin-bottom: 24px;">Welcome to SOMA! Your Store is LIVE!</h1>
          <p style="font-size: 16px; color: #333;">Congratulations! Your payment was successful and your luxury store, "<strong>${input.storeName}</strong>", has been provisioned.</p>
          <div style="margin-top: 32px; text-align: center;">
            <a href="https://${ROOT_DOMAIN}/dashboard" style="background: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Executive Dashboard</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">SOMA - The Ultimate Design System for E-commerce.</p>
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
          to: input.to,
          subject: 'Welcome to SOMA! Your Store is LIVE!',
          html: htmlContent,
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
