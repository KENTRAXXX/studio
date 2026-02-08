import { NextResponse } from 'next/server';
import { createClientStore } from '@/ai/flows/create-client-store';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, addDoc, runTransaction, query, where, increment } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { sendOrderEmail } from '@/ai/flows/send-order-email';
import { sendReferralActivatedEmail } from '@/ai/flows/send-referral-activated-email';
import { formatCurrency } from '@/utils/format';

export const runtime = 'edge';

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

function getCommissionRate(activeCount: number): number {
    if (activeCount >= 51) return 0.20;
    if (activeCount >= 21) return 0.15;
    return 0.10;
}

/**
 * Verifies the Paystack signature using the Web Crypto API.
 */
async function verifyPaystackSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const bodyData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
    const generatedHash = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return generatedHash === signature;
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
            const orderDocRef = doc(ordersRef, orderId);
            const orderSnap = await transaction.get(orderDocRef);
            
            if (orderSnap.exists()) {
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
                            type: 'TRANSACTION',
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
                    productName: 'Store Profit Aggregation',
                    quantity: 1,
                    shippingCity: shippingAddress?.city || 'Unknown',
                    shippingCountry: shippingAddress?.country || 'Unknown'
                });
            }

            transaction.set(orderDocRef, {
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
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Internal Server Error: Paystack secret not configured.' }, { status: 500 });
  }
  
  const rawBody = await req.text();
  const paystackSignature = req.headers.get('x-paystack-signature') || req.headers.get('x-stack-signature');
  
  if (paystackSignature) {
    const isValid = await verifyPaystackSignature(rawBody, paystackSignature, secret);
    if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody);

  if (event.event === 'charge.success') {
    const { metadata, customer, reference, amount } = event.data;

    if (!metadata) {
        await logWebhookEvent(event.event, event.data, 'failed', 'Missing metadata in charge.success event.');
        return NextResponse.json({ status: 'success', message: 'Event acknowledged, no metadata.' });
    }

    const { userId, plan, cart, storeId, planTier } = metadata;

    if (cart && storeId) {
        await executePaymentSplit(event.data);
    } else if (userId) {
        const firestore = getDb();
        try {
            let emailData: { to: string, referrerName: string, protegeName: string, creditAmount: string } | null = null;

            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, "users", userId);
                const userSnap = await transaction.get(userRef);
                
                if (!userSnap.exists()) throw new Error("User document not found during activation.");
                const userData = userSnap.data();

                const referredBy = userData.referredBy;
                if (referredBy) {
                    const referrerRef = doc(firestore, "users", referredBy);
                    const referrerSnap = await transaction.get(referrerRef);
                    
                    if (referrerSnap.exists() && referrerSnap.data().hasAccess === true) {
                        const referrerData = referrerSnap.data();
                        const currentActiveCount = referrerData.activeReferralCount || 0;
                        const commissionRate = getCommissionRate(currentActiveCount);
                        
                        const tier = userData.planTier || planTier;
                        const interval = userData.plan || plan;
                        const basePrice = basePrices[tier] || 0;
                        const totalCost = interval === 'yearly' ? basePrice * 10 : basePrice;
                        
                        const referralReward = totalCost * commissionRate;

                        if (referralReward > 0) {
                            const payoutRef = doc(collection(firestore, 'payouts_pending'));
                            transaction.set(payoutRef, {
                                userId: referredBy,
                                amount: referralReward,
                                currency: 'USD',
                                status: 'pending_maturity',
                                type: 'referral_reward',
                                referredUserId: userId,
                                createdAt: new Date().toISOString(),
                                description: `${commissionRate * 100}% Referral Reward for ${userData.email || 'New User'} activation.`
                            });

                            transaction.update(referrerRef, {
                                activeReferralCount: increment(1),
                                totalReferralEarnings: increment(referralReward)
                            });

                            emailData = {
                                to: referrerData.email,
                                referrerName: referrerData.displayName || referrerData.email.split('@')[0],
                                protegeName: userData.displayName || userData.email.split('@')[0],
                                creditAmount: formatCurrency(Math.round(referralReward * 100))
                            };
                        }
                    }
                }

                transaction.update(userRef, {
                    hasAccess: true,
                    paidAt: new Date().toISOString(),
                });

                const revenueRef = doc(collection(firestore, 'revenue_logs'));
                transaction.set(revenueRef, {
                    amount: amount / 100,
                    currency: 'USD',
                    type: 'SUBSCRIPTION',
                    userId: userId,
                    paymentReference: reference,
                    createdAt: new Date().toISOString()
                });
            });

            if (emailData) {
                await sendReferralActivatedEmail(emailData).catch(err => {
                    console.error("Failed to send referral activation email:", err);
                });
            }

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
