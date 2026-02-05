'use server';

/**
 * @fileOverview Finalizes store creation. 
 * Decoupled from Genkit Flows to support Edge Runtime.
 */

import { sendWelcomeEmail } from './send-welcome-email';

export type CreateClientStoreInput = {
  userId: string;
  email: string;
  storeName: string;
};

export type CreateClientStoreOutput = {
  success: boolean;
  message: string;
};

export async function createClientStore(input: CreateClientStoreInput): Promise<CreateClientStoreOutput> {
    try {
        await sendWelcomeEmail({
            to: input.email,
            storeName: input.storeName,
        });
        
        return {
            success: true,
            message: 'Welcome email sent successfully.',
        };
    } catch (error: any) {
        console.error('Error in createClientStore:', error);
        return {
            success: false,
            message: error.message || 'Failed to send welcome email.',
        };
    }
}
