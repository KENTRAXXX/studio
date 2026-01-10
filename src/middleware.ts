import { NextRequest, NextResponse } from 'next/server';

// The function that will be executed for every request to the app.
export function middleware(request: NextRequest) {
  // Get the URL from the request.
  const url = request.nextUrl;

  // Extract the hostname from the URL.
  const hostname = request.headers.get('host');

  // Define the root domain of the application. In a real environment,
  // this would come from an environment variable (e.g., process.env.NEXT_PUBLIC_ROOT_DOMAIN).
  // For this development environment, we'll use the localhost address.
  const ROOT_DOMAIN = 'localhost:9002';

  // If the hostname is missing, we can't do anything, so we'll let it pass.
  if (!hostname) {
    return NextResponse.next();
  }

  // --- Step 1: Check for Root Domain ---
  // If the request is for the main landing page or dashboard (e.g., 'localhost:9002'),
  // we don't need to do any rewriting.
  if (hostname === ROOT_DOMAIN) {
    return NextResponse.next();
  }

  // --- Step 2: Custom Domain Mapping ---
  // This is a simulated lookup. In a production environment, you would query a
  // fast database (like Redis, Upstash, or a cached Firestore query) to map the
  // custom hostname to a storeId.
  const domainToStoreIdMap: { [key: string]: string } = {
    'demo.soma.store': 'demo',
    // Add other custom domains here as they are configured
    // 'my-luxury-brand.com': 'user123-store-id',
  };

  // Get the pure hostname without the port.
  const currentHost = hostname.split(':')[0];
  const storeId = domainToStoreIdMap[currentHost];

  // --- Step 3: Rewrite the URL ---
  // If we found a storeId for the custom domain, we rewrite the URL
  // to point to the correct internal store path.
  if (storeId) {
    // Reconstruct the URL, prepending the path with `/store/[storeId]`.
    // Example: mybrand.com/product/123 -> /store/user123/product/123
    const newUrl = new URL(`/store/${storeId}${url.pathname}`, request.url);
    
    // Use NextResponse.rewrite to internally forward the request.
    // The browser URL remains clean (e.g., mybrand.com/product/123).
    return NextResponse.rewrite(newUrl);
  }

  // If no mapping is found, proceed without rewriting.
  // You might want to redirect to a "Not Found" or "Invalid Domain" page here.
  return NextResponse.next();
}

// The matcher defines which paths the middleware will run on.
// We want it to run on all paths except for Next.js internal paths and static assets.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
