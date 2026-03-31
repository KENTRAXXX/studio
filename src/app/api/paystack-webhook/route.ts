import { NextResponse } from 'next/server';
import { createClientStore } from '@/ai/flows/create-client-store';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, addDoc, runTransaction, increment } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { sendOrderEmail } from '@/ai/flows/send-order-email';
import { sendReferralActivatedEmail } from '@/ai/flows/send-referral-activated-email';
import { formatCurrency } from '@/utils/format';
import { getTier } from '@/lib/tiers';

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
        console.error("Critical: Failed to log webhook event", e);
    }
}

async function verifyPaystackSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const bodyData = encoder.encode(payload);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, bodyData);
    const generatedHash = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return generatedHash === signature;
}

async function executePaymentSplit(eventData: any) {
    const firestore = getDb();
    const { reference, metadata, amount, customer } = eventData;
    const { cart, storeId, shippingAddress } = metadata;

    if (!cart || !storeId || !reference) {
        throw new Error('Missing metadata for product sale.');
    }

    const orderId = `SOMA-${reference.slice(-6).toUpperCase()}`;

    await runTransaction(firestore, async (transaction) => {
        const orderDocRef = doc(firestore, `stores/${storeId}/orders`, orderId);
        const orderSnap = await transaction.get(orderDocRef);
        if (orderSnap.exists()) return;
        
        let totalWholesaleCost = 0;
        const payoutDocs: any[] = [];
        const revenueDocs: any[] = [];
        const processedCart: any[] = [];

        for (const item of cart) {
            const productRef = doc(firestore, `stores/${storeId}/products/${item.id}`);
            const productSnap = await transaction.get(productRef);
            if (!productSnap.exists()) continue;
            
            const productData = productSnap.data();
            const wholesalePrice = productData.wholesalePrice || 0;
            const vendorId = productData.vendorId;

            totalWholesaleCost += wholesalePrice * item.quantity;
            processedCart.push({ ...item, price: productData.suggestedRetailPrice, wholesalePrice });
            
            if (vendorId !== 'admin' && productData.isManagedBySoma) { 
                const vendorRef = doc(firestore, "users", vendorId);
                const vendorSnap = await transaction.get(vendorRef);
                if (vendorSnap.exists()) {
                    const vendorTier = getTier(vendorSnap.data().planTier);
                    const platformFee = wholesalePrice * vendorTier.commissionRate;
                    const sellerPayout = wholesalePrice - platformFee;

                    if (sellerPayout > 0) {
                        payoutDocs.push({
                            userId: vendorId,
                            amount: sellerPayout * item.quantity,
                            status: 'pending',
                            orderId,
                            createdAt: new Date().toISOString(),
                            productName: productData.name,
                            quantity: item.quantity
                        });
                    }
                    if (platformFee > 0) {
                        revenueDocs.push({ amount: platformFee * item.quantity, type: 'TRANSACTION', orderId, createdAt: new Date().toISOString() });
                    }
                }
            }
        }

        const mogulProfit = (amount / 100) - totalWholesaleCost;
        if (mogulProfit > 0) {
            payoutDocs.push({
                userId: storeId,
                amount: mogulProfit,
                status: 'pending',
                orderId,
                createdAt: new Date().toISOString(),
                productName: 'Store Profit Aggregation'
            });
        }

        transaction.set(orderDocRef, {
            orderId, status: "Pending", cart: processedCart, createdAt: new Date().toISOString(),
            total: amount / 100, customer, shippingAddress, paymentReference: reference
        });

        payoutDocs.forEach(p => transaction.set(doc(collection(firestore, 'payouts_pending')), p));
        revenueDocs.forEach(r => transaction.set(doc(collection(firestore, 'revenue_logs')), r));
    });
}

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Secret not configured' }, { status: 500 });
  
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');
  if (signature && !(await verifyPaystackSignature(rawBody, signature, secret))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.event === 'charge.success') {
    const { metadata, customer, reference, amount } = event.data;
    if (!metadata) return NextResponse.json({ status: 'success' });

    const { userId, cart, storeId, planTier } = metadata;

    if (cart && storeId) {
        await executePaymentSplit(event.data);
    } else if (userId) {
        const firestore = getDb();
        try {
            let emailData: any = null;
            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, "users", userId);
                const userSnap = await transaction.get(userRef);
                if (!userSnap.exists()) return;
                
                const referredBy = userSnap.data().referredBy;
                if (referredBy) {
                    const referrerRef = doc(firestore, "users", referredBy);
                    const referrerSnap = await transaction.get(referrerRef);
                    if (referrerSnap.exists() && referrerSnap.data().planTier === 'AMBASSADOR') {
                        const rewardAmount = 5.00;
                        const payoutRef = doc(collection(firestore, 'payouts_pending'));
                        transaction.set(payoutRef, {
                            userId: referredBy,
                            amount: rewardAmount,
                            status: 'pending_maturity',
                            type: 'ambassador_reward',
                            referredUserId: userId,
                            createdAt: new Date().toISOString(),
                            description: `Ambassador Conversion: ${userSnap.data().email} activation.`
                        });
                        transaction.update(referrerRef, {
                            activeReferralCount: increment(1),
                            totalReferralEarnings: increment(rewardAmount)
                        });
                        emailData = {
                            to: referrerSnap.data().email,
                            referrerName: referrerSnap.data().displayName || 'Partner',
                            protegeName: userSnap.data().email.split('@')[0],
                            creditAmount: formatCurrency(500)
                        };
                    }
                }
                transaction.update(userRef, { hasAccess: true, paidAt: new Date().toISOString() });
                transaction.set(doc(collection(firestore, 'revenue_logs')), { amount: amount / 100, type: 'SUBSCRIPTION', userId, createdAt: new Date().toISOString() });
            });

            if (emailData) await sendReferralActivatedEmail(emailData).catch(console.error);
            if (planTier !== 'SELLER' && planTier !== 'BRAND' && planTier !== 'AMBASSADOR') {
                await createClientStore({ userId, email: customer.email, storeName: 'Your SOMA Store' });
            }
            await logWebhookEvent(event.event, event.data, 'success');
        } catch (error: any) {
            await logWebhookEvent(event.event, event.data, 'failed', error.message);
        }
    }
  }
  return NextResponse.json({ status: 'success' });
}
