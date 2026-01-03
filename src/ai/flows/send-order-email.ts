'use server';

/**
 * @fileOverview A flow for sending order-related emails.
 *
 * - sendOrderEmail - A function that simulates sending an email based on order status.
 * - SendOrderEmailInput - The input type for the sendOrderEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SendOrderEmailInputSchema = z.object({
  customerEmail: z.string().email().describe("The customer's email address."),
  orderId: z.string().describe('The unique ID of the order.'),
  status: z.enum(['Pending', 'Shipped', 'Cancelled']).describe('The current status of the order.'),
  storeName: z.string().describe("The name of the client's store."),
});
export type SendOrderEmailInput = z.infer<typeof SendOrderEmailInputSchema>;

const SendOrderEmailOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendOrderEmailOutput = z.infer<typeof SendOrderEmailOutputSchema>;


const getEmailTemplate = (status: 'Pending' | 'Shipped' | 'Cancelled', orderId: string, storeName: string) => {
    switch (status) {
        case 'Pending':
            return {
                subject: `Your order #${orderId} from ${storeName} is confirmed!`,
                body: `Thank you for your purchase! We've received your order #${orderId} and are getting it ready for shipment. We'll notify you again once it's on its way.`
            };
        case 'Shipped':
            return {
                subject: `Your order #${orderId} from ${storeName} has shipped!`,
                body: `Great news! Your order #${orderId} is now on its way to you. You can track your package using the tracking number: XYZ12345 (tracking simulation).`
            };
        case 'Cancelled':
            return {
                subject: `Your order #${orderId} from ${storeName} has been cancelled.`,
                body: `We've successfully cancelled your order #${orderId}. Your refund will be processed within 3-5 business days.`
            };
    }
}

/**
 * Simulates sending an email to a customer about their order status.
 * In a real application, this would integrate with an email service like SendGrid.
 *
 * @param input - The order details for the email.
 * @returns A success status and message.
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
  async ({ customerEmail, orderId, status, storeName }) => {

    const { subject, body } = getEmailTemplate(status, orderId, storeName);
    
    // This is where you would integrate with an email service like SendGrid.
    // For now, we just log it to the console to simulate the action.
    console.log(`
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      EMAIL SIMULATION (via SendGrid)
      From: "${storeName}" <no-reply@soma.com>
      To: ${customerEmail}
      Subject: ${subject}
      
      Body:
      ${body}
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    `);
    
    return {
      success: true,
      message: `Simulated email for order ${orderId} sent to ${customerEmail}.`,
    };
  }
);
