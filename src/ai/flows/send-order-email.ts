'use server';

/**
 * @fileOverview Utility for sending order-related emails via Resend.
 * Decoupled from Genkit to support Edge Runtime.
 */

import React from 'react';
import { OrderConfirmationEmail, ShippedEmail, CancelledEmail } from '@/lib/emails/order-confirmation';

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
                template: React.createElement(OrderConfirmationEmail, { orderId, storeName })
            };
        case 'Shipped':
            return {
                subject: `Your order #${orderId} from ${storeName} has shipped!`,
                template: React.createElement(ShippedEmail, { orderId, storeName })
            };
        case 'Cancelled':
             return {
                subject: `Your order #${orderId} from ${storeName} has been cancelled.`,
                template: React.createElement(CancelledEmail, { orderId, storeName })
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

    const { subject, template } = getEmailContent(status, orderId, storeName);
    
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: `"${storeName}" <no-reply@somads.com>`,
                to: to,
                subject: subject,
                react: template,
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
