'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Gem,
  ShieldCheck,
  PiggyBank,
  ShoppingBag,
  ShieldAlert,
  Users,
  MessageSquare,
  Accessibility,
  LogOut,
  Settings,
  ChevronRight
} from 'lucide-react';
import SomaLogo from '@/components/logo';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navHierarchy = {
  COMMAND: [
    { href: '/admin', icon: LayoutDashboard, label: 'Overview', description: 'The Heartbeat' },
    { href: '/admin/users', icon: Users, label: 'User Manager', description: 'Moguls & Sellers' },
    { href: '/admin/concierge', icon: MessageSquare, label: 'Concierge Inbox', description: 'Brand Support' },
  ],
  MARKETPLACE: [
    { href: '/admin/catalog', icon: Gem, label: 'Global Catalog', description: 'Curate & Edit' },
    { href: '/admin/approval-queue', icon: ShieldCheck, label: 'Approvals Queue', description: 'Gatekeeping' },
    { href: '/dashboard/accessibility-checker', icon: Accessibility, label: 'Storefront Audit', description: 'A11y & Brand Check' },
  ],
  FINANCIALS: [
    { href: '/admin/treasury', icon: PiggyBank, label: 'Treasury', description: 'Global Revenue' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Order Log', description: 'Every Transaction' },
    { href: '/admin/referrals', icon: ShieldAlert, label: 'Referral Audit', description: 'Payout Management' },
  ],
  SYSTEM: [
    { href: '/admin/settings', icon: Settings, label: 'Platform Settings', description: 'Global Fees, API Keys' },
  ]
};

export function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-primary/10">
      <SidebarHeader className="p-6 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <SomaLogo className="h-7 w-7 text-primary" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg text-primary tracking-tighter uppercase leading-none">SomaDS</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">Executive Suite</span>
          </div>
          <Badge className="ml-auto bg-primary text-primary-foreground text-[9px] font-black h-5 px-1.5 rounded-full border-none shadow-gold-glow">ADMIN</Badge>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {Object.entries(navHierarchy).map(([group, items]) => (
          <SidebarGroup key={group} className="mb-4">
            <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 px-4 mb-2">
              {group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href}>
                        <SidebarMenuButton 
                          tooltip={item.label}
                          className={cn(
                            "h-12 px-4 transition-all duration-200 hover:bg-primary/5 group",
                            isActive && "bg-primary/10 border-l-2 border-primary"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5 transition-colors",
                            isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
                          )} aria-hidden="true" />
                          <div className="flex flex-col items-start ml-3">
                            <span className={cn(
                              "text-sm font-bold",
                              isActive ? "text-slate-100" : "text-slate-400 group-hover:text-slate-200"
                            )}>{item.label}</span>
                            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-tighter font-medium group-hover:text-muted-foreground/80">
                              {item.description}
                            </span>
                          </div>
                          {isActive && <ChevronRight className="ml-auto h-3 w-3 text-primary" />}
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator className="bg-primary/10" />

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={onLogout}
              className="h-11 text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all group"
            >
              <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
              <span className="font-bold ml-3">System Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
