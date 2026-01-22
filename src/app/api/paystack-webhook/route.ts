
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClientStore } from '@/ai/flows/create-client-store';
import { doc, getDoc, getFirestore, updateDoc, collection, addDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { sendOrderEmail } from '@/ai/flows/send-order-email';

export const runtime = 'edge';

const { firestore } = initializeFirebase();

async function executePaymentSplit(eventData: any) {
    const { reference, metadata, amount, customer } = eventData;
    const { cart, storeId } = metadata;

    if (!cart || !storeId || !reference) {
        throw new Error('Missing cart, storeId, or reference in webhook metadata for product sale.');
    }

    try {
        const orderId = `SOMA-${reference.slice(-6).toUpperCase()}`;

        await runTransaction(firestore, async (transaction) => {
            // --- Idempotency Check ---
            const ordersRef = collection(firestore, `stores/${storeId}/orders`);
            const existingOrderQuery = query(ordersRef, where("paymentReference", "==", reference));
            const existingOrderSnap = await transaction.get(existingOrderQuery);
            if (!existingOrderSnap.empty) {
                console.log(`Order with reference ${reference} has already been processed. Skipping.`);
                return; // Exit transaction
            }
            
            let totalWholesaleCost = 0;
            const payoutDocs: any[] = [];
            const revenueDocs: any[] = [];
            const processedCart: any[] = [];

            // --- Calculate splits for each item ---
            for (const item of cart) {
                const productRef = doc(firestore, `stores/${storeId}/products/${item.id}`);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists()) {
                    throw new Error(`Product with ID ${item.id} not found in store ${storeId}.`);
                }
                const productData = productSnap.data();
                
                const wholesalePrice = productData.wholesalePrice || 0;
                const retailPrice = productData.suggestedRetailPrice || 0;
                const vendorId = productData.vendorId;

                totalWholesaleCost += wholesalePrice * item.quantity;
                
                // Add product pricing data to the cart for historical record
                processedCart.push({
                    ...item,
                    price: retailPrice,
                    wholesalePrice: wholesalePrice
                });
                
                if (vendorId !== 'admin' && productData.isManagedBySoma) { 
                  const platformFee = wholesalePrice * 0.03;
                  const sellerPayout = wholesalePrice - platformFee;

                  // Payout for the Seller
                  if (sellerPayout > 0) {
                      payoutDocs.push({
                          userId: vendorId,
                          amount: sellerPayout * item.quantity,
                          currency: 'NGN',
                          status: 'pending',
                          orderId,
                          paymentReference: reference,
                          createdAt: new Date().toISOString()
                      });
                  }
                   // Log SOMA's revenue
                  if(platformFee > 0) {
                      revenueDocs.push({
                          amount: platformFee * item.quantity,
                          currency: 'NGN',
                          orderId,
                          paymentReference: reference,
                          createdAt: new Date().toISOString()
                      });
                  }
                }
            }

            // --- Calculate Mogul's Profit ---
            const totalPaid = amount / 100;
            const mogulProfit = totalPaid - totalWholesaleCost;
            
            if (mogulProfit > 0) {
                // Payout for the Mogul (store owner)
                payoutDocs.push({
                    userId: storeId, // Mogul's ID is the storeId
                    amount: mogulProfit,
                    currency: 'NGN',
                    status: 'pending',
                    orderId,
                    paymentReference: reference,
                    createdAt: new Date().toISOString()
                });
            }

            // --- Commit all writes to Firestore ---
            // 1. Create the main order document
            const newOrderRef = doc(ordersRef, orderId);
            transaction.set(newOrderRef, {
                orderId,
                status: "Pending",
                cart: processedCart, // Use the cart with historical pricing
                createdAt: new Date().toISOString(),
                total: totalPaid,
                customer: customer,
                paymentReference: reference, // For idempotency
                paymentStatus: 'processed' // Mark as processed
            });

            // 2. Create pending payouts
            const payoutsRef = collection(firestore, 'payouts_pending');
            payoutDocs.forEach(payoutData => {
                const newPayoutRef = doc(payoutsRef);
                transaction.set(newPayoutRef, payoutData);
            });

            // 3. Log platform revenue
            const revenueRef = collection(firestore, 'revenue_logs');
            revenueDocs.forEach(revenueData => {
                const newRevenueRef = doc(revenueRef);
                transaction.set(newRevenueRef, revenueData);
            });

        }); // End of transaction
        
        console.log(`Successfully processed payment split for reference: ${reference}`);

        // --- Send Order Confirmation Email ---
        const storeRef = doc(firestore, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);
        const storeName = storeSnap.data()?.storeName || 'SOMA Store';

        await sendOrderEmail({
            to: customer.email,
            orderId: orderId,
            status: 'Pending',
            storeName: storeName
        });

    } catch (error: any) {
        console.error(`Failed to execute payment split for reference ${reference}:`, error);
        // Optional: Log this failure to a dedicated error collection in Firestore for admin review
        const alertsRef = collection(firestore, 'admin_alerts');
        await addDoc(alertsRef, {
            flowName: 'executePaymentSplit',
            paymentReference: reference,
            error: error.message || 'An unknown transaction error occurred',
            timestamp: new Date().toISOString()
        });
    }
}


export async function POST(req: Request) {
  // NOTE: Firebase Admin SDK (for App Check) is not compatible with the Edge runtime.
  // For production, protect this endpoint by:
  // 1. Using a secret key in the header that you verify here.
  // 2. Using a Cloudflare Worker to validate a JWT or other token.

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('Paystack secret key is not set.');
    return NextResponse.json({ error: 'Internal Server Error: Paystack secret not configured.' }, { status: 500 });
  }
  
  const rawBody = await req.text();
  const paystackSignature = req.headers.get('x-paystack-signature');
  
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  
  if (hash !== paystackSignature) {
    console.error('Invalid Paystack signature.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'charge.success') {
    const { metadata } = event.data;

    if (!metadata) {
        console.warn('Webhook received for charge.success but has no metadata.', event.data);
        return NextResponse.json({ status: 'success', message: 'Event acknowledged, no metadata.' });
    }

    const { userId, plan, template, cart, storeId } = metadata;

    if (cart && storeId) {
        console.log(`Processing product sale for store ${storeId}. Ref: ${event.data.reference}`);
        await executePaymentSplit(event.data);

    } else if (userId) {
        console.log(`Payment success for ${userId}. Triggering store creation...`);
        try {
            const userRef = doc(firestore, "users", userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists() && userSnap.data().hasAccess) {
                console.log(`User ${userId} already has access. Skipping store creation.`);
            } else {
                 const createClientStoreInput = {
                    userId,
                    plan: plan || 'monthly',
                    planTier: metadata.planTier || 'MOGUL',
                    template: template || 'gold-standard',
                };
                await createClientStore(createClientStoreInput);
                console.log(`Store created successfully for ${userId}.`);
            }
        } catch (error) {
            console.error(`Failed to trigger createClientStore flow for ${userId}:`, error);
            const alertsRef = collection(firestore, 'admin_alerts');
            await addDoc(alertsRef, {
                flowName: 'paystackWebhook_createClientStore',
                userId: userId,
                error: (error instanceof Error ? error.message : 'An unknown error occurred during store creation post-payment.'),
                timestamp: new Date().toISOString()
            });
        }
    } else {
        console.warn('Webhook received without actionable metadata.', metadata);
    }
  }

  return NextResponse.json({ status: 'success' });
}
