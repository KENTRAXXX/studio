import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview SOMA Multi-Tenancy Resolver
 * Maps Hostnames (Custom Domains or Subdomains) to internal store identifiers.
 */
async function resolveHostname(hostname: string, baseUrl: string): Promise<string | null> {
    const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
    const currentHost = hostname.toLowerCase();
    
    // 1. Root check: Skip resolution for the main platform site
    if (currentHost === ROOT_DOMAIN || currentHost === `www.${ROOT_DOMAIN}` || currentHost === 'localhost') {
        return null;
    }

    // 2. Custom Domain / Subdomain Resolution via Tier-Aware API
    // This handles 'my-brand.com' OR subdomains like 'deluxeinc.somatoday.com'
    try {
        const resolveUrl = new URL(`/api/resolve-domain?domain=${currentHost}`, baseUrl);
        const response = await fetch(resolveUrl);
        if (response.ok) {
            const data = await response.json();
            if (data.storeId) return data.storeId;
        }
    } catch (e) {
        console.error(`Multi-tenancy resolution error for ${currentHost}:`, e);
    }

    // 3. Subdomain Check: If not found in API, check if it's a direct subdomain of the root
    if (currentHost.endsWith(`.${ROOT_DOMAIN}`)) {
        const subdomain = currentHost.substring(0, currentHost.length - ROOT_DOMAIN.length - 1);
        if (subdomain && subdomain !== 'www') {
            // We still need to verify if this subdomain exists as a slug or storeId
            // The API handles both, so we pass it through
            return subdomain; 
        }
    }
    
    return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  
  if (!hostname) return NextResponse.next();
  
  // Clean hostname (remove port if present)
  const currentHost = hostname.split(':')[0].toLowerCase();

  // System Paths Protection
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
    path.startsWith('/access-denied')
  ) {
    return NextResponse.next();
  }

  const tenantIdentifier = await resolveHostname(currentHost, request.url);
  
  if (tenantIdentifier) {
    return NextResponse.rewrite(new URL(`/${tenantIdentifier}${path}${url.search}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|logo.svg).*)',
  ],
};
