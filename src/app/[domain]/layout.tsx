import StoreLayout from '../store/[storeId]/layout';

export default function TenantDomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreLayout>{children}</StoreLayout>;
}
