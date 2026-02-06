'use server';

/**
 * @fileOverview Utility for sending order-related emails via Resend.
 * Uses raw HTML template literals for Cloudflare Edge compatibility.
 */

export type SendOrderEmailInput = {
  to: string;
  orderId: string;
  status: 'Pending' | 'Shipped' | 'Cancelled';
  storeName: string;
};

export type SendOrderEmailOutput = {
  success: boolean;
  message: string;
  id?: string;
};

const getEmailContent = (status: 'Pending' | 'Shipped' | 'Cancelled', orderId: string, storeName: string) => {
    switch (status) {
        case 'Pending':
            return {
                subject: `Your order #${orderId} from ${storeName} is confirmed!`,
                html: `
                  <div style="font-family: sans-serif; color: #333;">
                    <h1 style="color: #D4AF37;">Order Confirmed: #${orderId}</h1>
                    <p>Thank you for your purchase from ${storeName}!</p>
                    <p>We've received your order and are getting it ready for shipment. We'll notify you again once it's on its way.</p>
                  </div>
                `
            };
        case 'Shipped':
            return {
                subject: `Your order #${orderId} from ${storeName} has shipped!`,
                html: `
                  <div style="font-family: sans-serif; color: #333;">
                    <h1 style="color: #D4AF37;">Your Order #${orderId} from ${storeName} Has Shipped!</h1>
                    <p>Your items are on their way. You can track your package using the link in the shipping confirmation email.</p>
                  </div>
                `
            };
        case 'Cancelled':
             return {
                subject: `Your order #${orderId} from ${storeName} has been cancelled.`,
                html: `
                  <div style="font-family: sans-serif; color: #333;">
                    <h1 style="color: #D4AF37;">Order Cancelled: #${orderId}</h1>
                    <p>Your order from ${storeName} has been cancelled as requested. If you have any questions, please contact support.</p>
                  </div>
                `
            };
    }
}

export async function sendOrderEmail(input: SendOrderEmailInput): Promise<SendOrderEmailOutput> {
    const { to, orderId, status, storeName } = input;
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
        console.error("Resend API key is not configured.");
        return {
            success: false,
            message: 'Email service is not configured on the server.',
        };
    }

    const { subject, html } = getEmailContent(status, orderId, storeName);
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `"${storeName}" <no-reply@somatoday.com>`,
                to: to,
                subject: subject,
                html: html,
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send email.');
        }

        return {
            success: true,
            message: `Email for order ${orderId} sent to ${to}.`,
            id: data.id,
        };

    } catch (error: any) {
         console.error("Failed to send email via Resend:", error);
         return {
            success: false,
            message: error.message || 'An unknown error occurred.',
         }
    }
}
