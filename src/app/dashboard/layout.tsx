import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarTitle,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Store,
  Boxes,
  Globe,
  BarChart2,
  Accessibility,
  Wallet,
  ShoppingBag,
  ShieldCheck,
  GraduationCap,
  Package,
  Landmark,
  PiggyBank,
  Users,
} from 'lucide-react';
import SomaLogo from '@/components/logo';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/my-store', icon: Store, label: 'My Store' },
  { href: '/dashboard/global-product-catalog', icon: Boxes, label: 'Global Product Catalog' },
  { href: '/dashboard/my-private-inventory', icon: Package, label: 'My Private Inventory' },
  { href: '/dashboard/my-orders', icon: ShoppingBag, label: 'My Orders' },
  { href: '/dashboard/training-center', icon: GraduationCap, label: 'Training Center' },
  { href: '/dashboard/domain-settings', icon: Globe, label: 'Domain Settings' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'SOMA Wallet' },
  { href: '/dashboard/accessibility-checker', icon: Accessibility, label: 'A11y Checker' },
];

const backstageNavItems = [
    { href: '/backstage/add-product', icon: Package, label: 'Add Product' },
    { href: '/backstage/finances', icon: Landmark, label: 'Finances' },
]

const adminNavItems = [
    { href: '/admin/approval-queue', icon: ShieldCheck, label: 'Approval Queue' },
    { href: '/admin/treasury', icon: PiggyBank, label: 'Treasury' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <SomaLogo />
            <span className="font-headline font-bold text-xl text-primary">SomaDS</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
             <SidebarMenuItem>
                <div className="p-2 text-xs font-medium text-muted-foreground">Backstage</div>
            </SidebarMenuItem>
            {backstageNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
                <div className="p-2 text-xs font-medium text-muted-foreground">Admin</div>
            </SidebarMenuItem>
            {adminNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                {/* Potentially add breadcrumbs or page title here */}
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
