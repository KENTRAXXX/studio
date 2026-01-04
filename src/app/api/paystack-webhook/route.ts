
// src/app/api/paystack-webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClientStore } from '@/ai/flows/create-client-store';
import { doc, getDoc, getFirestore, updateDoc, collection, addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';


const { firestore } = initializeFirebase();

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error('Paystack secret key is not set.');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
  
  // Need to read the raw text for signature verification
  const text = await req.text();
  const hash = crypto.createHmac('sha512', secret).update(text).digest('hex');
  const paystackSignature = req.headers.get('x-paystack-signature');
  
  // Now parse the JSON body
  const event = JSON.parse(text);

  if (hash !== paystackSignature) {
    console.error('Invalid Paystack signature.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }


  if (event.event === 'charge.success') {
    const { metadata, reference } = event.data;
    const { userId, plan, template, cart, storeId } = metadata;

    // Check if this is a product sale or a new subscription
    if (cart && storeId) {
        // This is a product sale, trigger payment split logic
        console.log(`Processing product sale for store ${storeId}. Ref: ${reference}`);
        
        // TODO: Implement the 'executePaymentSplit' logic here.
        // 1. Fetch each product from the Master_Catalog or Private_Inventory to get wholesalePrice.
        // 2. Calculate platformFee, sellerPayout, and mogulProfit.
        // 3. Create documents in new 'payouts' collections for sellers and moguls.
        // 4. Log the platform fee to a 'SOMA_Revenue' collection.
        // 5. Ensure this is idempotent by checking if a payout for this 'reference' already exists.

        // Placeholder for now
        const orderId = `SOMA-${reference.slice(-6).toUpperCase()}`;
        const ordersRef = collection(firestore, `stores/${storeId}/orders`);
        await addDoc(ordersRef, {
            orderId: orderId,
            status: "Pending",
            cart: cart,
            createdAt: new Date().toISOString(),
            total: event.data.amount / 100, // Amount is in kobo/cents
            customer: event.data.customer,
        });

        console.log("Order document created successfully.");


    } else if (userId) {
        // This is a new user subscription, trigger store creation
        console.log(`Payment success for ${userId}. Triggering store creation...`);
        try {
            const userRef = doc(firestore, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().hasAccess) {
                console.log(`User ${userId} already has access. Skipping store creation.`);
            } else {
                await createClientStore({
                    userId,
                    plan: plan || 'monthly',
                    template: template || 'gold-standard',
                });
                console.log(`Store created successfully for ${userId}.`);
            }
        } catch (error) {
            console.error(`Failed to trigger createClientStore flow for ${userId}:`, error);
        }
    } else {
        console.warn('Webhook received without actionable metadata.', metadata);
    }
  }

  return NextResponse.json({ status: 'success' });
}

    