import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc, or } from 'firebase/firestore';
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
 * Resolves a hostname or subdomain slug to a SOMA storeId.
 * Supports:
 * 1. Full Custom Domains (brand.com)
 * 2. Branded Subdomains (deluxeinc.somatoday.com)
 * 3. Raw Store IDs ([UID].somatoday.com)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  const currentHost = domain.toLowerCase();
  
  // Isolate the slug if it's a subdomain of the root
  let slug = currentHost;
  if (currentHost.endsWith(`.${ROOT_DOMAIN}`)) {
      slug = currentHost.substring(0, currentHost.length - ROOT_DOMAIN.length - 1);
  }

  try {
    const firestore = getDb();
    const storesRef = collection(firestore, 'stores');
    
    // Search by Custom Domain OR Slug OR Store ID
    const q = query(
        storesRef, 
        or(
            where('customDomain', '==', currentHost),
            where('slug', '==', slug),
            where('userId', '==', slug) // Support raw UID as subdomain
        ),
        limit(1)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ storeId: null }, { status: 404 });
    }

    const storeDoc = querySnapshot.docs[0];
    const storeData = storeDoc.data();
    const userId = storeData.userId;

    // Entitlement Validation
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData) {
        return NextResponse.json({ error: 'Store owner profile not found' }, { status: 404 });
    }

    const tier = getTier(userData.planTier);
    
    // Only premium tiers can resolve non-www subdomains or custom domains
    if (!tier.features.customDomains && userData.userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Plan tier unauthorized for branded routing' }, { status: 403 });
    }

    return NextResponse.json({ storeId: storeDoc.id });
  } catch (error) {
    console.error(`Boutique resolution error for '${domain}':`, error);
    return NextResponse.json({ error: 'Internal server error during domain handshake' }, { status: 500 });
  }
}
