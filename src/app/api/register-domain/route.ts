import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { doc, getDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { addDomainToVercel } from '@/lib/vercel-domains';
import { getTier } from '@/lib/tiers';

/**
 * @fileOverview API route to register custom hostnames via Vercel API.
 * Flow: Auth Check -> Tier Check -> Vercel Call -> Database Link.
 */

const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { domain, storeId } = body;

    if (!domain || !storeId) {
      return NextResponse.json({ error: 'Missing domain or storeId' }, { status: 400 });
    }

    const firestore = getDb();

    // 1. Auth & Tier Check: Verify user exists and is allowed to have a custom domain
    const userRef = doc(firestore, 'users', storeId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userSnap.exists() || !userData) {
        return NextResponse.json({ error: 'Identity not found.' }, { status: 404 });
    }

    if (!userData.hasAccess) {
        return NextResponse.json({ error: 'Subscription required for custom domain mapping.' }, { status: 403 });
    }

    const tier = getTier(userData.planTier);
    if (!tier.features.customDomains && userData.userRole !== 'ADMIN') {
        return NextResponse.json({ 
            error: `Your current tier (${tier.label}) does not support custom domains. Please upgrade to Scaler or Enterprise.` 
        }, { status: 403 });
    }

    // 2. Vercel Call: Register with Vercel Project Domains API
    try {
        await addDomainToVercel(domain);
    } catch (e: any) {
        console.error("Vercel Domain Add Error:", e);
        return NextResponse.json({ 
            error: `Vercel Integration Error: ${e.message}` 
        }, { status: 500 });
    }

    // 3. Database: Link the domain to the store record
    const storeRef = doc(firestore, 'stores', storeId);
    
    const isSubdomain = domain.split('.').length > 2;
    const dnsTarget = isSubdomain ? 'cname.vercel-dns.com' : '76.76.21.21';
    const dnsType = isSubdomain ? 'CNAME' : 'A';

    const verificationInfo = {
      customDomain: domain.toLowerCase().trim(),
      domainStatus: 'pending_dns',
      vercelVerified: false,
      dnsRecord: {
          type: dnsType,
          name: isSubdomain ? domain.split('.')[0] : '@',
          value: dnsTarget
      },
      lastVercelSync: new Date().toISOString()
    };

    await updateDoc(storeRef, verificationInfo);

    return NextResponse.json({ 
      success: true, 
      message: 'Domain registered on Vercel and records synchronized.',
      data: verificationInfo
    });

  } catch (error: any) {
    console.error('Domain registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
