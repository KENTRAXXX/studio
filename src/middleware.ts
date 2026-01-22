import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');

  // For production, this should be your main application's domain.
  const ROOT_DOMAIN = process.env.NODE_ENV === 'production' ? 'somatoday.com' : 'localhost:9002';

  if (!hostname) {
    return NextResponse.next();
  }

  // If the request is for the root domain, do nothing.
  if (hostname === ROOT_DOMAIN) {
    return NextResponse.next();
  }

  // --- Dynamic Hostname to Store ID Mapping ---
  // In a production environment on Cloudflare, you would fetch this mapping
  // from a KV store or a cached edge function for optimal performance.
  // Direct Firestore queries from middleware are generally not recommended due to latency.
  // For this example, we simulate a lookup.
  const domainToStoreIdMap: { [key: string]: string } = {
    'demo.soma.store': 'demo',
    // 'my-luxury-brand.com': 'user123-store-id' -> This would be fetched dynamically.
  };

  const currentHost = hostname.split(':')[0]; // Remove port
  const storeId = domainToStoreIdMap[currentHost];

  // If we find a mapping, rewrite the URL to the /store/[storeId] path.
  if (storeId) {
    const newUrl = new URL(`/store/${storeId}${url.pathname}`, request.url);
    return NextResponse.rewrite(newUrl);
  }

  // If no mapping is found, you might redirect to a "Not Found" or "Invalid Domain" page.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
