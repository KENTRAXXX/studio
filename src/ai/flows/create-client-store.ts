
'use server';

/**
 * @fileOverview A flow for provisioning a new client store in Firestore.
 *
 * - createClientStore - A function that creates a new store document and clones products.
 * - CreateClientStoreInput - The input type for the createClientStore function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, writeBatch, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { randomUUID } from 'crypto';
import { masterCatalog } from '@/lib/data';
import { sendWelcomeEmail } from './send-welcome-email';

// Idempotent Firestore getter for server-side use
const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

const CreateClientStoreInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the store is being created.'),
  plan: z.string().describe('The subscription plan (e.g., "monthly", "yearly").'),
  planTier: z.enum(['MERCHANT', 'SCALER', 'SELLER', 'ENTERPRISE', 'BRAND']),
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
 * Creates a new client store in Firestore, including cloning master products for dropship tiers.
 * This is triggered after a user's payment is successfully processed.
 *
 * @param input - The user ID, plan, tier, and branding details for the new store.
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
  async ({ userId, plan, planTier, template, logoUrl, faviconUrl }) => {
    const firestore = getDb();
    try {
        const instanceId = randomUUID();
        const storeRef = doc(firestore, 'stores', userId);
        const userRef = doc(firestore, 'users', userId);

        const userRole = (planTier === 'SELLER' || planTier === 'BRAND') ? 'SELLER' : 'MOGUL';

        // 1. Update user document to grant access and log payment
        await updateDoc(userRef, {
            hasAccess: true,
            plan: plan,
            paidAt: new Date().toISOString(),
            userRole: userRole,
            planTier: planTier,
        });

        // 2. Create the main store document
        const defaultStoreConfig = {
            userId: userId,
            instanceId: instanceId,
            theme: template === 'gold-standard' ? 'Gold Standard' : template === 'midnight-pro' ? 'Midnight Pro' : 'The Minimalist',
            currency: 'USD',
            createdAt: new Date().toISOString(),
            storeName: "My SOMA Store",
            logoUrl: logoUrl || '',
            faviconUrl: faviconUrl || '',
            heroImageUrl: '',
            heroTitle: 'Welcome to Your Store',
            heroSubtitle: 'Discover curated collections of timeless luxury.',
            status: 'Live',
        };

        await setDoc(storeRef, defaultStoreConfig);

        // 3. Conditionally clone products for Dropship tiers (Scaler, Enterprise)
        if (planTier === 'SCALER' || planTier === 'ENTERPRISE') {
            const productsRef = collection(storeRef, 'products');
            const batch = writeBatch(firestore);
            const top10Products = masterCatalog.slice(0, 10);

            top10Products.forEach(product => {
                const newProductRef = doc(productsRef, product.id);
                const newProductData = {
                    name: product.name,
                    suggestedRetailPrice: product.retailPrice,
                    wholesalePrice: product.masterCost,
                    description: `A high-quality ${product.name.toLowerCase()} from our master collection.`,
                    imageUrl: product.imageId,
                    productType: 'INTERNAL',
                    vendorId: 'admin',
                    isManagedBySoma: true,
                };
                batch.set(newProductRef, newProductData);
            });

            await batch.commit();
        }

        // 4. Send a welcome email
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        if (userData?.email) {
            await sendWelcomeEmail({
                to: userData.email,
                storeName: defaultStoreConfig.storeName,
            });
        }
        
        return {
            storeId: userId,
            instanceId,
            message: 'Client store created successfully.',
        };
    } catch (error: any) {
        console.error('Error in createClientStoreFlow:', error);
        
        const alertsRef = collection(firestore, 'admin_alerts');
        await addDoc(alertsRef, {
            flowName: 'createClientStoreFlow',
            userId: userId,
            error: error.message || 'An unknown error occurred',
            timestamp: new Date().toISOString()
        });

        throw new Error(`Failed to create store for user ${userId}: ${error.message}`);
    }
  }
);
