import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getTier } from '@/lib/tiers';

function getDb() {
    const apps = getApps();
    if (apps.length) {
        return getFirestore(apps[0]);
    }
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
}

/**
 * Resolves a custom domain (or registered subdomain) to a SOMA storeId.
 * Enforces tier-based access control to protect premium features.
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
    
    // Check for a custom domain mapping in Firestore
    const q = query(storesRef, where('customDomain', '==', domain.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ storeId: null }, { status: 404 });
    }

    const storeDoc = querySnapshot.docs[0];
    const storeData = storeDoc.data();
    const userId = storeData.userId;

    // Validate tier entitlement: Only specific tiers can utilize custom domains/subdomains
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData) {
        return NextResponse.json({ error: 'Store owner profile not found' }, { status: 404 });
    }

    const tier = getTier(userData.planTier);
    
    // Entitlement Check: Ensure the user's plan supports white-labeled domains
    if (!tier.features.customDomains && userData.userRole !== 'ADMIN') {
        console.warn(`Unauthorized domain resolution: Tier ${tier.id} does not support custom domains.`);
        return NextResponse.json({ error: 'Plan tier unauthorized for custom domains' }, { status: 403 });
    }

    return NextResponse.json({ storeId: storeDoc.id });
  } catch (error) {
    console.error(`Boutique resolution error for '${domain}':`, error);
    return NextResponse.json({ error: 'Internal server error during domain handshake' }, { status: 500 });
  }
}
