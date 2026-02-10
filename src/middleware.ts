import { NextRequest, NextResponse } from 'next/server';

/**
 * multi-tenancy Resolver: Maps Hostnames to identifier slugs or IDs.
 */
async function resolveHostname(hostname: string, baseUrl: string): Promise<string | null> {
    const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
    const rootBase = ROOT_DOMAIN.split(':')[0];
    
    // 1. Root check
    if (hostname === rootBase || hostname === `www.${rootBase}` || hostname === 'localhost') {
        return null;
    }

    // 2. Subdomain check (e.g. boutique.somatoday.com)
    if (hostname.endsWith(`.${rootBase}`)) {
        const subdomain = hostname.replace(`.${rootBase}`, "");
        if (subdomain && subdomain !== 'www') return subdomain;
    }

    // 3. Custom Domain Resolution via Tier-Aware API
    try {
        const resolveUrl = new URL(`/api/resolve-domain?domain=${hostname}`, baseUrl);
        const response = await fetch(resolveUrl);
        if (response.ok) {
            const data = await response.json();
            return data.storeId || null;
        }
    } catch (e) {
        console.error(`Multi-tenancy resolution error for ${hostname}:`, e);
    }
    
    return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host')?.toLowerCase();
  
  if (!hostname) return NextResponse.next();
  
  const currentHost = hostname.split(':')[0];

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

  // Resolve and Rewrite
  const tenantIdentifier = await resolveHostname(currentHost, request.url);
  
  if (tenantIdentifier) {
    // Rewrite to /[domain] dynamic route
    return NextResponse.rewrite(new URL(`/${tenantIdentifier}${path}${url.search}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|logo.svg).*)',
  ],
};
