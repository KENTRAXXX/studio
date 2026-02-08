import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview API route to poll Cloudflare for the latest custom hostname status.
 */

const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
  }

  const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;
  const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
  const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

  if (!CLOUDFLARE_EMAIL || !CLOUDFLARE_API_KEY || !CLOUDFLARE_ZONE_ID) {
    return NextResponse.json({ error: 'System configuration error: Missing Cloudflare credentials.' }, { status: 500 });
  }

  try {
    const firestore = getDb();
    const storeRef = doc(firestore, 'stores', storeId);
    const storeSnap = await getDoc(storeRef);

    if (!storeSnap.exists()) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const storeData = storeSnap.data();
    const hostname = storeData.customDomain;

    if (!hostname) {
      return NextResponse.json({ error: 'No custom domain configured for this store' }, { status: 400 });
    }

    // Fetch live status from Cloudflare
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames?hostname=${hostname}`,
      {
        method: 'GET',
        headers: {
          'X-Auth-Email': CLOUDFLARE_EMAIL,
          'X-Auth-Key': CLOUDFLARE_API_KEY,
          'Content-Type': 'application/json',
        }
      }
    );

    const contentType = cfResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Cloudflare API returned non-JSON response (${cfResponse.status}).`);
    }

    const cfData = await cfResponse.json();

    if (!cfResponse.ok || !cfData.result?.[0]) {
      throw new Error(cfData.errors?.[0]?.message || 'Failed to fetch status from Cloudflare');
    }

    const cfResult = cfData.result[0];
    
    let internalStatus: 'pending_dns' | 'connected' | 'unverified' = 'pending_dns';
    if (cfResult.status === 'active' && cfResult.ssl?.status === 'active') {
      internalStatus = 'connected';
    }

    const updatedInfo = {
      domainStatus: internalStatus,
      ownershipRecord: cfResult.ownership_verification || null,
      sslValidationRecord: cfResult.ssl?.validation_records?.[0] || null,
      cfStatus: cfResult.status,
      sslStatus: cfResult.ssl?.status,
      lastCfSync: new Date().toISOString()
    };

    await updateDoc(storeRef, updatedInfo);

    return NextResponse.json({ 
      success: true, 
      status: internalStatus,
      cfData: cfResult 
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}