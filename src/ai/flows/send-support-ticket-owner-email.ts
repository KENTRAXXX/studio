'use server';

/**
 * @fileOverview Sends an alert email to a store owner when a new support ticket is created.
 * Decoupled from Genkit to support Edge Runtime.
 */

export type SendSupportTicketOwnerEmailInput = {
  to: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  storeName: string;
};

export async function sendSupportTicketOwnerEmail(input: SendSupportTicketOwnerEmailInput) {
    const { to, customerName, customerEmail, subject, storeName } = input;
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
          from: `"SomaDs Platform" <no-reply@somatoday.com>`,
          to: to,
          subject: `ACTION REQUIRED: New Support Ticket from ${customerName}`,
          html: `
            <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; padding: 40px;">
              <h2 style="color: #D4AF37; margin-bottom: 20px;">New Executive Request</h2>
              <p>You have a new support request for <strong>${storeName}</strong>.</p>
              
              <div style="padding: 25px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #D4AF37; margin: 25px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Subject:</strong> ${subject}</p>
                <p style="margin: 0;"><strong>Customer:</strong> ${customerEmail}</p>
              </div>

              <p>Please log in to your Backstage to reply and maintain your boutique's luxury service standards.</p>
              
              <div style="margin-top: 30px; text-align: center;">
                  <a href="https://somatoday.com/backstage/support" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Support Portal</a>
              </div>

              <p style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999; font-style: italic;">
                  Note: Platform Admins monitor response times to ensure quality and brand integrity.
              </p>
            </div>
          `
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send owner alert email.');
      }

      return { success: true, id: data.id };
    } catch (error: any) {
      console.error("Error sending support owner alert:", error);
      return { success: false, message: error.message };
    }
}
