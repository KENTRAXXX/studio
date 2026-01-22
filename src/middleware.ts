import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');

  // Use an environment variable for the root domain for flexibility.
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';

  if (!hostname) {
    return new Response('Hostname not found', { status: 400 });
  }
  
  const currentHost = hostname.split(':')[0]; // Remove port if present

  // If the request is for the root domain, do nothing.
  if (currentHost === ROOT_DOMAIN.split(':')[0]) {
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

  const storeId = domainToStoreIdMap[currentHost];

  // If we find a mapping, rewrite the URL to the /store/[...slug] path.
  // The first part of the slug will be the storeId.
  if (storeId) {
    const newUrlPath = `/store/${storeId}${url.pathname}`;
    const newUrl = new URL(newUrlPath, request.url);
    console.log(`Rewriting ${hostname}${url.pathname} to ${newUrl.toString()}`);
    return NextResponse.rewrite(newUrl);
  }

  // If no mapping is found, you might redirect to a "Not Found" or "Invalid Domain" page.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets/).*)'],
};
