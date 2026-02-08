import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

export const runtime = 'edge';

// Ensure Firebase is initialized only once for the serverless function
function getDb() {
    const apps = getApps();
    if (apps.length) {
        return getFirestore(apps[0]);
    }
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
}

/**
 * Resolves an email address to a SOMA storeId by querying Firestore.
 * This is used for identity-based routing in middleware.
 * @param request The incoming Next.js request.
 * @returns A JSON response with the storeId or an error.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  }

  try {
    const firestore = getDb();
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ storeId: null }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const storeId = userDoc.id;

    return NextResponse.json({ storeId });
  } catch (error) {
    console.error(`Error resolving user by email '${email}':`, error);
    return NextResponse.json({ error: 'Internal server error during user resolution' }, { status: 500 });
  }
}
