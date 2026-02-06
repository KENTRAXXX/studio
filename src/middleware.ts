import { NextRequest, NextResponse } from 'next/server';
import { verifyCfAccessJwt } from './lib/auth-utils';

export const runtime = 'experimental-edge';

/**
 * Multi-Tenancy Resolver: Maps Hostnames to Site IDs
 */
async function resolveHostname(hostname: string, baseUrl: string): Promise<string | null> {
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';
    const rootBase = ROOT_DOMAIN.split(':')[0];
    
    // 1. Check if it's a subdomain of the root (e.g. apple.somads.com)
    if (hostname.endsWith(`.${rootBase}`)) {
        return hostname.replace(`.${rootBase}`, "");
    }

    // 2. Special handling for demo domain
    if (hostname === 'demo.soma.store') {
        return 'demo';
    }

    // 3. Custom Domain Resolution via KV or API
    // The binding name is 'KV_BINDING'
    const kv = (process.env as any).KV_BINDING;
    if (kv) {
        try {
            const storeIdFromCache = await kv.get(`domain:${hostname}`);
            if (storeIdFromCache) return storeIdFromCache;
        } catch (e) {
            console.error("KV resolution error (domain):", e);
        }
    }

    try {
        const resolveUrl = new URL(`/api/resolve-domain?domain=${hostname}`, baseUrl);
        const response = await fetch(resolveUrl);
        if (response.ok) {
            const data = await response.json();
            const siteId = data.storeId;
            if (siteId && kv) {
                // Cache for 1 hour
                kv.put(`domain:${hostname}`, siteId, { expirationTtl: 3600 }).catch(console.error);
            }
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
    const kv = (process.env as any).KV_BINDING;
    if (kv) {
        try {
            const identityFromCache = await kv.get(`user:${email}`);
            if (identityFromCache) return identityFromCache;
        } catch (e) {
            console.error("KV resolution error (user):", e);
        }
    }

    try {
        const resolveUrl = new URL(`/api/resolve-user?email=${encodeURIComponent(email)}`, baseUrl);
        const response = await fetch(resolveUrl);
        if (response.ok) {
            const data = await response.json();
            const storeId = data.storeId;
            if (storeId && kv) {
                // Cache for 1 hour
                kv.put(`user:${email}`, storeId, { expirationTtl: 3600 }).catch(console.error);
            }
            return storeId || null;
        }
    } catch (e) {
        console.error(`Identity resolution error for ${email}:`, e);
    }
    return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  const cfAccessJwt = request.headers.get('cf-access-jwt-assertion');
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';

  if (!hostname) return NextResponse.next();
  
  const currentHost = hostname.split(':')[0];

  // 1. Zero Trust Identity Handshake
  if (cfAccessJwt) {
    const payload = await verifyCfAccessJwt(cfAccessJwt);
    if (payload?.email) {
        const identitySiteId = await resolveIdentity(payload.email, request.url);
        if (identitySiteId) {
            // If the user visits the root domain homepage or dashboard, home-route them
            if (currentHost === ROOT_DOMAIN.split(':')[0] && (url.pathname === '/' || url.pathname === '/dashboard')) {
                return NextResponse.rewrite(new URL(`/_sites/${identitySiteId}${url.pathname}${url.search}`, request.url));
            }
        }
    }
  }

  // 2. Bypass for root domain (Platform Landing & Dashboard)
  if (currentHost === ROOT_DOMAIN.split(':')[0]) {
    // Handle the legacy /store/ path rewrite for the root domain
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
