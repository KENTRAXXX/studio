import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview SOMA Multi-Tenancy Resolver
 * Robust rewrite logic for Custom Domains, Subdomains, and specialized portals.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // 1. Extract the Host: Get the hostname from the headers.
  const currentHost = hostname.split(':')[0].toLowerCase();
  
  // 2. Define the Root: Ensure process.env.NEXT_PUBLIC_ROOT_DOMAIN is being compared correctly.
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'somatoday.com').toLowerCase();

  const path = url.pathname;

  // Protect system paths from being rewritten
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
    path.startsWith('/access-denied') ||
    path.startsWith('/store')
  ) {
    return NextResponse.next();
  }

  // 3. Perform the Rewrite: If the hostname is NOT the root domain
  if (currentHost !== rootDomain && currentHost !== `www.${rootDomain}`) {
    console.log('Middleware Path:', currentHost, 'Rewriting to:', `/[domain]${path}`);
    
    let targetPath = path;
    
    // Fix for ambassador.somatoday.com/ambassador 404
    // We strip the redundant /ambassador path for ambassador subdomains to resolve the portal correctly.
    if (currentHost.startsWith('ambassador') && path === '/ambassador') {
      targetPath = '/';
    }

    // Internal Rewrite maintains the branded URL in the browser
    // This handles both boutique subdomains and specialized portals like ambassador.
    const rewriteUrl = new URL(`/${currentHost}${targetPath}${url.search}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|logo.svg).*)',
  ],
};
