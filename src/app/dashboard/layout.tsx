'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  ClipboardList,
  SearchCode,
  Image as ImageIcon,
  FolderOpen,
  Warehouse,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';

const scalerNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/profile-settings', icon: User, label: 'Profile' },
  { href: '/dashboard/settings', icon: Settings, label: 'Store Settings' },
  { href: '/dashboard/product-catalog', icon: Boxes, label: 'Global Product Catalog' },
  { href: '/dashboard/marketing', icon: ImageIcon, label: 'Marketing Toolkit' },
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
  { href: '/dashboard/marketing', icon: ImageIcon, label: 'Marketing Toolkit' },
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
  { href: '/dashboard/marketing', icon: ImageIcon, label: 'Marketing Toolkit' },
  { href: '/dashboard/my-private-inventory', icon: Package, label: 'My Private Inventory' },
  { href: '/dashboard/my-orders', icon: ShoppingBag, label: 'My Orders' },
  { href: '/dashboard/domain-settings', icon: Globe, label: 'Domain Settings' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'SOMA Wallet' },
  { href: '/dashboard/referrals', icon: Gift, label: 'Referrals' },
  { href: '/dashboard/accessibility-checker', icon: Accessibility, label: 'A11y Checker' },
];

const sellerNavItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/backstage/inventory', icon: Warehouse, label: 'Inventory Manager' },
    { href: '/backstage/finances', icon: Landmark, label: 'Finances & Payouts' },
    { href: '/backstage/analytics', icon: BarChart2, label: 'Insights & Analytics' },
    { href: '/backstage/marketing-assets', icon: FolderOpen, label: 'Brand Assets' },
    { href: '/backstage/add-product', icon: Package, label: 'Add Product' },
    { href: '/backstage/concierge', icon: MessageSquare, label: 'Concierge' },
    { href: '/backstage', icon: ShieldCheck, label: 'Onboarding Status' },
];

const adminNavItems = [
    { href: '/admin/concierge', icon: MessageSquare, label: 'Concierge Inbox' },
    { href: '/admin/curation', icon: SearchCode, label: 'Product Curation' },
    { href: '/admin/verification-queue', icon: ClipboardList, label: 'Verification Queue' },
    { href: '/admin/approval-queue', icon: ShieldCheck, label: 'Catalog Approvals' },
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
  const auth = useAuth();
  const router = useRouter();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      router.push('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const currentNavItems = useMemo(() => {
    if (!userProfile) return [];

    if (userProfile.userRole === 'ADMIN') {
        return enterpriseNavItems; // Admins see everything
    }

    const isPendingReview = userProfile.status === 'pending_review';

    switch (userProfile.planTier) {
        case 'MERCHANT':
            return merchantNavItems;
        case 'SCALER':
            return scalerNavItems;
        case 'ENTERPRISE':
            return enterpriseNavItems;
        case 'SELLER':
        case 'BRAND':
            // If pending review, only show the non-financial/non-product tools
            if (isPendingReview) {
                return sellerNavItems.filter(item => 
                    item.href === '/dashboard' || 
                    item.href === '/backstage' || 
                    item.href === '/backstage/pending-review' ||
                    item.href === '/backstage/concierge'
                );
            }
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
                    <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">Platform Administration</div>
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
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton 
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </SidebarMenuButton>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-primary/30 max-w-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-headline text-xl text-primary text-center">Executive Departure</AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-slate-400 pt-2">
                      Are you sure you wish to exit the SOMA ecosystem?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 sm:justify-center">
                    <AlertDialogCancel asChild>
                      <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 w-full sm:w-28 h-11">
                        Stay
                      </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-slate-200 w-full sm:w-28 h-11">
                        Logout
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
            </div>
        </header>
        <header className="flex-1 p-4 sm:p-6">{children}</header>
      </SidebarInset>
    </SidebarProvider>
  );
}