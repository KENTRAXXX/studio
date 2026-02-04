'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
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
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useUserProfile } from '@/firebase/user-profile-provider';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { AdminSidebar } from '@/components/admin/Sidebar';

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
      <AdminSidebar onLogout={() => setIsLogoutDialogOpen(true)} />
      
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
