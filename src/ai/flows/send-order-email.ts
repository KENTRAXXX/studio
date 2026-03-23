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

const getEmailContent = async (status: 'Pending' | 'Shipped' | 'Cancelled', orderId: string, storeName: string) => {
    const { getLuxuryEmailHtml } = await import('@/lib/emails/luxury-wrapper');
    
    switch (status) {
        case 'Pending':
            return {
                subject: `Order Confirmed: #${orderId}`,
                html: getLuxuryEmailHtml({
                  title: "Order Confirmation",
                  heading: "Acquisition Confirmed",
                  body: `
                    <p style="font-size: 16px; color: #CCCCCC;">Thank you for your purchase from <strong style="color: #D4AF37;">${storeName}</strong>.</p>
                    <p style="font-size: 16px; color: #CCCCCC;">We've received your order <strong style="color: #D4AF37;">#${orderId}</strong> and are preparing it for shipment. You will receive a notification once your items have been dispatched.</p>
                  `,
                })
            };
        case 'Shipped':
            return {
                subject: `Order Dispatched: #${orderId}`,
                html: getLuxuryEmailHtml({
                  title: "Shipping Notification",
                  heading: "Assets in Transit",
                  body: `
                    <p style="font-size: 16px; color: #CCCCCC;">Your order <strong style="color: #D4AF37;">#${orderId}</strong> from ${storeName} has been dispatched.</p>
                    <p style="font-size: 16px; color: #CCCCCC;">Our logistics team has released your package. You can track your assets via the tracking link provided in your shipping dashboard.</p>
                  `,
                })
            };
        case 'Cancelled':
             return {
                subject: `Order Nullified: #${orderId}`,
                html: getLuxuryEmailHtml({
                  title: "Cancellation Notice",
                  heading: "Order Cancelled",
                  body: `
                    <p style="font-size: 16px; color: #CCCCCC;">Your order <strong style="color: #D4AF37;">#${orderId}</strong> from ${storeName} has been nullified per request.</p>
                    <p style="font-size: 16px; color: #CCCCCC;">If this was unintended, please contact our support department immediately to restore your transaction.</p>
                  `,
                })
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

    const { subject, html } = await getEmailContent(status, orderId, storeName);
    
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
