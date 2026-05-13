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

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'tradewysetoday.com';

export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<SendWelcomeEmailOutput> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("Resend API key is not configured.");
      return { success: false, message: 'Email service is not configured on the server.' };
    }

    try {
      const { getLuxuryEmailHtml } = await import('@/lib/emails/luxury-wrapper');

      const htmlContent = getLuxuryEmailHtml({
        title: "Welcome to Trade Wyse",
        heading: "Your Empire is Live",
        body: `
          <p style="font-size: 16px; color: #CCCCCC;">Congratulations. Your payment was successful and your luxury store, <strong style="color: #D4AF37;">${input.storeName}</strong>, has been successfully provisioned within the Trade Wyse ecosystem.</p>
          <p style="font-size: 16px; color: #CCCCCC;">Your digital assets are ready for deployment. You may now access your executive control center to begin your operations.</p>
        `,
        buttonText: "Enter Dashboard",
        buttonUrl: `https://${ROOT_DOMAIN}/dashboard`,
      });

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"Trade Wyse Platform" <no-reply@tradewysetoday.com>`,
          to: input.to,
          subject: 'Welcome to Trade Wyse! Your Store is LIVE!',
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
