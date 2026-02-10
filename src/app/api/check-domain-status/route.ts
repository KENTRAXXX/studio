import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { doc, updateDoc, getFirestore, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { verifyDomain, getProjectDomain, getDomainConfig } from '@/lib/vercel-domains';

/**
 * @fileOverview API route to poll Vercel for the latest custom hostname status.
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

    // 1. Attempt to trigger verification on Vercel
    await verifyDomain(hostname).catch(console.error);

    // 2. Fetch live status from Vercel Project
    const projectDomain = await getProjectDomain(hostname);
    
    let internalStatus: 'pending_dns' | 'connected' | 'unverified' = 'pending_dns';
    
    // Vercel domain is fully ready when 'verified' is true AND 'misconfigured' is false
    if (projectDomain.verified && !projectDomain.misconfigured) {
      internalStatus = 'connected';
    } else if (projectDomain.misconfigured) {
      internalStatus = 'unverified';
    }

    const updatedInfo = {
      domainStatus: internalStatus,
      vercelVerified: projectDomain.verified,
      vercelMisconfigured: projectDomain.misconfigured,
      lastVercelSync: new Date().toISOString()
    };

    await updateDoc(storeRef, updatedInfo);

    return NextResponse.json({ 
      success: true, 
      status: internalStatus,
      vercelData: projectDomain 
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
