# SOMA Multi-Tenancy Architecture

This document explains how the SOMA platform handles multiple tenant storefronts using a single Next.js application, providing a seamless white-label experience for store owners.

## The Core Concepts

Think of the platform using a **Landlord and Tenant** analogy:

1.  **The Root Domain (The Mall)**: This is the main application domain where the SOMA platform itself operates (e.g., `soma.app` in production or `localhost:9002` in development).
    *   It hosts the administrative dashboards for tenants (`/dashboard`).
    *   It hosts the platform's main landing page.
    *   It is the central "headquarters" for all tenants.

2.  **The Custom Domain (The Boutique)**: This is the unique domain that a tenant (store owner) purchases from a registrar like GoDaddy, Namecheap, or Spaceship (e.g., `my-luxury-brand.com`).
    *   This is the public-facing URL for the tenant's specific storefront.
    *   It provides a fully branded, professional experience for their customers.

3.  **The Middleware (The Concierge)**: The `src/middleware.ts` file is the critical piece that connects the two. It acts as a smart traffic controller for every request that comes to the platform.

## The Request Flow

Here’s how it works in practice when a customer visits a tenant's store:

```
Customer visits `my-luxury-brand.com`
       │
       │
       ▼
[ SOMA Platform / Vercel Edge ]
       │
       ├─ Middleware (`src/middleware.ts`) runs first
       │
       ├─ It inspects the request HOST header: "my-luxury-brand.com"
       │
       ├─ Is the host the root domain? NO.
       │
       ├─ It looks up "my-luxury-brand.com" in a database/map and finds it belongs to `storeId: "user123"`.
       │
       ├─ It REWRITES the URL internally to `/store/user123`.
       │  (The customer's browser URL remains `my-luxury-brand.com`)
       │
       ▼
[ Next.js Application ]
       │
       ├─ Receives a request for the page `/store/user123`.
       │
       ├─ The page at `src/app/store/[...slug]/page.tsx` renders.
       │
       ├─ It uses the `storeId` ("user123") from the params to fetch the correct products and configuration from Firestore.
       │
       ▼
Customer sees the fully-rendered, custom-branded page for "My Luxury Brand"
(Browser URL still shows `my-luxury-brand.com`)
```

This architecture allows a single, scalable Next.js application to serve an unlimited number of custom domains, making it a true multi-tenant platform.
