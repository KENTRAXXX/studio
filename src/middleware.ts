import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileOverview SOMA Multi-Tenancy Resolver
 * Robust rewrite logic for Custom Domains, Subdomains, and special roles.
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
    path.startsWith('/ambassador') ||
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

  // 3. Special Case: Ambassador Portal
  if (currentHost === `ambassador.${rootDomain}`) {
    return NextResponse.rewrite(new URL(`/ambassador${path}${url.search}`, request.url));
  }

  // 4. Perform the Rewrite: If the hostname is NOT the root domain
  if (currentHost !== rootDomain && currentHost !== `www.${rootDomain}`) {
    // Internal Rewrite maintains the branded URL in the browser
    const rewriteUrl = new URL(`/${currentHost}${path}${url.search}`, request.url);
    return NextResponse.rewrite(rewriteUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets|logo.svg).*)',
  ],
};
