'use server';

/**
 * @fileOverview A flow for provisioning a new client store in Firestore.
 *
 * - createClientStore - A function that creates a new store document and clones products.
 * - CreateClientStoreInput - The input type for the createClientStore function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirestore, doc, setDoc, collection, writeBatch, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { randomUUID } from 'crypto';
import { masterCatalog } from '@/lib/data'; // Assuming master catalog is here

// Initialize Firebase
const { firestore } = initializeFirebase();

const CreateClientStoreInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the store is being created.'),
  plan: z.string().describe('The subscription plan (e.g., "monthly", "lifetime").'),
  template: z.string().describe('The selected template for the store.'),
  logoUrl: z.string().optional().describe("URL of the store's logo."),
  faviconUrl: z.string().optional().describe("URL of the store's favicon."),
});
export type CreateClientStoreInput = z.infer<typeof CreateClientStoreInputSchema>;

const CreateClientStoreOutputSchema = z.object({
  storeId: z.string(),
  instanceId: z.string(),
  message: z.string(),
});
export type CreateClientStoreOutput = z.infer<typeof CreateClientStoreOutputSchema>;


/**
 * Creates a new client store in Firestore, including cloning master products.
 * This is triggered after a user's payment is successfully processed.
 *
 * @param input - The user ID and branding details for the new store.
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
  async ({ userId, plan, template, logoUrl, faviconUrl }) => {
    const instanceId = randomUUID();
    const storeRef = doc(firestore, 'stores', userId);
    const userRef = doc(firestore, 'users', userId);
    const productsRef = collection(storeRef, 'products');

    // 1. Update user document to grant access
    await updateDoc(userRef, {
        hasAccess: true,
        plan: plan,
        paidAt: new Date().toISOString()
    });

    // 2. Create the main store document
    const defaultStoreConfig = {
      userId: userId,
      instanceId: instanceId,
      theme: template === 'gold-standard' ? 'Gold Standard' : template === 'midnight-pro' ? 'Midnight Pro' : 'The Minimalist',
      currency: 'USD',
      createdAt: new Date().toISOString(),
      storeName: "My SOMA Store", // Default name, user can change later
      logoUrl: logoUrl || '',
      heroImageUrl: '',
      heroTitle: 'Welcome to Your Store',
      heroSubtitle: 'Discover curated collections of timeless luxury.',
      status: 'Live', // Set status to Live
    };

    await setDoc(storeRef, defaultStoreConfig);

    // 3. Deep Clone: Copy top 10 products from master catalog
    const batch = writeBatch(firestore);
    const top10Products = masterCatalog.slice(0, 10);

    top10Products.forEach(product => {
      const newProductRef = doc(productsRef, product.id);
      const newProductData = {
          name: product.name,
          price: product.retailPrice,
          description: `A high-quality ${product.name.toLowerCase()} from our master collection.`, // Placeholder description
          imageUrl: product.imageId, // We'll use the imageId to resolve the URL on the frontend
      };
      batch.set(newProductRef, newProductData);
    });

    await batch.commit();


    // 4. Placeholder for sending a welcome email
    console.log(`
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      EMAIL SIMULATION
      To: user with ID ${userId}
      From: support@soma.com
      Subject: Welcome to SOMA! Your Store is LIVE!

      Your payment was successful and your store is now ready!
      Please point your domain's A record to the IP address: 123.456.78.9
      You can now manage your store at: /dashboard/my-store
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    `);
    
    return {
      storeId: userId,
      instanceId,
      message: 'Client store created and products cloned successfully.',
    };
  }
);
