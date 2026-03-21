'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
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
  GraduationCap,
  Package,
  User,
  ImageIcon,
  LogOut,
  Palette,
  Landmark,
  Warehouse,
  FolderOpen,
  MessageSquare,
  Users
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { getTier } from '@/lib/tiers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
    if (auth?.currentUser && !auth.currentUser.emailVerified) {
        router.push('/auth/verify-email');
        return;
    }
    if (userProfile && !userProfile.twoFactorEnabled) {
        router.push('/auth/2fa/setup');
    }
  }, [userProfile, auth, router]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      router.replace('/');
      await auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const currentNavItems = useMemo(() => {
    if (!userProfile) return [];

    // GATELOCK: Circuit breaker for incorrect portal access
    const tier = getTier(userProfile.planTier);
    if (tier.portal !== 'dashboard' && userProfile.userRole !== 'ADMIN') {
        return [];
    }

    // Unpaid users only see Overview
    if (!userProfile.hasAccess) {
        return [{ href: '/dashboard', icon: LayoutDashboard, label: 'Overview' }];
    }
    
    // Core navigation available to all Moguls (Individual or Business)
    const items = [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { href: '/dashboard/profile-settings', icon: User, label: 'Profile' },
        { href: '/backstage/concierge', icon: MessageSquare, label: 'Help & Support' },
    ];

    const isOwner = userProfile.businessRole === 'OWNER' || userProfile.entityType === 'INDIVIDUAL';
    const role = userProfile.businessRole;

    // RBAC: Role-Based Access Control
    // Add items based on specific business roles or if the user is an Individual (who acts as their own Owner)
    
    // 1. Team Management (OWNER Only)
    if (userProfile.entityType === 'BUSINESS' && role === 'OWNER') {
        items.push({ href: '/dashboard/team', icon: Users, label: 'Team Hub' });
    }

    // 2. Financials (OWNER, FINANCE)
    if (isOwner || role === 'FINANCE') {
        items.push({ href: '/dashboard/wallet', icon: Wallet, label: 'SOMA Wallet' });
        items.push({ href: '/dashboard/my-orders', icon: ShoppingBag, label: 'My Orders' });
    }

    // 3. Marketing & Domain (OWNER, MARKETING)
    if (isOwner || role === 'MARKETING') {
        items.push({ href: '/dashboard/storefront-settings', icon: Palette, label: 'Visual Identity' });
        items.push({ href: '/dashboard/domain-settings', icon: Globe, label: 'Domain Settings' });
        items.push({ href: '/dashboard/settings', icon: Settings, label: 'Store Settings' });
    }

    // 4. Analytics (OWNER, ANALYST)
    if (isOwner || role === 'ANALYST') {
        items.push({ href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' });
    }

    // 5. Utility
    if (isOwner) {
        items.push({ href: '/dashboard/referrals', icon: Globe, label: 'Referrals' });
        items.push({ href: '/dashboard/accessibility-checker', icon: Accessibility, label: 'A11y Checker' });
    }

    // Tier-based & Operations injection (OWNER, OPERATIONS)
    const canDoOps = isOwner || role === 'OPERATIONS';
    
    if (canDoOps && tier.features.dropshipping) {
        items.push({ href: '/dashboard/product-catalog', icon: Boxes, label: 'Global Catalog' });
        items.push({ href: '/dashboard/marketing', icon: ImageIcon, label: 'Marketing Toolkit' });
    }

    if (canDoOps && tier.features.privateInventory) {
        items.push({ href: '/dashboard/my-private-inventory', icon: Package, label: 'Private Inventory' });
    }

    if (canDoOps && tier.features.academyAccess) {
        items.push({ href: '/dashboard/training-center', icon: GraduationCap, label: 'Mogul Academy' });
    }

    return items;
  }, [userProfile]);

  // Circuit breaker: Prevent rendering any dashboard UI for non-Moguls
  const tier = getTier(userProfile?.planTier);
  if (userProfile && tier.portal !== 'dashboard' && userProfile.userRole !== 'ADMIN') {
      return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 group p-2">
            <SomaLogo className="h-6 w-6 text-primary transition-transform group-hover:scale-110" aria-hidden={true} />
            <span className="font-headline font-bold text-xl text-primary uppercase tracking-tighter transition-opacity group-hover:opacity-80">SomaDS</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {currentNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton tooltip={item.label}>
                    <item.icon aria-hidden={true} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-400/5 px-2 h-9"
                onClick={() => setIsLogoutDialogOpen(true)}
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden={true} />
                <span>Sign Out</span>
              </Button>
              
              <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
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
        <main id="main-content" className="flex-1 p-4 sm:p-6" tabIndex={-1}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
