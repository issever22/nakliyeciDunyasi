

"use client";

import { useState, useEffect, type FormEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlusCircle, Edit, Trash2, Search, Building, ShieldAlert, CheckCircle, XCircle, Star, Clock, CalendarIcon, Loader2, List, MapPin, Briefcase, AlertTriangle, Award, Check, StickyNote, CreditCard, Mail, Phone, Users as UsersIcon, Truck, FileText, KeyRound, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { CompanyUserProfile } from '@/types';
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import { getPaginatedAdminUsers, deleteUserProfile } from '@/services/authService'; 
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 15;

type MembershipFilterType = 'none' | 'has_membership' | 'no_membership' | 'expires_in_15' | 'expires_in_5';
type MainFilterType = 'all' | 'pending' | 'sponsors' | 'membership';


export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [allCompanyUsers, setAllCompanyUsers] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMainFilter, setActiveMainFilter] = useState<MainFilterType>('all');
  const [activeMembershipFilter, setActiveMembershipFilter] = useState<MembershipFilterType>('none');
  const [showMembershipSubFilters, setShowMembershipSubFilters] = useState(false);

  const fetchUsers = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
        setIsLoadingMore(true);
    } else {
        setIsLoading(true);
        setFetchError(null);
    }
    
    let membershipFilter: 'none' | 'has' | 'has_not' | number = 'none';
    if (activeMainFilter === 'membership') {
        switch (activeMembershipFilter) {
            case 'has_membership': membershipFilter = 'has'; break;
            case 'no_membership': membershipFilter = 'has_not'; break;
            case 'expires_in_15': membershipFilter = 15; break;
            case 'expires_in_5': membershipFilter = 5; break;
        }
    }

    const filters = {
        showOnlyPendingApproval: activeMainFilter === 'pending',
        showOnlySponsors: activeMainFilter === 'sponsors',
        membershipFilter: membershipFilter
    };

    try {
        const result = await getPaginatedAdminUsers({
            lastVisibleDoc: isLoadMore ? lastVisibleDoc : null,
            pageSize: PAGE_SIZE,
            filters
        });
        
        if (result.error) throw new Error(result.error.message);

        const newUsers = result.users;
        setAllCompanyUsers(prev => isLoadMore ? [...prev, ...newUsers] : newUsers);
        setLastVisibleDoc(result.newLastVisibleDoc);
        setHasMore(!!result.newLastVisibleDoc);

    } catch (error: any) {
        console.error("Failed to fetch users:", error);
        const errorMessage = error.message || "Kullanıcılar yüklenirken bir sorun oluştu.";
        setFetchError(errorMessage);
        toast({ title: "Hata", description: errorMessage, variant: "destructive" });
    } finally {
        if (isLoadMore) {
            setIsLoadingMore(false);
        } else {
            setIsLoading(false);
        }
    }
  }, [activeMainFilter, activeMembershipFilter, toast]);


  const handleRefreshAndRefetch = () => {
    setLastVisibleDoc(null);
    setHasMore(true);
    fetchUsers(false);
  }

  useEffect(() => {
    setLastVisibleDoc(null);
    setAllCompanyUsers([]);
    fetchUsers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMainFilter, activeMembershipFilter]);

  const handleMainFilterClick = (filter: MainFilterType) => {
    setActiveMainFilter(filter);
    if (filter !== 'membership') {
      setShowMembershipSubFilters(false);
      setActiveMembershipFilter('none');
    } else {
      setShowMembershipSubFilters(true);
      if (activeMembershipFilter === 'none') {
        setActiveMembershipFilter('has_membership');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteUserProfile(id); 
    if (success) {
      toast({ title: "Başarılı", description: "Firma profil kaydı Firestore'dan silindi. Firebase Auth kullanıcısını konsoldan silmeyi unutmayın.", variant: "destructive", duration: 7000 });
      handleRefreshAndRefetch();
    } else {
      toast({ title: "Hata", description: "Firma profili silinemedi.", variant: "destructive" });
    }
  };

  const filteredCompanyUsers = useMemo(() => {
    if (!searchTerm) return allCompanyUsers;
    return allCompanyUsers.filter(user => {
      const companyUser = user as CompanyUserProfile;
      const matchesSearch = companyUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            companyUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (companyUser.contactFullName && companyUser.contactFullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (companyUser.category && companyUser.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [allCompanyUsers, searchTerm]);
  
  const renderUserTable = (userList: CompanyUserProfile[]) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Firma Adı</TableHead>
            <TableHead className="min-w-[150px] hidden md:table-cell">Yetkili Kişi</TableHead>
            <TableHead className="min-w-[150px]">Üyelik Durumu</TableHead>
            <TableHead className="w-[100px] text-center hidden sm:table-cell">Durum</TableHead>
            <TableHead className="w-[120px] text-right">Eylemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.length > 0 ? userList.map((user) => {
            const isSponsor = user.sponsorships && user.sponsorships.length > 0;
            return (
            <TableRow key={user.id} className="transition-colors hover:bg-muted/50">
              <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                      <Avatar className={cn("h-12 w-12 rounded-sm", isSponsor && "border-2 border-yellow-400 p-0.5")}>
                          <AvatarImage src={user.logoUrl || `https://placehold.co/48x48.png?text=${user.name.charAt(0)}`} alt={user.name} className="rounded-sm" data-ai-hint="company logo"/>
                          <AvatarFallback className="rounded-sm">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                          <span>{user.name}</span>
                          {isSponsor && <Badge variant="outline" className="text-xs w-fit mt-1 px-1.5 py-0 border-yellow-500 text-yellow-600 bg-yellow-500/10">Sponsor</Badge>}
                          <div className="text-xs text-muted-foreground md:hidden">{user.contactFullName}</div>
                      </div>
                  </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{user.contactFullName}</TableCell>
              <TableCell>
                  {user.membershipStatus && user.membershipStatus !== 'Yok' ? (
                      <div className="flex flex-col text-xs space-y-1">
                          <Badge variant="secondary" className="w-fit">
                              <Star className="h-3 w-3 mr-1.5" />
                              {user.membershipStatus}
                          </Badge>
                          {user.membershipEndDate && isValid(parseISO(user.membershipEndDate)) && (
                              <span className="text-muted-foreground text-[11px]">
                                  Bitiş: {format(parseISO(user.membershipEndDate), "dd.MM.yyyy", { locale: tr })}
                              </span>
                          )}
                      </div>
                  ) : (
                      <Badge variant="outline">Üye Değil</Badge>
                  )}
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                  <Badge variant={user.isActive ? "default" : "outline"} className={user.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-yellow-500/10 text-yellow-700 border-yellow-400"}>
                  {user.isActive ? <CheckCircle size={14} className="inline mr-1"/> : <XCircle size={14} className="inline mr-1"/>}
                  {user.isActive ? 'Onaylı' : 'Onay Bekliyor'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/users/${user.id}`)} title="Detayları Görüntüle">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/directory/${user.id}/notes?source=company&name=${encodeURIComponent(user.name)}`)} title="Notları Görüntüle">
                      <StickyNote className="h-4 w-4" />
                    </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Sil" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{user.name}" adlı firma profilini silmek üzeresiniz. Bu işlem geri alınamaz ve kullanıcının Firebase Auth kaydını etkilemez.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90">
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Filtrelerle eşleşen firma bulunamadı.'}
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {isLoadingMore ? (
                    <Button disabled className="w-full sm:w-auto">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor...
                  </Button>
                ) : hasMore ? (
                  <Button onClick={() => fetchUsers(true)} variant="outline" className="w-full sm:w-auto">
                    Daha Fazla Yükle
                  </Button>
                ) : (
                  allCompanyUsers.length > 0 && <p className="text-sm text-muted-foreground">Tüm firmalar yüklendi.</p>
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
      </Table>
    </div>
  );

  if (isLoading && allCompanyUsers.length === 0 && !fetchError) {
    return (
      <div className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <Skeleton className="h-10 w-full sm:max-w-xs" />
                <Skeleton className="h-10 w-full sm:w-auto" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Firma Yönetimi</CardTitle>
          <CardDescription>Onaylanmış firma kayıtlarını ve iletişim bilgilerini yönetin. Kişisel notlar ekleyebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Firma adı veya e-posta ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <Link href="/admin/users/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Firma Ekle
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg border">
                <Button size="sm" variant={activeMainFilter === 'all' ? 'default' : 'ghost'} onClick={() => handleMainFilterClick('all')} className="h-8 px-3">Tümü</Button>
                <Button size="sm" variant={activeMainFilter === 'pending' ? 'default' : 'ghost'} onClick={() => handleMainFilterClick('pending')} className="h-8 px-3">Onay Bekleyenler</Button>
                <Button size="sm" variant={activeMainFilter === 'sponsors' ? 'default' : 'ghost'} onClick={() => handleMainFilterClick('sponsors')} className="h-8 px-3">Sponsorlar</Button>
                <Button size="sm" variant={activeMainFilter === 'membership' ? 'default' : 'ghost'} onClick={() => handleMainFilterClick('membership')} className="h-8 px-3">Üyelik Durumu</Button>
            </div>
            {showMembershipSubFilters && (
                <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-lg border border-dashed">
                    <Button size="sm" variant={activeMembershipFilter === 'has_membership' ? 'secondary' : 'ghost'} onClick={() => setActiveMembershipFilter('has_membership')}>Üyeliği Olanlar</Button>
                    <Button size="sm" variant={activeMembershipFilter === 'no_membership' ? 'secondary' : 'ghost'} onClick={() => setActiveMembershipFilter('no_membership')}>Üyeliği Olmayanlar</Button>
                    <Button size="sm" variant={activeMembershipFilter === 'expires_in_15' ? 'secondary' : 'ghost'} onClick={() => setActiveMembershipFilter('expires_in_15')}>Son 15 Gün</Button>
                    <Button size="sm" variant={activeMembershipFilter === 'expires_in_5' ? 'secondary' : 'ghost'} onClick={() => setActiveMembershipFilter('expires_in_5')}>Son 5 Gün</Button>
                </div>
            )}
          </div>
          
          <div className="mt-6">
            {isLoading && allCompanyUsers.length === 0 ? (
                    <div><Skeleton className="h-64 w-full"/></div>
                ) : fetchError ? (
                    <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg">
                        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-semibold text-destructive-foreground mb-2">Firmalar Yüklenemedi</h3>
                        <p className="text-sm text-destructive-foreground/80 px-4">{fetchError}</p>
                        <p className="text-xs text-destructive-foreground/70 mt-1 px-4">Eksik bir Firestore dizini olabilir. Lütfen tarayıcı konsolunu kontrol edin.</p>
                        <Button onClick={handleRefreshAndRefetch} variant="destructive" className="mt-4">Tekrar Dene</Button>
                    </div>
                ) : renderUserTable(filteredCompanyUsers)}
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
