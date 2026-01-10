'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import React from 'react';

const SendOrderEmailInputSchema = z.object({
  to: z.string().email().describe("The recipient's email address."),
  orderId: z.string().describe('The unique ID of the order.'),
  status: z.enum(['Pending', 'Shipped', 'Cancelled']).describe('The current status of the order.'),
  storeName: z.string().describe("The name of the client's store."),
});
export type SendOrderEmailInput = z.infer<typeof SendOrderEmailInputSchema>;

const SendOrderEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  id: z.string().optional(),
});
export type SendOrderEmailOutput = z.infer<typeof SendOrderEmailOutputSchema>;

// Simple React components for email templates
const OrderConfirmationEmail = ({ orderId, storeName }: { orderId: string, storeName: string }) => (
  <div>
    <h1>Order Confirmed: #{orderId}</h1>
    <p>Thank you for your purchase from {storeName}!</p>
    <p>We've received your order and are getting it ready for shipment. We'll notify you again once it's on its way.</p>
  </div>
);

const PayoutSuccessEmail = ({ amount, date }: { amount: number, date: string }) => (
  <div>
    <h1>Payout Processed!</h1>
    <p>A payout of ${amount.toFixed(2)} has been successfully sent to your connected bank account on {date}.</p>
    <p>Thank you for selling with SOMA.</p>
  </div>
);


const getEmailContent = (status: 'Pending' | 'Shipped' | 'Cancelled', orderId: string, storeName: string) => {
    switch (status) {
        case 'Pending':
            return {
                subject: `Your order #${orderId} from ${storeName} is confirmed!`,
                template: <OrderConfirmationEmail orderId={orderId} storeName={storeName} />
            };
        case 'Shipped': // You can create a component for this too
            return {
                subject: `Your order #${orderId} from ${storeName} has shipped!`,
                template: <div>Your order is on its way!</div>
            };
        case 'Cancelled': // And this
             return {
                subject: `Your order #${orderId} from ${storeName} has been cancelled.`,
                template: <div>Your order has been cancelled.</div>
            };
    }
}

/**
 * Sends an email using the Resend API.
 * This flow now handles real email dispatch.
 *
 * @param input - The order details for the email.
 * @returns A success status and the ID of the sent email from Resend.
 */
export async function sendOrderEmail(input: SendOrderEmailInput): Promise<SendOrderEmailOutput> {
  return sendOrderEmailFlow(input);
}


const sendOrderEmailFlow = ai.defineFlow(
  {
    name: 'sendOrderEmailFlow',
    inputSchema: SendOrderEmailInputSchema,
    outputSchema: SendOrderEmailOutputSchema,
  },
  async ({ to, orderId, status, storeName }) => {

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
        console.error("Resend API key is not configured. Cannot send email.");
        // We return success=false but don't throw an error to prevent crashing the calling flow.
        return {
            success: false,
            message: 'Email service is not configured on the server.',
        };
    }

    const { subject, template } = getEmailContent(status, orderId, storeName);
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `"${storeName}" <no-reply@somads.com>`, // Replace with your verified Resend domain
                to: to,
                subject: subject,
                react: template, // Resend uses a 'react' property for JSX templates
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API Error:', data);
            throw new Error(data.message || 'Failed to send email.');
        }

        console.log(`Email sent successfully via Resend. ID: ${data.id}`);

        return {
            success: true,
            message: `Email for order ${orderId} sent to ${to}.`,
            id: data.id,
        };

    } catch (error: any) {
         console.error("Failed to send email via Resend:", error);
         return {
            success: false,
            message: error.message || 'An unknown error occurred while sending the email.',
         }
    }
  }
);
