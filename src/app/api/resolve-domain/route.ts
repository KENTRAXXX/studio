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
 * Resolves a custom domain to a SOMA storeId by querying Firestore.
 * Enforces tier-based access control from src/lib/tiers.ts.
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
    const q = query(storesRef, where('customDomain', '==', domain.toLowerCase()), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ storeId: null }, { status: 404 });
    }

    const storeDoc = querySnapshot.docs[0];
    const storeData = storeDoc.data();
    const userId = storeData.userId;

    // Validate tier entitlement
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData) {
        return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    const tier = getTier(userData.planTier);
    
    // Only Scalers, Merchants, and Enterprise (and Admins) can resolve custom domains
    const allowedTiers = ['SCALER', 'MERCHANT', 'ENTERPRISE', 'ADMIN'];
    if (!allowedTiers.includes(tier.id)) {
        console.warn(`Unauthorized domain resolution attempt for domain ${domain} by tier ${tier.id}`);
        return NextResponse.json({ error: 'Tier not authorized for custom domains' }, { status: 403 });
    }

    return NextResponse.json({ storeId: storeDoc.id });
  } catch (error) {
    console.error(`Error resolving domain '${domain}':`, error);
    return NextResponse.json({ error: 'Internal server error during domain resolution' }, { status: 500 });
  }
}
