'use server';

/**
 * @fileOverview Utility for sending concierge support messages to the admin.
 * Decoupled from Genkit to support Edge Runtime.
 */

export type SendConciergeEmailInput = {
  fromEmail: string;
  brandName: string;
  subject: string;
  message: string;
  priority: 'standard' | 'urgent';
  ticketId: string;
};

export async function sendConciergeEmail(input: SendConciergeEmailInput) {
    const { fromEmail, brandName, subject, message, priority, ticketId } = input;
    const resendApiKey = process.env.RESEND_API_KEY;
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';
    
    if (!resendApiKey) {
      console.error("Resend API key is missing.");
      return { success: false, message: 'Email service configuration error.' };
    }

    const adminReviewUrl = `https://${rootDomain}/admin/concierge?ticketId=${ticketId}`;
    const priorityColor = priority === 'urgent' ? '#ef4444' : '#DAA520';

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `"SOMA Executive Concierge" <no-reply@somads.com>`,
          to: 'tedd@somads.com', 
          subject: `[${priority.toUpperCase()}] New Concierge Message from ${brandName}`,
          html: `
            <div style="font-family: sans-serif; padding: 40px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: ${priorityColor}; margin-bottom: 24px;">New Executive Request</h2>
              <div style="background: #f9f9f9; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
                <p style="margin: 0 0 8px 0;"><strong>Brand:</strong> ${brandName}</p>
                <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${fromEmail}</p>
                <p style="margin: 0 0 8px 0;"><strong>Priority:</strong> <span style="color: ${priorityColor}; text-transform: uppercase; font-weight: bold;">${priority}</span></p>
                <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0;">
              <p style="font-size: 16px; color: #333; white-space: pre-wrap;">${message}</p>
              <div style="margin-top: 48_px; text-align: center;">
                <a href="${adminReviewUrl}" style="background: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review & Respond</a>
              </div>
            </div>
          `
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send concierge email.');
      }

      return {
        success: true,
        message: 'Message delivered to SOMA Founder.',
      };
    } catch (error: any) {
      console.error("Error sending concierge email:", error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred.',
      };
    }
}
