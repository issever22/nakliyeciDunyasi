
"use client";
import { useEffect, useState, type ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  LogOut, LayoutDashboard, ShieldCheck, Settings, Users, Package,
  ChevronDown, ChevronUp, Truck, FileText, Star, Boxes, Route as RouteIcon, Megaphone, StickyNote, Award
} from 'lucide-react'; 
import { Skeleton } from '@/components/ui/skeleton';

const ADMIN_AUTH_KEY = 'isAdminAuthenticated';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSettingsRouteActive = useMemo(() => pathname.startsWith('/admin/settings'), [pathname]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(isSettingsRouteActive);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(true); // Sunucuda veya pencere yoksa yükleniyor durumunda kal
      return;
    }

    const authStatus = localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
    setIsAdminAuthenticated(authStatus); // Diğer UI elemanları için state'i ayarla

    if (!authStatus && pathname !== '/admin/login') {
      router.push('/admin/login');
      // Yönlendirme sırasında iskelet görünümü için yükleniyor durumuna geri dön
      // Bu, yeni sayfa AdminLayout tarafından işlenene kadar içeriğin yanıp sönmesini engeller
      setIsLoading(true); 
    } else {
      // Kimlik doğrulanmış veya zaten giriş sayfasında
      setIsLoading(false);
    }
  }, [pathname, router]);


  useEffect(() => {
    if (isSettingsRouteActive && !isSettingsOpen) {
      setIsSettingsOpen(true);
    }
    // Ayarlar menüsünün dışında bir yere tıklandığında ve ayarlar menüsü açıksa kapatma mantığı,
    // eğer settings dışı bir rota aktifse ve isSettingsOpen true ise setIsSettingsOpen(false) yapılabilir.
    // Ancak bu, kullanıcının menüyü manuel olarak açık tutma isteğiyle çakışabilir.
    // Şimdilik mevcut davranış korunuyor: sadece ilgili rota aktifse otomatik açılıyor.
  }, [isSettingsRouteActive, isSettingsOpen]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
    setIsAdminAuthenticated(false); 
    router.push('/admin/login');
  };

  const handleToggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
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

  // Giriş sayfası AdminLayout tarafından sarmalanıyorsa, 
  // children'ı doğrudan render et (yukarıdaki useEffect yönlendirmeyi zaten hallediyor)
  if (pathname === '/admin/login') {
    return <div className="min-h-screen">{children}</div>;
  }
  
  // Eğer isLoading false ise ve hala kimlik doğrulanmamışsa (ve giriş sayfasında değilsek),
  // yukarıdaki useEffect zaten yönlendirme yapmış olmalı.
  // Bu ek kontrol, bir şekilde yönlendirme olmazsa null döndürerek içeriği gizler.
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
                <Link href="/admin/dashboard"><LayoutDashboard /> <span>Panel</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/users')} tooltip={{content: "Kullanıcıları Yönet", side: "right"}}>
                <Link href="/admin/users"><Users /> <span>Kullanıcılar</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/listings')} tooltip={{content: "İlanları Yönet", side: "right"}}>
                <Link href="/admin/listings"><Package /> <span>İlanlar</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/admin/sponsors')} tooltip={{content: "Sponsorları Yönet", side: "right"}}>
                <Link href="/admin/sponsors"><Award /> <span>Sponsorlar</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleToggleSettings} 
                isActive={isSettingsRouteActive} 
                tooltip={{content: "Ayarlar", side: "right"}}
                className="w-full flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <Settings /> <span>Ayarlar</span>
                </div>
                {isSettingsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isSettingsOpen && (
              <>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings'} tooltip={{content: "Genel Ayarlar", side: "right"}}>
                    <Link href="/admin/settings"><Settings size={18}/> <span className="text-sm">Genel Ayarlar</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/vehicle-types'} tooltip={{content: "Araç Tipleri", side: "right"}}>
                    <Link href="/admin/settings/vehicle-types"><Truck size={18}/> <span className="text-sm">Araç Tipleri</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/auth-docs'} tooltip={{content: "Yetki Belgeleri", side: "right"}}>
                    <Link href="/admin/settings/auth-docs"><FileText size={18}/> <span className="text-sm">Yetki Belgeleri</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/memberships'} tooltip={{content: "Üyelikler", side: "right"}}>
                    <Link href="/admin/settings/memberships"><Star size={18}/> <span className="text-sm">Üyelikler</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/cargo-types'} tooltip={{content: "Yük Cinsleri", side: "right"}}>
                    <Link href="/admin/settings/cargo-types"><Boxes size={18}/> <span className="text-sm">Yük Cinsleri</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/transport-types'} tooltip={{content: "Taşımacılık Türleri", side: "right"}}>
                    <Link href="/admin/settings/transport-types"><RouteIcon size={18}/> <span className="text-sm">Taşımacılık Türleri</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/announcements'} tooltip={{content: "Duyurular", side: "right"}}>
                    <Link href="/admin/settings/announcements"><Megaphone size={18}/> <span className="text-sm">Duyurular</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="pl-4">
                  <SidebarMenuButton asChild isActive={pathname === '/admin/settings/notes'} tooltip={{content: "Notlar", side: "right"}}>
                    <Link href="/admin/settings/notes"><StickyNote size={18}/> <span className="text-sm">Notlar</span></Link>
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
        <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-6 lg:p-8 bg-muted/30 min-h-[calc(100vh-theme(spacing.16))]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
