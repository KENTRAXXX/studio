import { NextRequest, NextResponse } from 'next/server';

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
    // (Preserving existing resolution logic)
    const kv = (process.env as any).DOMAIN_MAP;
    if (kv) {
        try {
            const storeIdFromCache = await kv.get(hostname);
            if (storeIdFromCache) return storeIdFromCache;
        } catch (e) {
            console.error("KV resolution error:", e);
        }
    }

    try {
        const resolveUrl = new URL(`/api/resolve-domain?domain=${hostname}`, baseUrl);
        const response = await fetch(resolveUrl);
        if (response.ok) {
            const data = await response.json();
            const siteId = data.storeId;
            if (siteId && kv) {
                // Background cache update
                kv.put(hostname, siteId, { expirationTtl: 3600 }).catch(console.error);
            }
            return siteId || null;
        }
    } catch (e) {
        console.error(`Multi-tenancy resolution error for ${hostname}:`, e);
    }
    
    return null;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';

  if (!hostname) return NextResponse.next();
  
  const currentHost = hostname.split(':')[0];

  // 1. Bypass for root domain (Platform Landing & Dashboard)
  if (currentHost === ROOT_DOMAIN.split(':')[0]) {
    // Compatibility: Support /store/[id] on root domain by internal rewrite
    if (url.pathname.startsWith('/store/')) {
        const parts = url.pathname.split('/');
        const siteId = parts[2];
        const rest = parts.slice(3).join('/');
        return NextResponse.rewrite(new URL(`/_sites/${siteId}/${rest}${url.search}`, request.url));
    }
    return NextResponse.next();
  }

  // 2. Multi-tenant resolution
  const site = await resolveHostname(currentHost, request.url);
  
  if (site) {
    // Internal rewrite to the virtual sites directory
    return NextResponse.rewrite(new URL(`/_sites/${site}${url.pathname}${url.search}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (static files)
     * 3. /_static (public files)
     * 4. favicon.ico, assets, logo.svg (static files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo.svg).*)',
  ],
};
