import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export const runtime = 'edge';

const { firestore } = initializeFirebase();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  if (!token || !id) {
    return new Response('Missing token or ID', { status: 400 });
  }

  try {
    const withdrawalRef = doc(firestore, 'withdrawal_requests', id);
    const withdrawalSnap = await getDoc(withdrawalRef);

    if (!withdrawalSnap.exists()) {
      return new Response('Withdrawal request not found.', { status: 404 });
    }

    const data = withdrawalSnap.data();
    if (data.confirmationToken !== token) {
      return new Response('Invalid or expired token.', { status: 401 });
    }
    
    if (data.status !== 'awaiting-confirmation') {
        return NextResponse.redirect(new URL('/payout-confirmed?status=already_confirmed', request.url));
    }

    await updateDoc(withdrawalRef, {
      status: 'pending',
      confirmationToken: null, // Remove token after use
    });
    
    const redirectUrl = new URL('/payout-confirmed', request.url);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Payout confirmation error:', error);
    return new Response('An internal error occurred.', { status: 500 });
  }
}
