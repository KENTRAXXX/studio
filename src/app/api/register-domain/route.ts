export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Edge API route to register custom hostnames via Cloudflare API
 * and sync them to the KV store for multi-tenant routing.
 */

const getDb = () => {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
    return getFirestore(app);
};

export async function POST(request: NextRequest) {
  const { domain, storeId } = await request.json();

  if (!domain || !storeId) {
    return NextResponse.json({ error: 'Missing domain or storeId' }, { status: 400 });
  }

  const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;
  const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
  const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

  if (!CLOUDFLARE_EMAIL || !CLOUDFLARE_API_KEY || !CLOUDFLARE_ZONE_ID) {
    console.error("Missing Cloudflare API credentials in environment.");
    return NextResponse.json({ error: 'System configuration error' }, { status: 500 });
  }

  try {
    // 1. Register with Cloudflare Custom Hostnames API
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`,
      {
        method: 'POST',
        headers: {
          'X-Auth-Email': CLOUDFLARE_EMAIL,
          'X-Auth-Key': CLOUDFLARE_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname: domain.toLowerCase(),
          ssl: {
            method: 'txt',
            type: 'dv',
          },
        }),
      }
    );

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) {
      // If hostname already exists (409), we treat it as success for our KV sync
      if (cfData.errors?.[0]?.code !== 1406) {
        throw new Error(cfData.errors?.[0]?.message || 'Cloudflare API failure');
      }
    }

    // 2. Map domain to storeId in KV_BINDING for the middleware
    const kv = (process.env as any).KV_BINDING;
    if (kv) {
      await kv.put(`domain:${domain.toLowerCase()}`, storeId);
    } else {
      console.warn("KV_BINDING not found. Manual sync required.");
    }

    // 3. Update Firestore status
    const firestore = getDb();
    const storeRef = doc(firestore, 'stores', storeId);
    await updateDoc(storeRef, {
      customDomain: domain.toLowerCase(),
      domainStatus: 'pending_dns',
      cfHostnameId: cfData.result?.id || 'existing'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Domain registered and KV mapped.',
      cfData: cfData.result 
    });

  } catch (error: any) {
    console.error('Domain registration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
