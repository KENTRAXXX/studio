'use server';

/**
 * @fileOverview A flow for provisioning a new client store in Firestore.
 *
 * - createClientStore - A function that creates a new store document.
 * - CreateClientStoreInput - The input type for the createClientStore function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { randomUUID } from 'crypto';

// Initialize Firebase Admin SDK
const { firestore } = initializeFirebase();

const CreateClientStoreInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the store is being created.'),
});
export type CreateClientStoreInput = z.infer<typeof CreateClientStoreInputSchema>;

const CreateClientStoreOutputSchema = z.object({
  storeId: z.string(),
  instanceId: z.string(),
  message: z.string(),
});
export type CreateClientStoreOutput = z.infer<typeof CreateClientStoreOutputSchema>;


/**
 * Creates a new client store in Firestore.
 * This is triggered after a user's payment is successfully processed.
 *
 * @param input - The user ID for the new store.
 * @returns The ID of the newly created store and a success message.
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
  async ({ userId }) => {
    const instanceId = randomUUID();
    const storeRef = doc(firestore, 'stores', userId);

    const defaultStoreConfig = {
      userId: userId,
      instanceId: instanceId,
      theme: 'Gold Standard',
      currency: 'USD',
      createdAt: new Date().toISOString(),
    };

    await setDoc(storeRef, defaultStoreConfig);

    // Placeholder for sending a welcome email
    // In a real application, you would integrate with an email service like SendGrid or Resend.
    console.log(`
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      EMAIL SIMULATION
      To: ${userId}
      From: support@soma.com
      Subject: Welcome to SOMA!

      Your store is ready!
      Please point your domain's A record to the IP address: 123.456.78.9
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    `);
    
    return {
      storeId: userId,
      instanceId,
      message: 'Client store created successfully.',
    };
  }
);
