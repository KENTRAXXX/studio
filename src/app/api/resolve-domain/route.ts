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
 * Resolves a hostname or subdomain slug to a SOMA storeId (UID).
 * Supports:
 * 1. Full Custom Domains (brand.com)
 * 2. Branded Subdomains (deluxeinc.somatoday.com)
 * 3. Raw Store IDs ([UID].somatoday.com)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  
  // Platform Domain Detection
  const hostHeader = request.headers.get('host') || '';
  const detectedRoot = hostHeader.split('.').slice(-2).join('.');
  const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || detectedRoot || 'somatoday.com').toLowerCase();

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  const currentHost = domain.toLowerCase();
  
  // Extract the slug (subdomain prefix) if the request is coming via the platform domain
  let slug = currentHost;
  if (currentHost.endsWith(`.${ROOT_DOMAIN}`)) {
      slug = currentHost.replace(`.${ROOT_DOMAIN}`, '');
  }

  try {
    const firestore = getDb();
    const storesRef = collection(firestore, 'stores');
    
    // Search strategy: Check customDomain, unique slug, or raw UID
    const q = query(
        storesRef, 
        or(
            where('customDomain', '==', currentHost),
            where('slug', '==', slug),
            where('userId', '==', slug)
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

    // Entitlement Validation: Ensure the user's tier permits white-label routing
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData) {
        return NextResponse.json({ error: 'Identity context lost' }, { status: 404 });
    }

    const tier = getTier(userData.planTier);
    
    // If it's a subdomain or custom domain, verify the tier allows it (Admins always bypass)
    const isPlatformRoot = currentHost === ROOT_DOMAIN || currentHost === `www.${ROOT_DOMAIN}`;
    if (!isPlatformRoot && !tier.features.customDomains && userData.userRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Plan tier unauthorized for branded routing' }, { status: 403 });
    }

    // Critical: Returns the storeId which maps to /[domain]/ route
    return NextResponse.json({ storeId: userId });
  } catch (error) {
    console.error(`Boutique resolution error for '${domain}':`, error);
    return NextResponse.json({ error: 'Internal server error during domain handshake' }, { status: 500 });
  }
}
