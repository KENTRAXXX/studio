// src/app/api/paystack-webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClientStore } from '@/ai/flows/create-client-store';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
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
    const { metadata } = event.data;
    const { userId, plan, template } = metadata;

    if (!userId) {
        console.error('Webhook Error: userId not found in payment metadata.');
        return NextResponse.json({ error: 'User ID not found in metadata' }, { status: 400 });
    }
    
    try {
      console.log(`Payment success for ${userId}. Triggering store creation...`);

      // Check if user has already been granted access to prevent re-provisioning
      const userRef = doc(firestore, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().hasAccess) {
        console.log(`User ${userId} already has access. Skipping store creation.`);
        return NextResponse.json({ status: 'success', message: 'User already has access.' });
      }

      await createClientStore({
        userId,
        plan: plan || 'monthly',
        template: template || 'gold-standard',
      });
      console.log(`Store created successfully for ${userId}.`);
    } catch (error) {
      console.error(`Failed to trigger createClientStore flow for ${userId}:`, error);
      // Even if store creation fails, we acknowledge the webhook
      // In a production app, you'd add this to a retry queue.
    }
  }

  return NextResponse.json({ status: 'success' });
}
