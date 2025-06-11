"use client";
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard, ShieldCheck, Settings, Users, Package } from 'lucide-react'; // Added more icons
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_AUTH_KEY = 'isAdminAuthenticated';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
      setIsAdminAuthenticated(authStatus);
      setIsLoading(false);
    }
  }, [pathname]); // Re-check on pathname change for robustness

  useEffect(() => {
    if (!isLoading && !isAdminAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isLoading, isAdminAuthenticated, pathname, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
    setIsAdminAuthenticated(false); // Update state immediately
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 w-full max-w-xs">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  // If it's the login page, don't render the admin layout shell
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  // If not authenticated and not on login page (should be caught by useEffect, but as safeguard)
  if (!isAdminAuthenticated) {
     return null; // Or a redirect component, but useEffect handles it
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r bg-sidebar text-sidebar-foreground">
        <SidebarHeader>
          <div className="flex items-center justify-between p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
            <Link href="/admin/dashboard" className="font-bold text-xl text-primary group-data-[collapsible=icon]:hidden flex items-center gap-2">
              <ShieldCheck size={24} /> Admin
            </Link>
            <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"/>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'} tooltip={{content: "Dashboard", side: "right"}}>
                <Link href="/admin/dashboard"><LayoutDashboard /> <span>Dashboard</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')} tooltip={{content: "Manage Users", side: "right"}}>
                <Link href="/admin/users"><Users /> <span>Users</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/listings')} tooltip={{content: "Manage Listings", side: "right"}}>
                <Link href="/admin/listings"><Package /> <span>Listings</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/settings')} tooltip={{content: "Settings", side: "right"}}>
                <Link href="/admin/settings"><Settings /> <span>Settings</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={{content: "Logout", side: "right"}} className="hover:bg-red-500/10 hover:text-red-500">
                <LogOut /> <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4 md:hidden">
            <SidebarTrigger className="md:hidden" /> {/* Mobile trigger */}
             <Link href="/admin/dashboard" className="font-bold text-lg text-primary flex items-center gap-2">
              <ShieldCheck size={22} /> Admin
            </Link>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 lg:p-8 bg-muted/30 min-h-[calc(100vh-theme(spacing.16))]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
