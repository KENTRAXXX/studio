'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Megaphone,
  Wallet,
  Users,
  LogOut,
  Settings,
  Globe,
  Share2
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { getTier } from '@/lib/tiers';

export default function AmbassadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      router.replace('/');
      await auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    { href: '/ambassador', icon: LayoutDashboard, label: 'Overview' },
    { href: '/ambassador/dashboard', icon: Share2, label: 'Marketing Kit' },
    { href: '/ambassador/wallet', icon: Wallet, label: 'Earnings' },
    { href: '/ambassador/settings', icon: Settings, label: 'Settings' },
  ];

  // Access Control: Public ambassador pages are fine, but dashboard requires role
  if (userProfile && userProfile.planTier !== 'AMBASSADOR' && userProfile.userRole !== 'ADMIN' && pathname !== '/ambassador') {
      return (
          <div className="flex h-screen items-center justify-center bg-black text-center p-6">
              <div className="max-w-md space-y-6">
                  <Megaphone className="h-16 w-16 text-primary mx-auto opacity-20" />
                  <h1 className="text-3xl font-bold font-headline text-primary">Ambassador Access Required</h1>
                  <p className="text-muted-foreground">You are currently logged in as a {userProfile.planTier}. To access the marketing portal, please establish an Ambassador identity.</p>
                  <Button asChild className="btn-gold-glow">
                      <Link href="/ambassador">Join the Program</Link>
                  </Button>
              </div>
          </div>
      );
  }

  // If not logged in and on a dashboard subroute, redirect to ambassador home
  if (!userProfile && pathname !== '/ambassador') {
      return (
          <div className="flex h-screen items-center justify-center bg-black">
              <Link href="/ambassador" className="text-primary hover:underline">Return to Ambassador Portal</Link>
          </div>
      );
  }

  // Landing page for ambassador doesn't need sidebar
  if (pathname === '/ambassador') {
      return <div className="min-h-screen bg-black">{children}</div>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-2">
            <SomaLogo className="h-6 w-6 text-primary" aria-hidden="true" />
            <div className="flex flex-col">
                <span className="font-headline font-bold text-xl text-primary uppercase tracking-tighter leading-none">SomaDS</span>
                <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-black mt-1">Marketer Suite</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                    <item.icon aria-hidden="true" />
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
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
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
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Ambassador Performance Ledger</span>
            </div>
        </header>
        <main id="main-content" className="flex-1 p-4 sm:p-6" tabIndex={-1}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
