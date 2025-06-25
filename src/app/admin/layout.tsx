
"use client";
import { useEffect, useState, type ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  LogOut, LayoutDashboard, ShieldCheck, Settings, Users, Package,
  ChevronDown, ChevronUp, Truck, FileText, Star, Boxes, Route as RouteIcon, Megaphone, StickyNote, Award, Building, List, PlusCircle, MessageSquare, Handshake,
  Image as HeroIcon,
  BookUser,
  ShieldAlert
} from 'lucide-react'; 
import { Skeleton } from '@/components/ui/skeleton';
import type { AdminProfile } from '@/types';

const ADMIN_AUTH_KEY = 'isAdminAuthenticated';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<Omit<AdminProfile, 'password' | 'id'> | null>(null);

  const isSettingsRouteActive = useMemo(() => {
    return pathname.startsWith('/admin/settings') && 
           !pathname.startsWith('/admin/settings/memberships') && 
           !pathname.startsWith('/admin/settings/announcements');
  }, [pathname]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsRouteActive);

  const isUsersRouteActive = useMemo(() => pathname.startsWith('/admin/users'), [pathname]);
  const [isUsersOpen, setIsUsersOpen] = useState(isUsersRouteActive);

  const isSponsorsRouteActive = useMemo(() => pathname.startsWith('/admin/sponsors'), [pathname]);
  const [isSponsorsOpen, setIsSponsorsOpen] = useState(isSponsorsRouteActive);


  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(true); 
      return;
    }

    const authStatus = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    setIsAdminAuthenticated(authStatus); 

    if (authStatus) {
        try {
            const profileInfo = localStorage.getItem('admin_profile_info');
            if(profileInfo) setAdminProfile(JSON.parse(profileInfo));
        } catch(e) {
            console.error("Error parsing admin profile info", e);
            setAdminProfile(null);
        }
    }

    if (!authStatus && pathname !== '/admin/login') {
      router.push('/admin/login');
      setIsLoading(true); 
    } else {
      setIsLoading(false);
    }
  }, [pathname, router]);


  useEffect(() => {
    if (isSettingsRouteActive && !isSettingsOpen) {
      setIsSettingsOpen(true);
    }
    if (isUsersRouteActive && !isUsersOpen) {
      setIsUsersOpen(true);
    }
    if (isSponsorsRouteActive && !isSponsorsOpen) {
      setIsSponsorsOpen(true);
    }
  }, [isSettingsRouteActive, isSettingsOpen, isUsersRouteActive, isUsersOpen, isSponsorsRouteActive, isSponsorsOpen]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_AUTH_KEY);
      localStorage.removeItem('admin_profile_info');
      localStorage.removeItem('admin_full_profile');
    }
    setIsAdminAuthenticated(false); 
    setAdminProfile(null);
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

  if (pathname === '/admin/login') {
    return <div className="min-h-screen">{children}</div>;
  }
  
  if (!isAdminAuthenticated) {
     return null; 
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r bg-sidebar text-sidebar-foreground">
        <SidebarHeader>
          <div className="flex items-center justify-between p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
            <Link href="/admin/dashboard" className="font-bold text-xl text-primary group-data-[collapsible=icon]:hidden flex items-center gap-2">
              <ShieldCheck size={24} /> Yönetici
            </Link>
            <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"/>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin/dashboard'} tooltip={{content: "Panel", side: "right"}}>
                <Link href="/admin/dashboard">
                  <LayoutDashboard /> <span>Panel</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {adminProfile?.role === 'superAdmin' && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/administrators')} tooltip={{content: "Yöneticiler", side: "right"}}>
                  <Link href="/admin/administrators">
                    <ShieldAlert /> <span>Yöneticiler</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => setIsUsersOpen(!isUsersOpen)} 
                isActive={isUsersRouteActive} 
                tooltip={{content: "Firmalar", side: "right"}}
                className="w-full flex justify-between items-center" 
              >
                <div className="flex items-center gap-2"><Building /> <span>Firmalar</span></div>
                {isUsersOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isUsersOpen && (
              <>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/users'} tooltip={{content: "Firma Listesi", side: "right"}}>
                    <Link href="/admin/users">
                      <List size={18}/> <span className="text-sm">Firma Listesi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/users/add'} tooltip={{content: "Yeni Firma Ekle", side: "right"}}>
                    <Link href="/admin/users/add">
                      <PlusCircle size={18}/> <span className="text-sm">Yeni Firma Ekle</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/directory')} tooltip={{content: "Firma Rehberi", side: "right"}}>
                <Link href="/admin/directory">
                  <BookUser /> <span>Rehber</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/listings')} tooltip={{content: "İlanları Yönet", side: "right"}}>
                <Link href="/admin/listings">
                  <Package /> <span>İlanlar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/membership-requests')} tooltip={{content: "Üyelik İstekleri", side: "right"}}>
                <Link href="/admin/membership-requests">
                  <Handshake /> <span>Üyelik İstekleri</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/settings/memberships')} tooltip={{content: "Üyelikler", side: "right"}}>
                <Link href="/admin/settings/memberships">
                  <Star /> <span>Üyelikler</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/settings/announcements')} tooltip={{content: "Duyurular", side: "right"}}>
                <Link href="/admin/settings/announcements">
                  <Megaphone /> <span>Duyurular</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => setIsSponsorsOpen(!isSponsorsOpen)} 
                isActive={isSponsorsRouteActive} 
                tooltip={{content: "Sponsorluk", side: "right"}}
                className="w-full flex justify-between items-center" 
              >
                <div className="flex items-center gap-2"><Award /> <span>Sponsorluk</span></div>
                {isSponsorsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isSponsorsOpen && (
              <>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/sponsors'} tooltip={{content: "Sponsor Listesi", side: "right"}}>
                    <Link href="/admin/sponsors">
                      <List size={18}/> <span className="text-sm">Sponsor Listesi</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/sponsors/add'} tooltip={{content: "Sponsor Ekle", side: "right"}}>
                    <Link href="/admin/sponsors/add">
                      <PlusCircle size={18}/> <span className="text-sm">Sponsor Ekle</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/messages')} tooltip={{content: "Mesajlar", side: "right"}}>
                <Link href="/admin/messages">
                  <MessageSquare /> <span>Mesajlar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)} 
                isActive={isSettingsRouteActive} 
                tooltip={{content: "Ayarlar", side: "right"}}
                className="w-full flex justify-between items-center" 
              >
                <div className="flex items-center gap-2"><Settings /> <span>Ayarlar</span></div>
                {isSettingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isSettingsOpen && (
              <>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings'} tooltip={{content: "Genel Ayarlar", side: "right"}}>
                    <Link href="/admin/settings">
                      <Settings size={18}/> <span className="text-sm">Genel Ayarlar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/hero-slides'} tooltip={{content: "Giriş Slaytı", side: "right"}}>
                    <Link href="/admin/settings/hero-slides">
                      <HeroIcon size={18}/> <span className="text-sm">Giriş Slaytı</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/vehicle-types'} tooltip={{content: "Araç Tipleri", side: "right"}}>
                    <Link href="/admin/settings/vehicle-types">
                      <Truck size={18}/> <span className="text-sm">Araç Tipleri</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/auth-docs'} tooltip={{content: "Yetki Belgeleri", side: "right"}}>
                    <Link href="/admin/settings/auth-docs">
                      <FileText size={18}/> <span className="text-sm">Yetki Belgeleri</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/cargo-types'} tooltip={{content: "Yük Cinsleri", side: "right"}}>
                    <Link href="/admin/settings/cargo-types">
                      <Boxes size={18}/> <span className="text-sm">Yük Cinsleri</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/transport-types'} tooltip={{content: "Taşımacılık Türleri", side: "right"}}>
                    <Link href="/admin/settings/transport-types">
                      <RouteIcon size={18}/> <span className="text-sm">Taşımacılık Türleri</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip={{content: "Çıkış Yap", side: "right"}} className="hover:bg-red-500/10 hover:text-red-500">
                 <LogOut /> <span>Çıkış Yap</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:hidden">
            <SidebarTrigger className="md:hidden" /> 
             <Link href="/admin/dashboard" className="font-bold text-lg text-primary flex items-center gap-2">
              <ShieldCheck size={22} /> Yönetici
            </Link>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-muted/30 min-h-[calc(100vh-theme(spacing.16))]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
