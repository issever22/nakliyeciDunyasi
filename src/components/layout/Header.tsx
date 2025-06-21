
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Bell, LogOut, UserCircle, Truck as AppIcon, PlusCircle, Loader2, Info, Menu, MessageSquareText, Search, Users as UsersIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import type { AnnouncementSetting, UserProfile } from '@/types';
import { getAllAnnouncements } from '@/services/announcementsService';
import { useEffect, useState, useMemo, forwardRef, useCallback, useRef } from 'react';
import { format, parseISO, isValid, isAfter, isBefore, isEqual } from 'date-fns';
import { tr } from 'date-fns/locale';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { COMPANY_CATEGORIES } from '@/lib/constants';


const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<AnnouncementSetting[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const pathname = usePathname();

  const [showHeader, setShowHeader] = useState(true);
  const [showSecondaryNav, setShowSecondaryNav] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50; 

  const controlHeaderVisibility = useCallback(() => {
    if (typeof window !== 'undefined') {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > scrollThreshold) {
        setShowSecondaryNav(false); 
      } else if (currentScrollY < lastScrollY.current || currentScrollY <= scrollThreshold) {
        setShowSecondaryNav(true); 
      }
      lastScrollY.current = currentScrollY;
    }
  }, [scrollThreshold]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      lastScrollY.current = window.scrollY;
      window.addEventListener('scroll', controlHeaderVisibility);
      return () => {
        window.removeEventListener('scroll', controlHeaderVisibility);
      };
    }
  }, [controlHeaderVisibility]);


  useEffect(() => {
    async function fetchAnnouncements() {
      setIsLoadingAnnouncements(true);
      try {
        const fetchedAnnouncements = await getAllAnnouncements();
        setAnnouncements(fetchedAnnouncements);
      } catch (error) {
        console.error("Duyurular yüklenirken hata oluştu:", error);
        setAnnouncements([]);
      }
      setIsLoadingAnnouncements(false);
    }
    fetchAnnouncements();
  }, []);

  const activeAnnouncements = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return announcements.filter(ann => {
      if (!ann.isActive) return false;

      let startDateValid = true;
      if (ann.startDate) {
        const parsedStartDate = parseISO(ann.startDate);
        if (isValid(parsedStartDate)) {
          parsedStartDate.setHours(0,0,0,0);
          startDateValid = isEqual(today, parsedStartDate) || isAfter(today, parsedStartDate);
        } else {
          startDateValid = false;
        }
      }

      let endDateValid = true;
      if (ann.endDate) {
        const parsedEndDate = parseISO(ann.endDate);
        if (isValid(parsedEndDate)) {
          parsedEndDate.setHours(0,0,0,0);
          endDateValid = isEqual(today, parsedEndDate) || isBefore(today, parsedEndDate);
        } else {
          endDateValid = false;
        }
      }

      if (!(startDateValid && endDateValid)) return false;

      if (ann.targetAudience === 'Tümü') return true;
      if (isAuthenticated && user) {
        if (user.role === 'company' && ann.targetAudience === 'Firma Kullanıcıları') return true;
      }
      
      return false;
    }).sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
  }, [announcements, isAuthenticated, user]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/arama/firmalar?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const renderAnnouncementsList = () => {
    if (isLoadingAnnouncements) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Duyurular yükleniyor...</p>
        </div>
      );
    }
    if (activeAnnouncements.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <MessageSquareText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-md font-medium text-foreground">Aktif Duyuru Yok</p>
          <p className="text-sm text-muted-foreground mt-1">Yeni duyurular burada görünecektir.</p>
        </div>
      );
    }
    return (
      <div className="divide-y divide-border">
        {activeAnnouncements.map((ann) => (
          <div key={ann.id} className="p-4 hover:bg-muted/30 transition-colors">
            <p className="text-sm font-semibold text-foreground mb-1">{ann.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-1.5">{ann.content}</p>
            <p className="text-xs text-muted-foreground/80">
              {isValid(parseISO(ann.createdAt)) ? format(parseISO(ann.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr }) : 'Bilinmeyen tarih'}
            </p>
          </div>
        ))}
      </div>
    );
  };

  const AnnouncementBell = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Popover open={isMobile ? false : popoverOpen} onOpenChange={isMobile ? () => {} : setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Bildirimler" className="relative">
          <Bell className="h-5 w-5" />
          {activeAnnouncements.length > 0 && !isLoadingAnnouncements && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 shadow-xl border" align="end">
        <div className="p-4 border-b bg-background sticky top-0 z-10">
          <h3 className="text-lg font-semibold text-primary">Duyurular</h3>
        </div>
        <ScrollArea className="h-[300px] sm:h-[400px]">
          {renderAnnouncementsList()}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );

  const MobileAnnouncementBell = () => (
     <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Bildirimler" className="relative">
          <Bell className="h-5 w-5" />
          {activeAnnouncements.length > 0 && !isLoadingAnnouncements && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl border" align="end" side="bottom">
        <div className="p-4 border-b bg-background sticky top-0 z-10">
          <h3 className="text-lg font-semibold text-primary">Duyurular</h3>
        </div>
        <ScrollArea className="h-[300px]">
          {renderAnnouncementsList()}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      <header
        className={cn(
          "bg-background/80 border-b sticky top-0 z-50 shadow-sm backdrop-blur-lg"
        )}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AppIcon className="h-8 w-8 text-primary" data-ai-hint="truck logistics" />
            <h1 className="text-2xl font-bold text-primary font-headline">Nakliyeci Dünyası</h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-x-3">
            <Button asChild>
              <Link href="/yeni-ilan">
                <PlusCircle size={18} /> İlan Ver
              </Link>
            </Button>
            
            <AnnouncementBell />

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={(user as any).logoUrl || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="person company"/>
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profil">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 hover:!text-red-600 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/auth/giris">Firma Girişi</Link>
                </Button>
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/auth/kayit">Firma Kaydı</Link>
                </Button>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <MobileAnnouncementBell />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Menüyü Aç</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>
                      <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
                          <AppIcon className="h-7 w-7 text-primary" />
                          <span className="text-xl font-bold text-primary font-headline">Nakliyeci Dünyası</span>
                      </Link>
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-grow">
                <nav className="p-4 space-y-1">
                  <Button variant="ghost" asChild className="w-full justify-start text-base" onClick={closeMobileMenu}>
                    <Link href="/yeni-ilan">
                      <PlusCircle size={20} /> İlan Ver
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start text-base" onClick={closeMobileMenu}>
                    <Link href="/hakkimizda">Hakkımızda</Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start text-base" onClick={closeMobileMenu}>
                    <Link href="/iletisim">İletişim</Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start text-base" onClick={closeMobileMenu}>
                    <Link href="/lojistik-firmalari/karayolu">Karayolu Lojistik</Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start text-base" onClick={closeMobileMenu}>
                    <Link href="/nakliyeciler/illere-gore">İllere Göre Nakliyeciler</Link>
                  </Button>
                  <Separator className="my-2"/>
                  <p className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Üyelerimiz</p>
                  {COMPANY_CATEGORIES.map((category) => (
                    <Button variant="ghost" asChild className="w-full justify-start text-base pl-6" onClick={closeMobileMenu} key={category.slug}>
                      <Link href={`/uyelerimiz/${category.slug}`}>{category.label} Üyelerimiz</Link>
                    </Button>
                  ))}


                  {isAuthenticated && user && (
                      <>
                      <Separator className="my-2"/>
                      <Button variant="ghost" asChild className="w-full justify-start text-base" onClick={closeMobileMenu}>
                          <Link href="/profil">
                              <UserCircle size={20} /> Profilim
                          </Link>
                      </Button>
                      </>
                  )}
                </nav>
                </ScrollArea>
                <div className="p-4 border-t mt-auto">
                  {isAuthenticated && user ? (
                      <Button variant="destructive" className="w-full text-base" onClick={() => { logout(); closeMobileMenu(); }}>
                          <LogOut className="mr-2 h-5 w-5" /> Çıkış Yap
                      </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button variant="outline" asChild className="w-full text-base" onClick={closeMobileMenu}>
                        <Link href="/auth/giris">Firma Girişi</Link>
                      </Button>
                      <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base" onClick={closeMobileMenu}>
                        <Link href="/auth/kayit">Firma Kaydı</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      <nav
        className={cn(
          "border-t bg-background/70 backdrop-blur-md hidden md:block sticky top-16 z-40",
          "transition-transform duration-300 ease-in-out",
          showSecondaryNav ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/hakkimizda" legacyBehavior passHref>
                  <NavigationMenuTrigger>Hakkımızda</NavigationMenuTrigger>
                </Link>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <ListItem href="/hakkimizda" title="Hakkımızda">
                      Firmamız ve vizyonumuz hakkında daha fazla bilgi edinin.
                    </ListItem>
                    <ListItem href="/tasarladigimiz-afisler" title="Tasarladığımız Afişler">
                      Referans afiş çalışmalarımız.
                    </ListItem>
                    <ListItem href="/tasarladigimiz-logolar" title="Tasarladığımız Logolar">
                      Markanız için özgün logo tasarımları.
                    </ListItem>
                      <ListItem href="/tasarladigimiz-siteler" title="Tasarladığımız Siteler">
                      Modern ve işlevsel web sitesi çözümleri.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Lojistik Firmalar</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    <ListItem href="/lojistik-firmalari/karayolu" title="Karayolu Lojistik Firmaları">
                      Yurtiçi ve yurtdışı karayolu taşımacılığı.
                    </ListItem>
                    <ListItem href="/lojistik-firmalari/havayolu" title="Havayolu Lojistik Firmaları">
                      Hızlı ve güvenli havayolu kargo çözümleri.
                    </ListItem>
                    <ListItem href="/lojistik-firmalari/demiryolu" title="Demiryolu Lojistik Firmaları">
                      Çevreci ve ekonomik demiryolu taşımacılığı.
                    </ListItem>
                    <ListItem href="/lojistik-firmalari/denizyolu" title="Denizyolu Lojistik Firmaları">
                      Uluslararası denizyolu konteyner ve yük taşımacılığı.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Üyelerimiz</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px] md:grid-cols-2">
                    {COMPANY_CATEGORIES.map((category) => (
                      <ListItem
                        key={category.slug}
                        title={`${category.label} Üyelerimiz`}
                        href={`/uyelerimiz/${category.slug}`}
                      >
                        {category.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>Nakliyeciler</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[300px] gap-3 p-4 md:w-[400px]">
                      <ListItem href="/nakliyeciler/illere-gore" title="İllere Göre Nakliyeciler">
                      Türkiye'nin her ilinden nakliye firmaları.
                    </ListItem>
                      <ListItem href="/nakliyeciler/ulkelere-gore" title="Ülkelere Göre Nakliyeciler">
                      Farklı ülkelere hizmet veren nakliyeciler.
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>Bize Ulaşın</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[300px] gap-3 p-4 md:w-[400px]">
                      <ListItem href="/iletisim" title="İletişim">
                      Soru ve önerileriniz için bize yazın.
                    </ListItem>
                      <ListItem href="/banka-hesap-no" title="Banka Hesap No">
                      Ödeme ve hesap bilgilerimiz.
                    </ListItem>
                    <ListItem href="/indir" title="Uygulamamızı İndir">
                        Mobil uygulamalarımızla her yerden erişin.
                      </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

            </NavigationMenuList>
          </NavigationMenu>

          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Firmalarda ara..."
              className="h-9 pl-9 w-full bg-muted/50 border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

        </div>
      </nav>
    </>
  );
}
