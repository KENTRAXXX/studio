
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
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
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Settings,
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
  Gift,
  Gem,
  User,
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { useUserProfile } from '@/firebase/user-profile-provider';

const scalerNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/profile-settings', icon: User, label: 'Profile' },
  { href: '/dashboard/settings', icon: Settings, label: 'Store Settings' },
  { href: '/dashboard/product-catalog', icon: Boxes, label: 'Global Product Catalog' },
  { href: '/dashboard/my-orders', icon: ShoppingBag, label: 'My Orders' },
  { href: '/dashboard/training-center', icon: GraduationCap, label: 'Training Center' },
  { href: '/dashboard/domain-settings', icon: Globe, label: 'Domain Settings' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'SOMA Wallet' },
  { href: '/dashboard/referrals', icon: Gift, label: 'Referrals' },
  { href: '/dashboard/accessibility-checker', icon: Accessibility, label: 'A11y Checker' },
];

const enterpriseNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/profile-settings', icon: User, label: 'Profile' },
  { href: '/dashboard/settings', icon: Settings, label: 'Store Settings' },
  { href: '/dashboard/product-catalog', icon: Boxes, label: 'Global Product Catalog' },
  { href: '/dashboard/my-private-inventory', icon: Package, label: 'My Private Inventory' },
  { href: '/dashboard/my-orders', icon: ShoppingBag, label: 'My Orders' },
  { href: '/dashboard/training-center', icon: GraduationCap, label: 'Training Center' },
  { href: '/dashboard/domain-settings', icon: Globe, label: 'Domain Settings' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'SOMA Wallet' },
  { href: '/dashboard/referrals', icon: Gift, label: 'Referrals' },
  { href: '/dashboard/accessibility-checker', icon: Accessibility, label: 'A11y Checker' },
];

const merchantNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/profile-settings', icon: User, label: 'Profile' },
  { href: '/dashboard/settings', icon: Settings, label: 'Store Settings' },
  { href: '/dashboard/my-private-inventory', icon: Package, label: 'My Private Inventory' },
  { href: '/dashboard/my-orders', icon: ShoppingBag, label: 'My Orders' },
  { href: '/dashboard/domain-settings', icon: Globe, label: 'Domain Settings' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'SOMA Wallet' },
  { href: '/dashboard/referrals', icon: Gift, label: 'Referrals' },
  { href: '/dashboard/accessibility-checker', icon: Accessibility, label: 'A11y Checker' },
];

const sellerNavItems = [
    { href: '/backstage/finances', icon: Landmark, label: 'Finances & Payouts' },
    { href: '/backstage/add-product', icon: Package, label: 'Add Product' },
    { href: '/backstage', icon: ShieldCheck, label: 'Onboarding Status' },
];

const adminNavItems = [
    { href: '/admin/approval-queue', icon: ShieldCheck, label: 'Approval Queue' },
    { href: '/admin/treasury', icon: PiggyBank, label: 'Treasury' },
    { href: '/admin/users', icon: Users, label: 'User Management' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Admin Orders' },
    { href: '/admin/catalog', icon: Gem, label: 'Catalog Editor' },
    { href: '/dashboard/product-catalog', icon: Boxes, label: 'View Global Catalog' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile } = useUserProfile();

  const currentNavItems = useMemo(() => {
    if (!userProfile) return [];

    if (userProfile.userRole === 'ADMIN') {
        return enterpriseNavItems; // Admins see everything
    }

    switch (userProfile.planTier) {
        case 'MERCHANT':
            return merchantNavItems;
        case 'SCALER':
            return scalerNavItems;
        case 'ENTERPRISE':
            return enterpriseNavItems;
        case 'SELLER':
        case 'BRAND':
            return sellerNavItems;
        default:
            return [];
    }
  }, [userProfile]);

  const isAdmin = userProfile?.userRole === 'ADMIN';

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
            {currentNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}

            {isAdmin && (
              <>
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
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
