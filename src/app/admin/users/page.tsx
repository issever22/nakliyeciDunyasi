
"use client";

import { useState, useEffect, type FormEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle, Edit, Trash2, Search, Building, ShieldAlert, CheckCircle, XCircle, Star, Clock, CalendarIcon, Loader2, List, MapPin, Briefcase, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { CompanyUserProfile, CompanyCategory, CompanyUserType, WorkingMethodType, WorkingRouteType, TurkishCity, CountryCode, MembershipSetting } from '@/types';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COMPANY_CATEGORIES, COMPANY_TYPES, WORKING_METHODS, WORKING_ROUTES } from '@/lib/constants';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR } from '@/lib/locationData';
import { 
  getPaginatedAdminUsers, 
  updateUserProfile,
  deleteUserProfile,
} from '@/services/authService'; 
import { getAllMemberships } from '@/services/membershipsService';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const CLEAR_SELECTION_VALUE = "__CLEAR_SELECTION__";
const MAX_PREFERRED_LOCATIONS = 5;
const PAGE_SIZE = 15;


export default function UsersPage() {
  const { toast } = useToast();
  const [allCompanyUsers, setAllCompanyUsers] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUserProfile | null>(null);
  const [showOnlyMembers, setShowOnlyMembers] = useState(false);
  const [showOnlyPendingApproval, setShowOnlyPendingApproval] = useState(false);
  
  const [currentFormData, setCurrentFormData] = useState<Partial<CompanyUserProfile>>({});
  const [availableDistricts, setAvailableDistricts] = useState<readonly string[]>([]);
  
  const [membershipOptions, setMembershipOptions] = useState<MembershipSetting[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);


  const fetchUsers = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
        setIsLoadingMore(true);
    } else {
        setIsLoading(true);
        setFetchError(null);
    }

    try {
        const result = await getPaginatedAdminUsers({
            lastVisibleDoc: isLoadMore ? lastVisibleDoc : null,
            pageSize: PAGE_SIZE,
            filters: { showOnlyMembers, showOnlyPendingApproval }
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
  }, [lastVisibleDoc, showOnlyMembers, showOnlyPendingApproval, toast]);


  const handleRefreshAndRefetch = () => {
    setLastVisibleDoc(null);
    setHasMore(true);
    fetchUsers(false);
  }

  useEffect(() => {
    handleRefreshAndRefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnlyMembers, showOnlyPendingApproval]);

  useEffect(() => {
    const fetchMembershipOptions = async () => {
        setOptionsLoading(true);
        try {
            const membershipsFromDb = await getAllMemberships();
            setMembershipOptions(membershipsFromDb.filter(m => m.isActive));
        } catch (error) {
             console.error("Error fetching membership options:", error);
             toast({ title: "Hata", description: "Üyelik seçenekleri yüklenirken bir sorun oluştu.", variant: "destructive" });
        }
        setOptionsLoading(false);
    };

    fetchMembershipOptions();
  }, [toast]);


  useEffect(() => {
    if (editingUser) {
      let membershipEndDateToSet: Date | undefined = undefined;
      if (editingUser.membershipEndDate) {
          const parsedDate = parseISO(editingUser.membershipEndDate as string);
          if(isValid(parsedDate)) {
            membershipEndDateToSet = parsedDate;
          }
      }
      setCurrentFormData({
        ...editingUser,
        password: editingUser.password || '',
        membershipEndDate: membershipEndDateToSet,
        workingMethods: editingUser.workingMethods || [],
        workingRoutes: editingUser.workingRoutes || [],
        preferredCities: Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, i) => editingUser.preferredCities?.[i] || ''),
        preferredCountries: Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, i) => editingUser.preferredCountries?.[i] || ''),
        ownedVehicles: editingUser.ownedVehicles || [],
        authDocuments: editingUser.authDocuments || [],
      });
    } else {
      setCurrentFormData({});
    }
  }, [editingUser]);

  useEffect(() => {
    const city = currentFormData.addressCity;
    if (city && TURKISH_CITIES.includes(city as TurkishCity)) {
      setAvailableDistricts(DISTRICTS_BY_CITY_TR[city as TurkishCity] || []);
    } else {
      setAvailableDistricts([]);
    }
  }, [currentFormData.addressCity]);

  useEffect(() => {
    if (currentFormData.addressDistrict && !availableDistricts.includes(currentFormData.addressDistrict)) {
      setCurrentFormData(prev => ({ ...prev, addressDistrict: '' }));
    }
  }, [availableDistricts, currentFormData.addressDistrict]);


  const handleEdit = (user: CompanyUserProfile) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };
  
  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    
    const requiredFields: (keyof CompanyUserProfile)[] = ['name', 'email', 'username', 'category', 'contactFullName', 'mobilePhone', 'companyType', 'addressCity', 'fullAddress', 'password'];
    for (const field of requiredFields) {
        const value = (currentFormData as any)[field];
        if (!value || (typeof value === 'string' && !value.trim())) {
            toast({ title: "Eksik Bilgi", description: `Lütfen zorunlu alanları (*) doldurun. Eksik alan: ${field}`, variant: "destructive" });
            setFormSubmitting(false);
            return;
        }
    }
    
    if (currentFormData.password && currentFormData.password.length < 6) {
        toast({ title: "Hata", description: "Şifre en az 6 karakter olmalıdır.", variant: "destructive" });
        setFormSubmitting(false);
        return;
    }
    setFormSubmitting(true);

    const dataToSubmit: any = { ...currentFormData };

    if (dataToSubmit.membershipEndDate instanceof Date) {
        dataToSubmit.membershipEndDate = format(dataToSubmit.membershipEndDate, "yyyy-MM-dd");
    } else if (dataToSubmit.membershipEndDate === undefined) {
        dataToSubmit.membershipEndDate = undefined; 
    }
   
    dataToSubmit.name = dataToSubmit.companyTitle || dataToSubmit.name;
    dataToSubmit.preferredCities = (dataToSubmit.preferredCities || []).filter((c: string) => c);
    dataToSubmit.preferredCountries = (dataToSubmit.preferredCountries || []).filter((c: string) => c);
    
    const { id, createdAt, email, role, ...updateData } = dataToSubmit; 
    
    const success = await updateUserProfile(editingUser.id, updateData as Partial<CompanyUserProfile>);
    if (success) {
      toast({ title: "Başarılı", description: "Firma profili güncellendi." });
      handleRefreshAndRefetch();
    } else {
      toast({ title: "Hata", description: "Firma profili güncellenemedi.", variant: "destructive" });
    }

    setFormSubmitting(false);
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteUserProfile(id); 
    if (success) {
      toast({ title: "Başarılı", description: "Firma profili silindi.", variant: "destructive" });
      handleRefreshAndRefetch();
    } else {
      toast({ title: "Hata", description: "Firma profili silinemedi.", variant: "destructive" });
    }
  };

  const calculateRemainingDays = (endDateIso?: string): string => {
    if (!endDateIso) return '-';
    const endDate = parseISO(endDateIso);
    if (!isValid(endDate)) return '-';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0,0,0,0);

    const diff = differenceInDays(end, today);

    if (diff < 0) return 'Süresi Doldu';
    if (diff === 0) return 'Bugün Sona Eriyor';
    return `${diff} gün kaldı`;
  };

  const filteredCompanyUsers = useMemo(() => {
    if (!searchTerm) return allCompanyUsers;
    return allCompanyUsers.filter(user => {
      const companyUser = user as CompanyUserProfile;
      const matchesSearch = companyUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            companyUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (companyUser.username && companyUser.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (companyUser.category && companyUser.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [allCompanyUsers, searchTerm]);

  const getMembershipBadge = (status?: string) => {
    if (!status || status === 'Yok') return <Badge variant="outline" className="text-xs">Yok</Badge>;
    if (status === 'Standart') return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-xs flex items-center gap-1"><Star size={12}/> Standart</Badge>;
    if (status === 'Premium') return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-xs flex items-center gap-1"><Star size={12}/> Premium</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };
  
  const handleDialogMultiCheckboxChange = (value: string, key: 'workingMethods' | 'workingRoutes') => {
    const currentValues = currentFormData[key] || [];
    const newValues = currentValues.includes(value as never)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value as never];
    setCurrentFormData(prev => ({ ...prev, [key]: newValues }));
  };

  const handleDialogPreferredLocationChange = (index: number, value: string, type: 'city' | 'country') => {
    const actualValue = value === CLEAR_SELECTION_VALUE ? '' : value;
    const key = type === 'city' ? 'preferredCities' : 'preferredCountries';
    const newLocations = [...(currentFormData[key] || Array(MAX_PREFERRED_LOCATIONS).fill(''))];
    newLocations[index] = actualValue;
    setCurrentFormData(prev => ({...prev, [key]: newLocations}));
  };

  const renderUserTable = (userList: CompanyUserProfile[]) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] px-2"></TableHead>
            <TableHead className="min-w-[180px]">Firma Adı</TableHead>
            <TableHead className="min-w-[150px] hidden md:table-cell">Kategori</TableHead>
            <TableHead className="min-w-[180px] hidden lg:table-cell">E-posta</TableHead>
            <TableHead className="min-w-[120px] hidden md:table-cell">Üyelik</TableHead>
            <TableHead className="w-[100px] text-center hidden sm:table-cell">Durum</TableHead>
            <TableHead className="w-[120px] text-right">Eylemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.length > 0 ? userList.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell className="px-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.logoUrl || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="company logo"/>
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                  {user.name}
                  <div className="text-xs text-muted-foreground md:hidden">{user.category}</div>
                  <div className="text-xs text-muted-foreground">K.Adı: {user.username}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell"><Badge variant="secondary" className="text-xs">{user.category}</Badge></TableCell>
              <TableCell className="text-sm hidden lg:table-cell">{user.email}</TableCell>
              <TableCell className="hidden md:table-cell">
                  {getMembershipBadge(user.membershipStatus)}
                  <div className="text-xs text-muted-foreground mt-1">{calculateRemainingDays(user.membershipEndDate)}</div>
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                  <Badge variant={user.isActive ? "default" : "outline"} className={user.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-yellow-500/10 text-yellow-700 border-yellow-400"}>
                  {user.isActive ? <CheckCircle size={14} className="inline mr-1"/> : <XCircle size={14} className="inline mr-1"/>}
                  {user.isActive ? 'Onaylı' : 'Onay Bekliyor'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} title="Düzenle" className="hover:bg-accent">
                    <Edit className="h-4 w-4" />
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
                          "{user.name}" adlı firma profilini silmek üzeresiniz. Bu işlem geri alınamaz.
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
          )) : (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
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
              <TableCell colSpan={7} className="text-center">
                {isLoadingMore ? (
                    <Button disabled className="w-full sm:w-auto">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor...
                  </Button>
                ) : hasMore ? (
                  <Button onClick={() => fetchUsers(true)} variant="outline" className="w-full sm:w-auto">
                    Daha Fazla Yükle
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Tüm firmalar yüklendi.</p>
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
          <CardTitle className="text-2xl flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Firma Listesi</CardTitle>
          <CardDescription>Uygulamadaki firma kullanıcılarını yönetin ve onay durumlarını kontrol edin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Firma ara (Ad, E-posta, K.Adı, Kategori)..."
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

          <div className="flex flex-col sm:flex-row gap-4 mb-4 p-3 bg-muted/30 rounded-md border items-center">
            <div className="flex items-center space-x-2 flex-grow">
              <Switch
                  id="showOnlyMembers"
                  checked={showOnlyMembers}
                  onCheckedChange={setShowOnlyMembers}
                  disabled={isLoading}
              />
              <Label htmlFor="showOnlyMembers" className="font-medium whitespace-nowrap">Sadece Üyeliği Olanlar</Label>
            </div>
            <div className="flex items-center space-x-2 flex-grow">
              <Switch
                  id="showOnlyPendingApproval"
                  checked={showOnlyPendingApproval}
                  onCheckedChange={setShowOnlyPendingApproval}
                  disabled={isLoading}
              />
              <Label htmlFor="showOnlyPendingApproval" className="font-medium whitespace-nowrap">Sadece Onay Bekleyenler</Label>
            </div>
          </div>
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
          
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) setEditingUser(null);
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
              <DialogTitle>Firma Profilini Düzenle</DialogTitle>
              <DialogDescription>
                 {editingUser ? `"${editingUser.name}" firmasının profilini güncelleyin.` : ''}
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 space-y-6">
              
            <Card>
                <CardHeader>
                    <CardTitle>Giriş ve Temel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-1.5">
                        <Label htmlFor="edit-logoUrl">Logo URL'si</Label>
                        <Input id="edit-logoUrl" value={currentFormData.logoUrl || ''} onChange={(e) => setCurrentFormData(prev => ({ ...prev, logoUrl: e.target.value }))} placeholder="https://.../logo.png" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-companyTitle">Firma Adı (*)</Label>
                            <Input id="edit-companyTitle" value={currentFormData.companyTitle || ''} onChange={(e) => setCurrentFormData(prev => ({ ...prev, name: e.target.value, companyTitle: e.target.value }))} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-username">Kullanıcı Adı (*)</Label>
                            <Input id="edit-username" value={currentFormData.username || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, username: e.target.value}))} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-email">E-posta Adresi (*)</Label>
                            <Input id="edit-email" type="email" value={currentFormData.email || ''} disabled />
                            <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-password">Şifre (*)</Label>
                            <Input id="edit-password" type="password" value={currentFormData.password || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, password: e.target.value}))} placeholder="Şifre girin" required/>
                        </div>
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="edit-category">Firma Kategorisi (*)</Label>
                        <Select 
                            value={currentFormData.category} 
                            onValueChange={(value) => setCurrentFormData(prev => ({...prev, category: value as CompanyCategory}))}
                        >
                            <SelectTrigger id="edit-category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {COMPANY_CATEGORIES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>İletişim Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-contactFullName">Yetkili Adı Soyadı (*)</Label>
                            <Input id="edit-contactFullName" value={currentFormData.contactFullName || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, contactFullName: e.target.value}))} required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-mobilePhone">Cep Telefonu (*)</Label>
                            <Input id="edit-mobilePhone" value={currentFormData.mobilePhone || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, mobilePhone: e.target.value}))} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-workPhone">İş Telefonu</Label>
                            <Input id="edit-workPhone" value={currentFormData.workPhone || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, workPhone: e.target.value}))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-fax">Fax</Label>
                            <Input id="edit-fax" value={currentFormData.fax || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, fax: e.target.value}))} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-website">Web Sitesi</Label>
                            <Input id="edit-website" value={currentFormData.website || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, website: e.target.value}))} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-companyDescription">Firma Tanıtım Yazısı</Label>
                        <Textarea id="edit-companyDescription" value={currentFormData.companyDescription || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, companyDescription: e.target.value}))} rows={2} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Adres ve Firma Tipi</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label className="font-medium">Firma Türü (*)</Label>
                        <RadioGroup value={currentFormData.companyType} onValueChange={(value) => setCurrentFormData(prev => ({...prev, companyType: value as CompanyUserType}))} className="flex gap-4">
                            {COMPANY_TYPES.map(type => (
                            <div key={type.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={type.value} id={`edit-type-${type.value}`} />
                                <Label htmlFor={`edit-type-${type.value}`} className="font-normal">{type.label}</Label>
                            </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-addressCity">Adres İl (*)</Label>
                            <Select value={currentFormData.addressCity} onValueChange={(v) => setCurrentFormData(prev => ({...prev, addressCity: v, addressDistrict: ''}))} required>
                                <SelectTrigger id="edit-addressCity"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                                <SelectContent>{TURKISH_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="edit-addressDistrict">Adres İlçe</Label>
                            <Select value={currentFormData.addressDistrict} onValueChange={(v) => setCurrentFormData(prev => ({...prev, addressDistrict: v}))} disabled={!availableDistricts.length}>
                                <SelectTrigger id="edit-addressDistrict"><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                                <SelectContent>{availableDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="edit-fullAddress">Açık Adres (*)</Label>
                        <Textarea id="edit-fullAddress" placeholder="Mahalle, cadde, sokak, no, daire..." value={currentFormData.fullAddress} onChange={(e) => setCurrentFormData(prev => ({...prev, fullAddress: e.target.value}))} required />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle>Çalışma Alanları ve Tercihler</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="font-medium text-sm mb-2 block">Çalışma Şekli</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {WORKING_METHODS.map(method => (
                            <div key={method.id} className="flex items-center space-x-2">
                            <Checkbox id={`edit-wm-${method.id}`} checked={(currentFormData.workingMethods || []).includes(method.id as WorkingMethodType)} onCheckedChange={() => handleDialogMultiCheckboxChange(method.id, 'workingMethods')} />
                            <Label htmlFor={`edit-wm-${method.id}`} className="font-normal text-sm">{method.label}</Label>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div>
                        <Label className="font-medium text-sm mb-2 block">Çalışma Yolu</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {WORKING_ROUTES.map(route => (
                            <div key={route.id} className="flex items-center space-x-2">
                            <Checkbox id={`edit-wr-${route.id}`} checked={(currentFormData.workingRoutes || []).includes(route.id as WorkingRouteType)} onCheckedChange={() => handleDialogMultiCheckboxChange(route.id, 'workingRoutes')} />
                            <Label htmlFor={`edit-wr-${route.id}`} className="font-normal text-sm">{route.label}</Label>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <Label className="font-medium text-md mb-3 block">Tercih Edilen İller (En fazla {MAX_PREFERRED_LOCATIONS})</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(currentFormData.preferredCities || []).map((city, index) => (
                            <div key={`edit-city-${index}`} className="space-y-1.5">
                                <Select value={city} onValueChange={(val) => handleDialogPreferredLocationChange(index, val, 'city')}>
                                <SelectTrigger><SelectValue placeholder={`Şehir ${index + 1}`} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>
                                    {TURKISH_CITIES.map(c => <SelectItem key={c} value={c} disabled={(currentFormData.preferredCities || []).includes(c) && city !== c}>{c}</SelectItem>)}
                                </SelectContent>
                                </Select>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <Label className="font-medium text-md mb-3 block">Tercih Edilen Ülkeler (En fazla {MAX_PREFERRED_LOCATIONS})</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(currentFormData.preferredCountries || []).map((country, index) => (
                            <div key={`edit-country-${index}`} className="space-y-1.5">
                                <Select value={country} onValueChange={(val) => handleDialogPreferredLocationChange(index, val, 'country')}>
                                <SelectTrigger><SelectValue placeholder={`Ülke ${index + 1}`} /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>
                                    {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code} disabled={(currentFormData.preferredCountries || []).includes(c.code) && country !== c.code}>{c.name}</SelectItem>)}
                                </SelectContent>
                                </Select>
                            </div>
                        ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle>Üyelik ve Durum</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-membershipStatus">Üyelik Durumu</Label>
                            <Select 
                                value={currentFormData.membershipStatus || 'Yok'} 
                                onValueChange={(value) => setCurrentFormData(prev => ({...prev, membershipStatus: value as CompanyUserProfile['membershipStatus']}))}
                                disabled={optionsLoading}
                            >
                                <SelectTrigger id="edit-membershipStatus">
                                    <SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Üyelik durumu seçin"}/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yok">Yok</SelectItem>
                                    {membershipOptions.map(opt => <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1.5">
                            <Label htmlFor="edit-membershipEndDate">Üyelik Bitiş Tarihi</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!currentFormData.membershipEndDate && "text-muted-foreground"}`}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {currentFormData.membershipEndDate && isValid(new Date(currentFormData.membershipEndDate!)) ? format(new Date(currentFormData.membershipEndDate!), "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                                    <Calendar 
                                        mode="single"
                                        locale={tr}
                                        selected={currentFormData.membershipEndDate ? new Date(currentFormData.membershipEndDate) : undefined}
                                        onSelect={(date) => {
                                            setCurrentFormData(prev => ({...prev, membershipEndDate: date}));
                                        }}
                                        disabled={(date) => date < new Date()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="edit-isActive" checked={currentFormData.isActive === true} onCheckedChange={(checked) => setCurrentFormData(prev => ({...prev, isActive: checked}))} />
                        <Label htmlFor="edit-isActive">Firma Onayı (Aktif/Pasif)</Label>
                    </div>
                </CardContent>
            </Card>
            </div>

            <DialogFooter className="p-6 pt-4 border-t sticky bottom-0 bg-background">
              <DialogClose asChild><Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button></DialogClose>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</> : 'Değişiklikleri Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
