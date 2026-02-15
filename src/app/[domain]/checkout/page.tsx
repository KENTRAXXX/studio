import CheckoutPage from '../../store/[storeId]/checkout/page';

/**
 * @fileOverview Tenant Checkout Proxy
 * Correctly awaits params for Next.js 15 compatibility.
 */
export default async function TenantCheckoutPage({ params }: { params: Promise<{ domain: string }> }) {
  await params;
  return <CheckoutPage />;
}
