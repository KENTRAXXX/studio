import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { addDomainToVercel } from '@/lib/vercel-domains';

/**
 * @fileOverview API route to register custom hostnames via Vercel API
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

    // 1. Register with Vercel Project Domains API
    let vercelData;
    try {
        vercelData = await addDomainToVercel(domain);
    } catch (e: any) {
        console.error("Vercel Domain Add Error:", e);
        return NextResponse.json({ 
            error: `Vercel Integration Error: ${e.message}. Ensure VERCEL_TOKEN and VERCEL_PROJECT_ID are configured.` 
        }, { status: 500 });
    }

    // 2. Update Firestore status with Vercel verification intent
    const firestore = getDb();
    const storeRef = doc(firestore, 'stores', storeId);
    
    // We store standard Vercel DNS targets for the UI to display
    const isSubdomain = domain.split('.').length > 2;
    const dnsTarget = isSubdomain ? 'cname.vercel-dns.com' : '76.76.21.21';
    const dnsType = isSubdomain ? 'CNAME' : 'A';

    const verificationInfo = {
      customDomain: domain.toLowerCase(),
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
      message: 'Domain registered on Vercel and records synced.',
      data: verificationInfo
    });

  } catch (error: any) {
    console.error('Domain registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
