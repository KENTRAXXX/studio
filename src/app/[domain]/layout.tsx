'use client';

import { useParams } from 'next/navigation';
import StoreLayout from '../store/[storeId]/layout';

/**
 * @fileOverview Tenant Domain Layout Resolver
 * Detects the subdomain and applies either the boutique store layout 
 * or the isolated Ambassador portal layout.
 */
export default function TenantDomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const domain = (params.domain || params.site) as string;
  const isAmbassador = domain?.toLowerCase().startsWith('ambassador');

  // Marketer Isolation: Skip boutique layout for the ambassador portal
  if (isAmbassador) {
    return (
      <div className="min-h-screen bg-black gold-mesh-gradient overflow-x-hidden">
        {children}
      </div>
    );
  }

  // Standard Boutique Layout for stores
  return <StoreLayout>{children}</StoreLayout>;
}
