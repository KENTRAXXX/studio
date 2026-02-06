'use server';

/**
 * @fileOverview Utility for sending an "Action Required" email to sellers via Resend.
 * Uses raw HTML template literals for Cloudflare Edge compatibility.
 */

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
      const htmlContent = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
          <h1 style="color: #D4AF37; border-bottom: 1px solid #eee; padding-bottom: 10px;">Action Required: SOMA Seller Application</h1>
          <p>Hello ${name},</p>
          <p>Thank you for your application to join SOMA as an authorized brand.</p>
          <p>Our concierge team has reviewed your submission. To maintain the high standards of authenticity within our marketplace, we require a small update to your documentation before we can fully activate your store:</p>
          <div style="padding: 20px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 25px 0;">
            <strong style="display: block; margin-bottom: 10px; color: #000;">Reason for hold:</strong>
            <p style="margin: 0; font-style: italic; font-size: 16px;">"${feedback}"</p>
          </div>
          <h3 style="color: #000;">Next Steps:</h3>
          <p>Please log back into your SOMA Backstage portal to re-upload the requested information. Once received, we will prioritize your final approval.</p>
          <div style="margin-top: 30px; text-align: center;">
              <a href="https://somatoday.com/backstage" style="background-color: #D4AF37; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Access SOMA Backstage</a>
          </div>
          <p>We look forward to seeing your collection live on the platform.</p>
          <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Warmly,<br/>
              <strong>The SOMA Concierge Team</strong>
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
          from: `"SOMA Concierge" <no-reply@somatoday.com>`,
          to: to,
          subject: 'Action Required: Finalizing your SOMA Seller Hub',
          html: htmlContent,
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
