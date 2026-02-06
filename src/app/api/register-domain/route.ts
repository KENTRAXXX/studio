export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Edge API route to register custom hostnames via Cloudflare API
 * and sync verification records to Firestore.
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

    const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;
    const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY;
    const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

    if (!CLOUDFLARE_EMAIL || !CLOUDFLARE_API_KEY || !CLOUDFLARE_ZONE_ID) {
      console.error("Missing Cloudflare API credentials in environment.");
      return NextResponse.json({ 
          error: 'Platform configuration incomplete. Ensure CLOUDFLARE_EMAIL, CLOUDFLARE_API_KEY, and CLOUDFLARE_ZONE_ID are set in Pages Secrets.' 
      }, { status: 500 });
    }

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

    const contentType = cfResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const errorText = await cfResponse.text();
        console.error('Cloudflare non-JSON response:', errorText);
        throw new Error(`Cloudflare API returned non-JSON response (${cfResponse.status}). Check credentials.`);
    }

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) {
      // If hostname already exists (1406), we still want to proceed to fetch its details or handle it
      if (cfData.errors?.[0]?.code !== 1406) {
        throw new Error(cfData.errors?.[0]?.message || 'Cloudflare API failure');
      }
    }

    // 2. Map domain to storeId in KV_BINDING for the middleware
    const kv = (process.env as any).KV_BINDING;
    if (kv) {
      await kv.put(`domain:${domain.toLowerCase()}`, storeId).catch((e: any) => console.error("KV put failed:", e));
    }

    // 3. Update Firestore status with verification details
    const firestore = getDb();
    const storeRef = doc(firestore, 'stores', storeId);
    
    const verificationInfo = {
      customDomain: domain.toLowerCase(),
      domainStatus: 'pending_dns',
      cfHostnameId: cfData.result?.id || 'existing',
      ownershipRecord: cfData.result?.ownership_verification || null,
      sslValidationRecord: cfData.result?.ssl?.validation_records?.[0] || null,
      lastCfSync: new Date().toISOString()
    };

    await updateDoc(storeRef, verificationInfo);

    return NextResponse.json({ 
      success: true, 
      message: 'Domain registered and verification records synced.',
      data: verificationInfo
    });

  } catch (error: any) {
    console.error('Domain registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}