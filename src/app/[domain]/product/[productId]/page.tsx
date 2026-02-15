import ProductDetailPage from '../../../store/[storeId]/product/[productId]/page';

/**
 * @fileOverview Tenant Product Proxy
 * Correctly awaits params for Next.js 15 compatibility.
 */
export default async function TenantProductPage({ params }: { params: Promise<{ domain: string, productId: string }> }) {
  // Await params to comply with Next.js 15 Server Component lifecycle
  await params;
  return <ProductDetailPage />;
}