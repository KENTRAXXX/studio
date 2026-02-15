import OrderConfirmationPage from '../../../store/[storeId]/checkout/order-confirmation/page';

/**
 * @fileOverview Tenant Confirmation Proxy
 * Correctly awaits params for Next.js 15 compatibility.
 */
export default async function TenantOrderConfirmationPage({ params }: { params: Promise<{ domain: string }> }) {
  await params;
  return <OrderConfirmationPage />;
}
