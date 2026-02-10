import StorefrontPage from '../store/[storeId]/page';

export default function TenantStorefrontPage(props: any) {
  // The middleware rewrites the custom domain to /[domain].
  // In this context, the 'domain' param is the resolved storeId.
  return <StorefrontPage {...props} />;
}
