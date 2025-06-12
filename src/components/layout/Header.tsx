
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Bell, LogOut, UserCircle, Truck as AppIcon, PlusCircle, Loader2, Info } from 'lucide-react';
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
import type { AnnouncementSetting } from '@/types';
import { getAllAnnouncements } from '@/services/announcementsService';
import { useEffect, useState, useMemo } from 'react';
import { format, parseISO, isValid, isAfter, isBefore, isEqual } from 'date-fns';
import { tr } from 'date-fns/locale';
import React from 'react';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementSetting[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    async function fetchAnnouncements() {
      setIsLoadingAnnouncements(true);
      try {
        const fetchedAnnouncements = await getAllAnnouncements();
        setAnnouncements(fetchedAnnouncements);
      } catch (error) {
        console.error("Duyurular yüklenirken hata oluştu:", error);
        setAnnouncements([]); // Hata durumunda boş liste
      }
      setIsLoadingAnnouncements(false);
    }
    fetchAnnouncements();
  }, []);

  const activeAnnouncements = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Günün başlangıcıyla karşılaştırma yapmak için

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
      return startDateValid && endDateValid;
    }).sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()); // En yeni önce
  }, [announcements]);

  return (
    <header className="bg-background/80 border-b sticky top-0 z-50 shadow-sm backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <AppIcon className="h-8 w-8 text-primary" data-ai-hint="truck logistics" />
          <h1 className="text-2xl font-bold text-primary font-headline">Nakliyeci Dünyası</h1>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/">Ana Sayfa</Link>
          </Button>
          {isAuthenticated && (
            <Button variant="ghost" asChild>
              <Link href="/yeni-ilan" className="flex items-center gap-1">
                <PlusCircle size={18} /> İlan Ver
              </Link>
            </Button>
          )}
          
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Bildirimler">
                <Bell className="h-5 w-5" />
                {activeAnnouncements.length > 0 && !isLoadingAnnouncements && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0" align="end">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium text-foreground">Duyurular</h3>
              </div>
              <ScrollArea className="h-[300px] sm:h-[400px]">
                <div className="p-4 space-y-4">
                  {isLoadingAnnouncements ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="ml-2 text-muted-foreground">Duyurular yükleniyor...</p>
                    </div>
                  ) : activeAnnouncements.length > 0 ? (
                    activeAnnouncements.map((ann, index) => (
                      <React.Fragment key={ann.id}>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{ann.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{ann.content}</p>
                          <p className="text-xs text-muted-foreground/70 pt-1">
                            {isValid(parseISO(ann.createdAt)) ? format(parseISO(ann.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr }) : 'Bilinmeyen tarih'}
                          </p>
                        </div>
                        {index < activeAnnouncements.length - 1 && <Separator />}
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Info className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Şu anda aktif duyuru bulunmamaktadır.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={(user as any).logoUrl || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="person avatar" />
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
                  <Link href="/profil" className="flex items-center">
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
                <Link href="/auth/giris">Giriş Yap</Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/auth/kayit">Kayıt Ol</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
