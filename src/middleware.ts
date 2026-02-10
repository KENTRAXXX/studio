import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview SOMA Multi-Tenancy Resolver
 * Maps Hostnames (Custom Domains or Subdomains) to internal store identifiers.
 */
async function resolveHostname(hostname: string, baseUrl: string): Promise<string | null> {
    const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
    const currentHost = hostname.toLowerCase();
    
    // 1. Root & Platform Domain check: Skip resolution for system domains
    const isPlatformDomain = 
        currentHost === ROOT_DOMAIN || 
        currentHost === `www.${ROOT_DOMAIN}` || 
        currentHost === 'localhost' ||
        currentHost.endsWith('.vercel.app') ||
        currentHost.endsWith('.web.app') ||
        currentHost.endsWith('.firebaseapp.com');

    if (isPlatformDomain) {
        // Still check for subdomains on the root platform domain
        if (currentHost.endsWith(`.${ROOT_DOMAIN}`)) {
            const subdomain = currentHost.substring(0, currentHost.length - ROOT_DOMAIN.length - 1);
            if (subdomain && subdomain !== 'www') {
                return subdomain;
            }
        }
        return null;
    }

    // 2. Custom Domain Resolution via Tier-Aware API
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
    // Internally rewrite to the domain route while maintaining the browser URL
    return NextResponse.rewrite(new URL(`/${tenantIdentifier}${path}${url.search}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|logo.svg).*)',
  ],
};
