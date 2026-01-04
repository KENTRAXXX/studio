
// src/app/api/paystack-webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClientStore } from '@/ai/flows/create-client-store';
import { doc, getDoc, getFirestore, updateDoc, collection, addDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';


const { firestore } = initializeFirebase();

async function executePaymentSplit(eventData: any) {
    const { reference, metadata, amount, customer } = eventData;
    const { cart, storeId } = metadata;

    if (!cart || !storeId || !reference) {
        throw new Error('Missing cart, storeId, or reference in webhook metadata for product sale.');
    }

    try {
        await runTransaction(firestore, async (transaction) => {
            const orderId = `SOMA-${reference.slice(-6).toUpperCase()}`;

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

            // --- Calculate splits for each item ---
            for (const item of cart) {
                const productRef = doc(firestore, `Master_Catalog/${item.id}`);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists()) {
                    throw new Error(`Product with ID ${item.id} not found in Master_Catalog.`);
                }
                const productData = productSnap.data();
                
                const wholesalePrice = productData.masterCost || 0; // Renamed from wholesalePrice
                const retailPrice = productData.retailPrice || 0; // This is the price the Mogul set
                const vendorId = productData.vendorId;

                totalWholesaleCost += wholesalePrice * item.quantity;
                
                if (vendorId !== 'admin') { // Only split for external seller products
                  const platformFee = wholesalePrice * 0.03;
                  const sellerPayout = wholesalePrice - platformFee;

                  // Payout for the Seller
                  payoutDocs.push({
                      userId: vendorId,
                      amount: sellerPayout * item.quantity,
                      currency: 'NGN',
                      status: 'pending',
                      orderId,
                      paymentReference: reference,
                      createdAt: new Date().toISOString()
                  });
                   // Log SOMA's revenue
                  revenueDocs.push({
                      amount: platformFee * item.quantity,
                      currency: 'NGN',
                      orderId,
                      paymentReference: reference,
                      createdAt: new Date().toISOString()
                  });
                }
            }

            // --- Calculate Mogul's Profit ---
            const totalPaid = amount / 100;
            const mogulProfit = totalPaid - totalWholesaleCost;
            
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

            // --- Commit all writes to Firestore ---
            // 1. Create the main order document
            const newOrderRef = doc(ordersRef, orderId);
            transaction.set(newOrderRef, {
                orderId,
                status: "Pending",
                cart: cart,
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
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error('Paystack secret key is not set.');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
  
  const text = await req.text();
  const hash = crypto.createHmac('sha512', secret).update(text).digest('hex');
  const paystackSignature = req.headers.get('x-paystack-signature');
  
  const event = JSON.parse(text);

  if (hash !== paystackSignature) {
    console.error('Invalid Paystack signature.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }


  if (event.event === 'charge.success') {
    const { metadata } = event.data;
    const { userId, plan, template, cart, storeId } = metadata;

    if (cart && storeId) {
        // This is a product sale, trigger payment split logic
        console.log(`Processing product sale for store ${storeId}. Ref: ${event.data.reference}`);
        await executePaymentSplit(event.data);

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

    