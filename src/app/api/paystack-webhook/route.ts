import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClientStore } from '@/ai/flows/create-client-store';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, runTransaction, query, where } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { sendOrderEmail } from '@/ai/flows/send-order-email';

const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

async function executePaymentSplit(eventData: any) {
    const firestore = getDb();
    const { reference, metadata, amount, customer } = eventData;
    const { cart, storeId } = metadata;

    if (!cart || !storeId || !reference) {
        throw new Error('Missing cart, storeId, or reference in webhook metadata for product sale.');
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
                            createdAt: new Date().toISOString()
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
                    createdAt: new Date().toISOString()
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

    } catch (error: any) {
        console.error(`Failed to execute payment split for reference ${reference}:`, error);
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
        return NextResponse.json({ status: 'success', message: 'Event acknowledged, no metadata.' });
    }

    const { userId, plan, cart, storeId } = metadata;

    if (cart && storeId) {
        await executePaymentSplit(event.data);
    } else if (userId) {
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
                    template: 'gold-standard',
                };
                await createClientStore(createClientStoreInput);
            }
        } catch (error: any) {
            console.error(`Failed to trigger createClientStore flow for ${userId}:`, error);
            const alertsRef = collection(firestore, 'admin_alerts');
            await addDoc(alertsRef, {
                flowName: 'paystackWebhook_createClientStore',
                userId: userId,
                error: error.message || 'An unknown error occurred',
                timestamp: new Date().toISOString()
            });
        }
    }
  }

  return NextResponse.json({ status: 'success' });
}