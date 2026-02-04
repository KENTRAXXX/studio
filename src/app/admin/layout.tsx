'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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
  Gem,
  SearchCode,
  ShieldCheck,
  PiggyBank,
  ShoppingBag,
  ShieldAlert,
  Users,
  MessageSquare,
  Accessibility,
  LogOut,
  ClipboardList,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const marketplaceItems = [
    { href: '/admin/catalog', icon: Gem, label: 'Catalog Editor' },
    { href: '/admin/curation', icon: SearchCode, label: 'Product Curation' },
    { href: '/admin/approval-queue', icon: ShieldCheck, label: 'Catalog Approvals' },
];

const financeItems = [
    { href: '/admin/treasury', icon: PiggyBank, label: 'Treasury' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Admin Orders' },
    { href: '/admin/referrals', icon: ShieldAlert, label: 'Referral Audit' },
];

const systemItems = [
    { href: '/admin/users', icon: Users, label: 'User Management' },
    { href: '/admin/verification-queue', icon: ClipboardList, label: 'Verification Queue' },
    { href: '/admin/concierge', icon: MessageSquare, label: 'Concierge Inbox' },
    { href: '/dashboard/accessibility-checker', icon: Accessibility, label: 'A11y Checker' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, loading: profileLoading } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
    // Only redirect if loading is finished AND we have a profile AND it's not an admin
    if (!profileLoading && userProfile && userProfile.userRole !== 'ADMIN') {
      router.push('/access-denied');
    }
  }, [userProfile, profileLoading, router]);

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

  if (profileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is done but profile is missing entirely (auth exists but no doc)
  if (!userProfile) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background p-4 text-center">
            <AlertTriangle className="h-12 w-12 text-primary mb-4" />
            <h1 className="text-2xl font-bold font-headline text-primary">Identity Not Found</h1>
            <p className="text-muted-foreground mt-2 mb-6">Your executive profile could not be synchronized. Please re-authenticate.</p>
            <Button onClick={handleLogout} variant="outline" className="border-primary/50 text-primary">Return to Sign In</Button>
        </div>
    );
  }

  if (userProfile.userRole !== 'ADMIN') {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <SomaLogo className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="font-headline font-bold text-xl text-primary tracking-tighter uppercase">SomaDS</span>
            <Badge className="bg-primary text-primary-foreground text-[10px] font-black h-5 px-1.5 rounded-full border-none shadow-gold-glow">ADMIN</Badge>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="px-2 pt-4">
            <SidebarMenuItem>
              <Link href="/admin">
                <SidebarMenuButton tooltip="Executive Overview" className="h-11 hover:bg-primary/10">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  <span className="font-bold text-slate-200">Executive Overview</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-4">Marketplace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
                {marketplaceItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton tooltip={item.label}>
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-4">Finance</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
                {financeItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton tooltip={item.label}>
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-4">System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
                {systemItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton tooltip={item.label}>
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <SidebarMenu className="px-2">
            <SidebarMenuItem>
              <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogTrigger asChild>
                  <SidebarMenuButton 
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
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
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] hidden md:inline-block">Platform Administration Gateway</span>
            </div>
        </header>
        <main id="main-content" className="flex-1 p-4 sm:p-6" tabIndex={-1}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
