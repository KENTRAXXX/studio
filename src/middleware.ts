import { NextRequest, NextResponse } from 'next/server';
import { verifyCfAccessJwt } from './lib/auth-utils';

/**
 * Multi-Tenancy Resolver: Maps Hostnames to Site IDs
 */
async function resolveHostname(hostname: string, baseUrl: string): Promise<string | null> {
    const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();
    const rootBase = ROOT_DOMAIN.split(':')[0];
    
    // 1. Check if it's a subdomain of the root (e.g. boutique.somatoday.com)
    if (hostname.endsWith(`.${rootBase}`)) {
        const subdomain = hostname.replace(`.${rootBase}`, "");
        if (subdomain && subdomain !== 'www') return subdomain;
    }

    // 2. Special handling for demo domain
    if (hostname === 'demo.soma.store') {
        return 'demo';
    }

    // 3. Custom Domain Resolution via API
    try {
        const resolveUrl = new URL(`/api/resolve-domain?domain=${hostname}`, baseUrl);
        const response = await fetch(resolveUrl);
        if (response.ok) {
            const data = await response.json();
            const siteId = data.storeId;
            return siteId || null;
        }
    } catch (e) {
        console.error(`Multi-tenancy resolution error for ${hostname}:`, e);
    }
    
    return null;
}

/**
 * Identity-Based Resolver: Maps Authenticated Email to Store ID
 */
async function resolveIdentity(email: string, baseUrl: string): Promise<string | null> {
    try {
        const resolveUrl = new URL(`/api/resolve-user?email=${encodeURIComponent(email)}`, baseUrl);
        const response = await fetch(resolveUrl);
        if (response.ok) {
            const data = await response.json();
            const storeId = data.storeId;
            return storeId || null;
        }
    } catch (e) {
        console.error(`Identity resolution error for ${email}:`, e);
    }
    return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host')?.toLowerCase();
  const cfAccessJwt = request.headers.get('cf-access-jwt-assertion');
  const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();

  if (!hostname) return NextResponse.next();
  
  const currentHost = hostname.split(':')[0];

  // PLATFORM ROOT CHECK:
  // Identify if the request is hitting the platform's main landing/dashboard/api
  const isPlatformRoot = 
    currentHost === ROOT_DOMAIN || 
    currentHost === `www.${ROOT_DOMAIN}` || 
    currentHost.endsWith('.vercel.app') ||
    currentHost.endsWith('.pages.dev') ||
    currentHost === 'localhost';

  // 1. Zero Trust Identity Handshake
  if (cfAccessJwt) {
    const payload = await verifyCfAccessJwt(cfAccessJwt);
    if (payload?.email) {
        const identitySiteId = await resolveIdentity(payload.email, request.url);
        if (identitySiteId) {
            // If the user visits the root domain homepage or dashboard, home-route them to their specific instance
            if (isPlatformRoot && (url.pathname === '/' || url.pathname === '/dashboard')) {
                return NextResponse.rewrite(new URL(`/_sites/${identitySiteId}${url.pathname}${url.search}`, request.url));
            }
        }
    }
  }

  // 2. Bypass for platform root (Landing Page, Auth, Dashboard, etc.)
  if (isPlatformRoot) {
    // Handle the legacy /store/ path rewrite for the root domain (if accessed directly via root/store/id)
    if (url.pathname.startsWith('/store/')) {
        const parts = url.pathname.split('/');
        const siteId = parts[2];
        const rest = parts.slice(3).join('/');
        return NextResponse.rewrite(new URL(`/_sites/${siteId}/${rest}${url.search}`, request.url));
    }
    return NextResponse.next();
  }

  // 3. Multi-tenant resolution (Subdomains/Custom Domains)
  const site = await resolveHostname(currentHost, request.url);
  
  if (site) {
    return NextResponse.rewrite(new URL(`/_sites/${site}${url.pathname}${url.search}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg).*)',
  ],
};
