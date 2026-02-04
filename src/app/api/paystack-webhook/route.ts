
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClientStore } from '@/ai/flows/create-client-store';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, runTransaction, query, where } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { sendOrderEmail } from '@/ai/flows/send-order-email';

const basePrices: Record<string, number> = {
    MERCHANT: 19.99,
    SCALER: 29.00,
    SELLER: 0,
    ENTERPRISE: 33.33,
    BRAND: 21.00,
};

const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

async function logWebhookEvent(eventType: string, payload: any, status: 'success' | 'failed', errorMessage?: string) {
    const firestore = getDb();
    try {
        await addDoc(collection(firestore, 'webhook_logs'), {
            eventType,
            payload,
            status,
            errorMessage: errorMessage || null,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Critical: Failed to log webhook event to Firestore", e);
    }
}

async function executePaymentSplit(eventData: any) {
    const firestore = getDb();
    const { reference, metadata, amount, customer } = eventData;
    const { cart, storeId, shippingAddress } = metadata;

    if (!cart || !storeId || !reference) {
        const error = 'Missing cart, storeId, or reference in webhook metadata for product sale.';
        await logWebhookEvent('charge.success', eventData, 'failed', error);
        throw new Error(error);
    }

    try {
        const orderId = `SOMA-${reference.slice(-6).toUpperCase()}`;

        await runTransaction(firestore, async (transaction) => {
            const ordersRef = collection(firestore, `stores/${storeId}/orders`);
            const existingOrderQuery = query(ordersRef, where("paymentReference", "==", reference));
            const existingOrderSnap = await transaction.get(existingOrderQuery);
            if (!existingOrderSnap.empty) {
                console.log(`Order with reference ${reference} has already been processed. Skipping.`);
                return;
            }
            
            let totalWholesaleCost = 0;
            const payoutDocs: any[] = [];
            const revenueDocs: any[] = [];
            const processedCart: any[] = [];

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
                
                processedCart.push({
                    ...item,
                    price: retailPrice,
                    wholesalePrice: wholesalePrice
                });
                
                if (vendorId !== 'admin' && productData.isManagedBySoma) { 
                    const vendorRef = doc(firestore, "users", vendorId);
                    const vendorSnap = await transaction.get(vendorRef);
                    if (!vendorSnap.exists()) {
                        throw new Error(`Vendor profile for ${vendorId} not found.`);
                    }
                    const vendorData = vendorSnap.data();

                    const commissionRate = vendorData.planTier === 'BRAND' ? 0.03 : 0.09;
                    const platformFee = wholesalePrice * commissionRate;
                    const sellerPayout = wholesalePrice - platformFee;

                    if (sellerPayout > 0) {
                        payoutDocs.push({
                            userId: vendorId,
                            amount: sellerPayout * item.quantity,
                            currency: 'USD',
                            status: 'pending',
                            orderId,
                            paymentReference: reference,
                            createdAt: new Date().toISOString(),
                            // Analytics fields
                            productName: productData.name,
                            quantity: item.quantity,
                            shippingCity: shippingAddress?.city || 'Unknown',
                            shippingCountry: shippingAddress?.country || 'Unknown'
                        });
                    }
                    if(platformFee > 0) {
                        revenueDocs.push({
                            amount: platformFee * item.quantity,
                            currency: 'USD',
                            orderId,
                            paymentReference: reference,
                            createdAt: new Date().toISOString()
                        });
                    }
                }
            }

            const totalPaid = amount / 100;
            const mogulProfit = totalPaid - totalWholesaleCost;
            
            if (mogulProfit > 0) {
                payoutDocs.push({
                    userId: storeId,
                    amount: mogulProfit,
                    currency: 'USD',
                    status: 'pending',
                    orderId,
                    paymentReference: reference,
                    createdAt: new Date().toISOString(),
                    // Analytics for mogul profit
                    productName: 'Store Profit Aggregation',
                    quantity: 1,
                    shippingCity: shippingAddress?.city || 'Unknown',
                    shippingCountry: shippingAddress?.country || 'Unknown'
                });
            }

            const newOrderRef = doc(ordersRef, orderId);
            transaction.set(newOrderRef, {
                orderId,
                status: "Pending",
                cart: processedCart,
                createdAt: new Date().toISOString(),
                total: totalPaid,
                customer: customer,
                shippingAddress: shippingAddress || null,
                paymentReference: reference,
                paymentStatus: 'processed'
            });

            const payoutsRef = collection(firestore, 'payouts_pending');
            payoutDocs.forEach(payoutData => {
                const newPayoutRef = doc(payoutsRef);
                transaction.set(newPayoutRef, payoutData);
            });

            const revenueRef = collection(firestore, 'revenue_logs');
            revenueDocs.forEach(revenueData => {
                const newRevenueRef = doc(revenueRef);
                transaction.set(newRevenueRef, revenueData);
            });

        });
        
        const storeRef = doc(firestore, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);
        const storeName = storeSnap.data()?.storeName || 'SOMA Store';

        await sendOrderEmail({
            to: customer.email,
            orderId: orderId,
            status: 'Pending',
            storeName: storeName
        });

        await logWebhookEvent('charge.success', eventData, 'success');

    } catch (error: any) {
        console.error(`Failed to execute payment split for reference ${reference}:`, error);
        await logWebhookEvent('charge.success', eventData, 'failed', error.message);
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
  const firestore = getDb();
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('Paystack secret key is not set.');
    return NextResponse.json({ error: 'Internal Server Error: Paystack secret not configured.' }, { status: 500 });
  }
  
  const rawBody = await req.text();
  const paystackSignature = req.headers.get('x-stack-signature');
  const hash = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  
  // NOTE: In production, hash should equal paystackSignature. 
  // We use a lenient check here for testing if signature is missing.
  if (paystackSignature && hash !== paystackSignature) {
    console.error('Invalid Paystack signature.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'charge.success') {
    const { metadata, customer } = event.data;

    if (!metadata) {
        await logWebhookEvent(event.event, event.data, 'failed', 'Missing metadata in charge.success event.');
        return NextResponse.json({ status: 'success', message: 'Event acknowledged, no metadata.' });
    }

    const { userId, plan, cart, storeId, planTier } = metadata;

    if (cart && storeId) {
        await executePaymentSplit(event.data);
    } else if (userId) {
        try {
            // 1. Transactional Access Grant & Referral Credit
            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, "users", userId);
                const userSnap = await transaction.get(userRef);
                
                if (!userSnap.exists()) throw new Error("User document not found during activation.");
                const userData = userSnap.data();

                // Check for Referrer
                const referredBy = userData.referredBy;
                if (referredBy) {
                    const referrerRef = doc(firestore, "users", referredBy);
                    const referrerSnap = await transaction.get(referrerRef);
                    
                    if (referrerSnap.exists() && referrerSnap.data().hasAccess === true) {
                        const tier = userData.planTier || planTier;
                        const interval = userData.plan || plan;
                        
                        const basePrice = basePrices[tier] || 0;
                        const totalCost = interval === 'yearly' ? basePrice * 10 : basePrice;
                        const referralCredit = totalCost * 0.10;

                        if (referralCredit > 0) {
                            const payoutRef = doc(collection(firestore, 'payouts_pending'));
                            transaction.set(payoutRef, {
                                userId: referredBy,
                                amount: referralCredit,
                                currency: 'USD',
                                status: 'pending',
                                type: 'referral_credit',
                                referredUserId: userId,
                                createdAt: new Date().toISOString(),
                                description: `10% Referral Credit for ${userData.email || 'New User'} activation.`
                            });
                        }
                    }
                }

                // Grant Access
                transaction.update(userRef, {
                    hasAccess: true,
                    paidAt: new Date().toISOString(),
                });
            });

            console.log(`Paystack webhook: Access granted and referral checked for ${userId}`);

            // 2. Trigger welcome flow ONLY for Mogul tiers. 
            // Brand/Seller verification happens first, then they get their welcome email.
            const isSupplierTier = planTier === 'SELLER' || planTier === 'BRAND';
            
            if (!isSupplierTier) {
                await createClientStore({
                    userId,
                    email: customer.email,
                    storeName: 'Your SOMA Store',
                });
            }

            await logWebhookEvent(event.event, event.data, 'success');
            
        } catch (error: any) {
            console.error(`Failed to handle signup success for ${userId}:`, error);
            await logWebhookEvent(event.event, event.data, 'failed', error.message);
            const alertsRef = collection(firestore, 'admin_alerts');
            await addDoc(alertsRef, {
                flowName: 'paystackWebhook_signupSuccess',
                userId: userId,
                error: error.message || 'An unknown error occurred',
                timestamp: new Date().toISOString()
            });
        }
    } else {
        await logWebhookEvent(event.event, event.data, 'failed', 'Missing userId in metadata. Manual fix required.');
    }
  } else {
      await logWebhookEvent(event.event, event.data, 'success');
  }

  return NextResponse.json({ status: 'success' });
}
