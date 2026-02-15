import ProductDetailPage from '../../../store/[storeId]/products/[productId]/page';

/**
 * @fileOverview Tenant Product Detail Proxy (Server-Side)
 * Correctly awaits params for Next.js 15 compatibility.
 */
export default async function TenantProductPage({ params }: { params: Promise<{ domain: string, productId: string }> }) {
  // Next.js 15: Route parameters MUST be awaited before use
  await params;
  return <ProductDetailPage />;
}
