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
 * Resolves a custom domain to a SOMA storeId by querying Firestore.
 * @param request The incoming Next.js request.
 * @returns A JSON response with the storeId or an error.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  try {
    const firestore = getDb();
    const storesRef = collection(firestore, 'stores');
    const q = query(storesRef, where('customDomain', '==', domain), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ storeId: null }, { status: 404 });
    }

    const storeDoc = querySnapshot.docs[0];
    const storeId = storeDoc.id;

    return NextResponse.json({ storeId });
  } catch (error) {
    console.error(`Error resolving domain '${domain}':`, error);
    return NextResponse.json({ error: 'Internal server error during domain resolution' }, { status: 500 });
  }
}
