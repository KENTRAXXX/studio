import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Ensure Firebase is initialized only once for the serverless function
function getDb() {
    const apps = getApps();
    if (apps.length) {
        return getFirestore(apps[0]);
    }
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
}

export const runtime = 'edge';

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
    // NOTE: This query requires a composite index in Firestore on the `customDomain` field.
    // The index has been added to firestore.indexes.json
    const q = query(storesRef, where('customDomain', '==', domain), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ storeId: null }, { status: 404 });
    }

    const storeDoc = querySnapshot.docs[0];
    // The storeId is the user's ID, which is the document's ID.
    const storeId = storeDoc.id;

    // Return the found storeId
    // In a production environment, you might also add cache headers here.
    return NextResponse.json({ storeId });
  } catch (error) {
    console.error(`Error resolving domain '${domain}':`, error);
    return NextResponse.json({ error: 'Internal server error during domain resolution' }, { status: 500 });
  }
}
