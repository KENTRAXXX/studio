'use server';

/**
 * @fileOverview Diagnostic flow for testing email delivery integrity.
 * Uses raw HTML for Cloudflare Edge compatibility.
 */

export type SendTestEmailInput = {
  to: string;
};

export async function sendTestEmail(input: SendTestEmailInput) {
    const { to } = input;
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      return { success: false, message: 'RESEND_API_KEY is not configured in environment secrets.' };
    }

    try {
      const htmlContent = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 40px;">
          <h1 style="color: #D4AF37; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 24px;">SOMA: Digital Handshake Successful</h1>
          <p>Hello,</p>
          <p>This is a diagnostic transmission from the <strong>SOMA Executive Platform</strong>. If you are reading this, it confirms that your email orchestration is correctly configured and operational on the Cloudflare Edge.</p>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 25px 0;">
            <p style="margin: 0; font-family: monospace; font-size: 14px; color: #666;">
              Status: SECURE<br/>
              Runtime: Cloudflare Edge<br/>
              Provider: Resend API<br/>
              Identity: somatoday.com
            </p>
          </div>
          <p>Your platform is now ready to handle automated welcome sequences, order confirmations, and treasury alerts.</p>
          <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #999;">
              System Intelligence,<br/>
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
          from: `"SOMA Diagnostic" <no-reply@somatoday.com>`,
          to: to,
          subject: 'SOMA Platform: Email Integration Test',
          html: htmlContent,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Resend API rejected the request.');
      }

      return {
        success: true,
        message: 'Test email dispatched successfully.',
      };
    } catch (error: any) {
      console.error("Diagnostic transmission error:", error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred during transmission.',
      };
    }
}
