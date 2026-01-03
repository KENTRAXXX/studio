// src/app/api/paystack-webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClientStore } from '@/ai/flows/create-client-store';

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error('Paystack secret key is not set.');
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  const hash = crypto.createHmac('sha512', secret).update(await req.text()).digest('hex');
  const paystackSignature = req.headers.get('x-paystack-signature');

  // We are re-parsing the body here because the text was already consumed.
  // This is a necessary step to use the raw body for signature verification.
  const body = await req.json();

  if (hash !== paystackSignature) {
    console.error('Invalid Paystack signature.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = body;

  if (event.event === 'charge.success') {
    const customerEmail = event.data.customer.email;
    const { template } = event.data.metadata;

    if (!customerEmail) {
        console.error('Webhook Error: Customer email not found in payload.');
        return NextResponse.json({ error: 'Customer email not found' }, { status: 400 });
    }
    
    // In a real app, you might look up the user by email to get their ID
    // For now, we'll use the email as the basis for the user/store ID
    const userId = customerEmail;

    try {
      console.log(`Payment success for ${userId}. Triggering store creation...`);
      await createClientStore({
        userId,
        template: template || 'gold-standard', // Fallback to a default
      });
      console.log(`Store created successfully for ${userId}.`);
    } catch (error) {
      console.error('Failed to trigger createClientStore flow:', error);
      // Even if store creation fails, we acknowledge the webhook
      // In a production app, you'd add this to a retry queue.
    }
  }

  return NextResponse.json({ status: 'success' });
}
