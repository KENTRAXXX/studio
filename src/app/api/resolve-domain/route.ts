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
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  const currentHost = domain.toLowerCase();
  
  // Platform Domain Detection
  const hostHeader = request.headers.get('host') || '';
  const detectedRoot = hostHeader.split('.').slice(-2).join('.');
  const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || detectedRoot || 'somatoday.com').toLowerCase();

  console.log(`[SOMA Resolver] Domain: ${currentHost} | Root: ${ROOT_DOMAIN}`);

  // Extract the slug (subdomain prefix) if the request is coming via the platform domain
  let slug = currentHost;
  if (currentHost.endsWith(`.${ROOT_DOMAIN}`)) {
      slug = currentHost.replace(`.${ROOT_DOMAIN}`, '');
  }

  // Handle www. prefixes for both custom domains and platform subdomains
  if (slug.startsWith('www.')) {
      slug = slug.replace('www.', '');
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
      console.warn(`[SOMA Resolver] No boutique found for: ${currentHost} (slug: ${slug})`);
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
    
    // Check if the currentHost is exactly the root or www (handled by middleware but here for safety)
    const isPlatformRoot = currentHost === ROOT_DOMAIN || currentHost === `www.${ROOT_DOMAIN}`;
    
    // Entitlement check: allow platform subdomains for all Moguls, restrict custom domains by tier
    const isCustomDomain = currentHost !== `${slug}.${ROOT_DOMAIN}` && !isPlatformRoot;
    if (isCustomDomain && !tier.features.customDomains && userData.userRole !== 'ADMIN') {
        console.warn(`[SOMA Resolver] Tier '${userData.planTier}' unauthorized for custom domain: ${currentHost}`);
        return NextResponse.json({ error: 'Plan tier unauthorized for branded routing' }, { status: 403 });
    }

    console.log(`[SOMA Resolver] Success: ${currentHost} -> ${userId}`);
    return NextResponse.json({ storeId: userId });
  } catch (error) {
    console.error(`[SOMA Resolver] Internal error for '${domain}':`, error);
    return NextResponse.json({ error: 'Internal server error during domain handshake' }, { status: 500 });
  }
}
