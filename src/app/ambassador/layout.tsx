
'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
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
  Settings,
  Share2,
  Globe,
  BarChart2,
  Wallet,
  LogOut,
  Sparkles,
  Trophy,
  ShieldCheck
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Ambassador Layout
 * Isolated from store-owner logic to prevent circular dependency loops.
 */
export default function AmbassadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userProfile, loading } = useUserProfile();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  useEffect(() => {
      if (!loading && userProfile && userProfile.planTier !== 'AMBASSADOR' && userProfile.userRole !== 'ADMIN') {
          router.push('/access-denied');
      }
  }, [userProfile, loading, router]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await auth.signOut();
      router.replace('/ambassador');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
      { href: '/ambassador/dashboard', icon: LayoutDashboard, label: 'Command Center' },
      { href: '/ambassador/marketing', icon: Share2, label: 'Marketing Kit' },
      { href: '/ambassador/analytics', icon: BarChart2, label: 'Global Yield' },
      { href: '/ambassador/wallet', icon: Wallet, label: 'Commissions' },
      { href: '/ambassador/leaderboard', icon: Trophy, label: 'Leaderboard' },
      { href: '/ambassador/settings', icon: Settings, label: 'Settings' },
  ];

  if (loading) return null;

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-primary/10">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3">
            <SomaLogo className="h-7 w-7 text-primary" aria-hidden="true" />
            <div className="flex flex-col">
                <span className="font-headline font-bold text-lg text-primary tracking-tighter uppercase leading-none">Ambassador</span>
                <span className="text-[8px] text-muted-foreground uppercase tracking-[0.3em] mt-1">Growth Division</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton 
                    tooltip={item.label}
                    isActive={pathname === item.href}
                    className={cn(
                        "transition-all duration-200",
                        pathname === item.href && "bg-primary/10 text-primary font-bold"
                    )}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-400/5 px-2 h-9"
                onClick={() => setIsLogoutDialogOpen(true)}
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                <span>Exit Portal</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-black">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-primary/10 bg-black/80 px-6 backdrop-blur-sm">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em]">SOMA Strategic Growth Network</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Handshake Verified</span>
                </div>
            </div>
        </header>
        <main id="main-content" className="flex-1 p-6 lg:p-10" tabIndex={-1}>
          {children}
        </main>
      </SidebarInset>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="bg-card border-primary/30 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline text-xl text-primary text-center">Terminate Session</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-400 pt-2">
              Are you sure you wish to exit the Marketing Terminal?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 sm:justify-center">
            <AlertDialogCancel className="border-slate-700">Stay</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-slate-200">Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
