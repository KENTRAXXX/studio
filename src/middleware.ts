import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview SOMA Multi-Tenancy Resolver
 * Maps Hostnames (Custom Domains or Subdomains) to internal store identifiers.
 */
async function resolveHostname(hostname: string, baseUrl: string): Promise<string | null> {
    const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
    const currentHost = hostname.toLowerCase();
    
    // 1. Root & Platform Domain check: Skip resolution for the primary platform entry points
    const isPlatformRoot = 
        currentHost === ROOT_DOMAIN || 
        currentHost === `www.${ROOT_DOMAIN}` || 
        currentHost === 'localhost' ||
        currentHost === '127.0.0.1';

    if (isPlatformRoot) {
        return null;
    }

    // 2. Custom Domain or Platform Subdomain Resolution via Resolver API
    try {
        const origin = new URL(baseUrl).origin;
        // Hit our internal API which checks slugs, custom domains, and UIDs
        const resolveUrl = new URL(`/api/resolve-domain?domain=${currentHost}`, origin);
        const response = await fetch(resolveUrl, {
            next: { revalidate: 300 } // Cache resolution for 5 minutes at the edge
        });
        
        if (response.ok) {
            const data = await response.json();
            // We return the storeId (the Firestore document UID)
            if (data.storeId) return data.storeId;
        }
    } catch (e) {
        console.error(`Multi-tenancy resolution error for ${currentHost}:`, e);
    }
    
    return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  
  if (!hostname) return NextResponse.next();
  
  // Clean hostname (remove port if present)
  const currentHost = hostname.split(':')[0].toLowerCase();

  // System Paths Protection - Never rewrite these. They belong to the Platform Hub.
  const path = url.pathname;
  if (
    path.startsWith('/api') || 
    path.startsWith('/_next') || 
    path.startsWith('/admin') || 
    path.startsWith('/dashboard') || 
    path.startsWith('/backstage') ||
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/plan-selection') ||
    path.startsWith('/legal') ||
    path.startsWith('/payout-confirmed') ||
    path.startsWith('/access-denied') ||
    path.startsWith('/store') // Internal store route for debugging/fallback
  ) {
    return NextResponse.next();
  }

  const tenantId = await resolveHostname(currentHost, request.url);
  
  if (tenantId) {
    // Internally rewrite to the [domain] route while maintaining the branded URL in the address bar.
    // Rewrites from 'deluxeinc.somatoday.com/product/123' to '/tenantUID/product/123'
    return NextResponse.rewrite(new URL(`/${tenantId}${path}${url.search}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|logo.svg).*)',
  ],
};
