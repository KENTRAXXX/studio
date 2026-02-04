
'use server';

/**
 * @fileOverview A flow for sending the welcome email after a store is provisioned.
 * Firestore writes have been moved to the client side to comply with security rules.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendWelcomeEmail } from './send-welcome-email';

const CreateClientStoreInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  email: z.string().email().describe('The user email address.'),
  storeName: z.string().describe('The name of the new store.'),
});
export type CreateClientStoreInput = z.infer<typeof CreateClientStoreInputSchema>;

const CreateClientStoreOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type CreateClientStoreOutput = z.infer<typeof CreateClientStoreOutputSchema>;

/**
 * Finalizes the store creation process by sending a welcome email.
 * This should be called after the client has successfully written store data to Firestore.
 */
export async function createClientStore(input: CreateClientStoreInput): Promise<CreateClientStoreOutput> {
  return createClientStoreFlow(input);
}

const createClientStoreFlow = ai.defineFlow(
  {
    name: 'createClientStoreFlow',
    inputSchema: CreateClientStoreInputSchema,
    outputSchema: CreateClientStoreOutputSchema,
  },
  async ({ userId, email, storeName }) => {
    try {
        await sendWelcomeEmail({
            to: email,
            storeName: storeName,
        });
        
        return {
            success: true,
            message: 'Welcome email sent successfully.',
        };
    } catch (error: any) {
        console.error('Error in createClientStoreFlow:', error);
        return {
            success: false,
            message: error.message || 'Failed to send welcome email.',
        };
    }
  }
);
