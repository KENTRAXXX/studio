import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// This function represents the logic for resolving a hostname to a storeId.
// It uses a cache-aside pattern: check cache first, then fallback to DB.
async function resolveHostname(request: NextRequest, hostname: string): Promise<string | null> {
    // This code conceptually assumes the environment provides a KV namespace binding.
    // In a Cloudflare environment, this would be `process.env.DOMAIN_MAP`.
    // In Vercel, this would be `@vercel/kv`. We cast to `any` for this example.
    const kv = (process.env as any).DOMAIN_MAP;

    // 1. Check KV Cache first
    if (kv) {
        try {
            const storeIdFromCache: string | null = await kv.get(hostname);
            if (storeIdFromCache) {
                console.log(`KV Cache hit for ${hostname}: ${storeIdFromCache}`);
                return storeIdFromCache;
            }
        } catch (e) {
            console.error("KV get error:", e);
        }
    }
    
    // 2. Fallback to Firestore via internal API route
    try {
        const resolveUrl = new URL(`/api/resolve-domain?domain=${hostname}`, request.url);
        const response = await fetch(resolveUrl);

        if (response.ok) {
            const data = await response.json();
            if (data.storeId) {
                const storeId = data.storeId;
                console.log(`DB lookup for ${hostname}: ${storeId}`);

                // 3. Asynchronously cache the result in KV for next time.
                // `waitUntil` (available in some edge runtimes) would be ideal here
                // to avoid blocking the response. We'll do a "fire-and-forget" write.
                if (kv) {
                    kv.put(hostname, storeId, { expirationTtl: 3600 }) // Cache for 1 hour
                      .catch((e: any) => console.error("KV put error:", e));
                }
                
                return storeId;
            }
        }
    } catch (e) {
        console.error(`Middleware API fetch error for ${hostname}:`, e);
    }
    
    // Return null if not found
    return null;
}


export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';

  if (!hostname) {
    return new Response('Hostname not found', { status: 400 });
  }
  
  const currentHost = hostname.split(':')[0];

  // Bypass for root domain
  if (currentHost === ROOT_DOMAIN.split(':')[0]) {
    return NextResponse.next();
  }
  
  // Special handling for the hardcoded demo domain to ensure it always works
  if (currentHost === 'demo.soma.store') {
    console.log(`Rewriting demo domain to /store/demo`);
    return NextResponse.rewrite(new URL(`/store/demo${url.pathname}`, request.url));
  }

  const storeId = await resolveHostname(request, currentHost);
  
  if (storeId) {
    return NextResponse.rewrite(new URL(`/store/${storeId}${url.pathname}`, request.url));
  }
  
  // If domain is not resolved, you could redirect to a 'not found' page,
  // or just let it pass through to the default site.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets/).*)'],
};
