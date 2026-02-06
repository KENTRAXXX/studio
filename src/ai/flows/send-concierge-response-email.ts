'use server';

/**
 * @fileOverview Utility for sending a response email to a brand partner from SOMA Admin.
 * Decoupled from Genkit to support Edge Runtime.
 */

export type SendConciergeResponseEmailInput = {
  to: string;
  subject: string;
  originalMessage: string;
  responseMessage: string;
  ticketId: string;
};

export async function sendConciergeResponseEmail(input: SendConciergeResponseEmailInput) {
    const { to, subject, originalMessage, responseMessage, ticketId } = input;
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
          from: `"SOMA Executive Support" <no-reply@somatoday.com>`,
          to: to,
          subject: `RE: ${subject} [Ref: ${ticketId.slice(0, 8)}]`,
          html: `
            <div style="font-family: sans-serif; padding: 40px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #DAA520; margin-bottom: 24px;">Executive Response</h2>
              <p style="font-size: 16px; color: #333; white-space: pre-wrap;">${responseMessage}</p>
              
              <div style="margin-top: 40px; padding: 20px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #eee;">
                <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 12px; color: #888; text-transform: uppercase;">Original Message:</p>
                <p style="margin: 0; font-size: 14px; color: #666; font-style: italic;">"${originalMessage}"</p>
              </div>

              <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0;">
              <p style="font-size: 12px; color: #999; text-align: center;">
                This is a secure communication from the SOMA Strategic Assets Group. 
                Please log into your dashboard to view the full conversation history.
              </p>
            </div>
          `
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send response email.');
      }

      return {
        success: true,
        message: 'Response delivered to brand partner.',
      };
    } catch (error: any) {
      console.error("Error sending concierge response email:", error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred.',
      };
    }
}
