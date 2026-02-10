'use server';

/**
 * @fileOverview Sends a confirmation email to a customer who submitted a support ticket.
 * Decoupled from Genkit to support Edge Runtime.
 */

export type SendSupportTicketCustomerEmailInput = {
  to: string;
  customerName: string;
  storeName: string;
  ticketId: string;
  storeUrl: string;
};

export async function sendSupportTicketCustomerEmail(input: SendSupportTicketCustomerEmailInput) {
    const { to, customerName, storeName, ticketId, storeUrl } = input;
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
          from: `"${storeName} Support" <no-reply@somatoday.com>`,
          to: to,
          subject: `Your request to ${storeName} has been received [#${ticketId.slice(0, 8).toUpperCase()}]`,
          html: `
            <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 40px;">
              <p>Hi ${customerName},</p>
              <p>Your support request has been sent to the team at <strong>${storeName}</strong>.</p>
              <p>Our team is reviewing your inquiry and will respond shortly. You can track the status or reply by visiting your boutique's support terminal.</p>
              <div style="margin-top: 30px; padding: 20px; background: #f9f9f9; border-radius: 8px; border-left: 4px solid #D4AF37;">
                <p style="margin: 0; font-size: 14px; color: #666;">
                    <strong>Reference ID:</strong> ${ticketId.toUpperCase()}<br/>
                    <strong>Boutique:</strong> ${storeName}
                </p>
              </div>
              <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999;">
                  Sent via <strong>SomaDs Platform</strong>.
              </p>
            </div>
          `
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send confirmation email.');
      }

      return { success: true, id: data.id };
    } catch (error: any) {
      console.error("Error sending support confirmation email:", error);
      return { success: false, message: error.message };
    }
}
