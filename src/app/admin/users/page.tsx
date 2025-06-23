

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
import { PlusCircle, Edit, Trash2, Search, Building, ShieldAlert, CheckCircle, XCircle, Star, Clock, CalendarIcon, Loader2, List, MapPin, Briefcase, AlertTriangle, Award, Check, StickyNote, CreditCard, Mail, Phone, Users as UsersIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { CompanyUserProfile, CompanyCategory, CompanyUserType, WorkingMethodType, WorkingRouteType, TurkishCity, CountryCode, MembershipSetting, CompanyNote } from '@/types';
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
import { getCompanyNotes, addCompanyNote } from '@/services/companyNotesService';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';


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
  const [activeFilter, setActiveFilter] = useState<'all' | 'members' | 'pending' | 'sponsors'>('all');
  
  const [currentFormData, setCurrentFormData] = useState<Partial<CompanyUserProfile>>({});
  const [availableDistricts, setAvailableDistricts] = useState<readonly string[]>([]);
  
  const [membershipOptions, setMembershipOptions] = useState<MembershipSetting[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  
  // State for new features
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isRecordFeeAlertOpen, setIsRecordFeeAlertOpen] = useState(false);
  const [noteContent, setNoteContent] = useState({ title: '', content: '' });
  const [membershipFee, setMembershipFee] = useState('');
  const [pendingMembershipSelection, setPendingMembershipSelection] = useState<{ status: CompanyUserProfile['membershipStatus'], endDate?: Date } | null>(null);

  const [isViewNotesModalOpen, setIsViewNotesModalOpen] = useState(false);
  const [notesForViewing, setNotesForViewing] = useState<CompanyNote[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<CompanyUserProfile | null>(null);
  const [noteFilter, setNoteFilter] = useState<'all' | 'note' | 'payment'>('all');


  const fetchUsers = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
        setIsLoadingMore(true);
    } else {
        setIsLoading(true);
        setFetchError(null);
    }
    
    const filters = {
        showOnlyMembers: activeFilter === 'members',
        showOnlyPendingApproval: activeFilter === 'pending',
        showOnlySponsors: activeFilter === 'sponsors',
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
  }, [activeFilter, lastVisibleDoc, toast]);


  const handleRefreshAndRefetch = () => {
    setLastVisibleDoc(null);
    setHasMore(true);
    fetchUsers(false);
  }

  useEffect(() => {
    handleRefreshAndRefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

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
    if (currentFormData.addressCountry === 'TR') {
        const city = currentFormData.addressCity;
        if (city && TURKISH_CITIES.includes(city as TurkishCity)) {
        setAvailableDistricts(DISTRICTS_BY_CITY_TR[city as TurkishCity] || []);
        } else {
        setAvailableDistricts([]);
        }
    } else {
        setAvailableDistricts([]);
        setCurrentFormData(prev => ({...prev, addressCity: ''}))
    }
  }, [currentFormData.addressCity, currentFormData.addressCountry]);

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
    
    const requiredFields: (keyof CompanyUserProfile)[] = ['name', 'email', 'username', 'category', 'contactFullName', 'mobilePhone', 'companyType', 'addressCountry', 'addressCity', 'fullAddress', 'password'];
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
    } else if (dataToSubmit.membershipEndDate === undefined || dataToSubmit.membershipEndDate === null) {
        dataToSubmit.membershipEndDate = null; 
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

  const filteredCompanyUsers = useMemo(() => {
    if (!searchTerm) return allCompanyUsers;
    return allCompanyUsers.filter(user => {
      const companyUser = user as CompanyUserProfile;
      const matchesSearch = companyUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            companyUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (companyUser.contactFullName && companyUser.contactFullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (companyUser.username && companyUser.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (companyUser.category && companyUser.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [allCompanyUsers, searchTerm]);
  
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
  
  const handleNoteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser || !noteContent.title.trim() || !noteContent.content.trim()) return;

    setFormSubmitting(true);
    const success = await addCompanyNote(editingUser.id, {
        title: noteContent.title,
        content: noteContent.content,
        author: 'Admin',
        type: 'note',
    });
    if (success) {
        toast({ title: "Başarılı", description: "Not eklendi." });
        setIsAddNoteModalOpen(false);
        setNoteContent({ title: '', content: '' });
    } else {
        toast({ title: "Hata", description: "Not eklenirken bir sorun oluştu.", variant: "destructive" });
    }
    setFormSubmitting(false);
  };

  const handleMembershipChange = (value: string) => {
    const newStatus = value as CompanyUserProfile['membershipStatus'];
    const oldStatus = currentFormData.membershipStatus || 'Yok';

    if (newStatus !== 'Yok' && oldStatus === 'Yok') {
        const selectedPackage = membershipOptions.find(opt => opt.name === newStatus);
        if (selectedPackage) {
            const newEndDate = new Date();
            if (selectedPackage.durationUnit === 'Ay') {
                newEndDate.setMonth(newEndDate.getMonth() + selectedPackage.duration);
            } else if (selectedPackage.durationUnit === 'Yıl') {
                newEndDate.setFullYear(newEndDate.getFullYear() + selectedPackage.duration);
            } else if (selectedPackage.durationUnit === 'Gün') {
                newEndDate.setDate(newEndDate.getDate() + selectedPackage.duration);
            }
            setPendingMembershipSelection({ status: newStatus, endDate: newEndDate });
            setIsRecordFeeAlertOpen(true);
        } else {
             setCurrentFormData(prev => ({ ...prev, membershipStatus: newStatus, membershipEndDate: undefined }));
        }
    } else if (newStatus === 'Yok') {
        setCurrentFormData(prev => ({...prev, membershipStatus: newStatus, membershipEndDate: undefined }));
    } else {
        setCurrentFormData(prev => ({...prev, membershipStatus: newStatus}));
    }
  };
  
  const handleRecordFeeSubmit = async () => {
    if (!editingUser || !pendingMembershipSelection) return;
    
    const fee = parseFloat(membershipFee);
    if (isNaN(fee) || fee <= 0) {
      toast({ title: "Geçersiz Ücret", description: "Lütfen geçerli bir ücret tutarı girin.", variant: "destructive" });
      return;
    }
    
    setFormSubmitting(true);
    
    const noteTitle = `Üyelik Satışı: ${editingUser.name}`;
    const noteContentText = `Yeni üyelik paketi: ${pendingMembershipSelection.status}. Alınan ücret: ${membershipFee} TL. Yeni son kullanma tarihi: ${pendingMembershipSelection.endDate ? format(pendingMembershipSelection.endDate, 'dd.MM.yyyy') : 'N/A'}`;
    
    const noteSuccess = await addCompanyNote(editingUser.id, {
      title: noteTitle,
      content: noteContentText,
      author: 'Admin',
      type: 'payment',
    });
    
    if (noteSuccess) {
        toast({ title: "Not Eklendi", description: "Üyelik ücreti kaydedildi." });
        setCurrentFormData(prev => ({
            ...prev, 
            membershipStatus: pendingMembershipSelection.status,
            membershipEndDate: pendingMembershipSelection.endDate
        }));
    } else {
        toast({ title: "Hata", description: "Ücret notu kaydedilemedi.", variant: "destructive" });
    }
    
    setFormSubmitting(false);
    setIsRecordFeeAlertOpen(false);
    setMembershipFee('');
    setPendingMembershipSelection(null);
  };

  const handleViewNotes = async (company: CompanyUserProfile) => {
    setViewingCompany(company);
    setNoteFilter('all');
    setIsNotesLoading(true);
    setIsViewNotesModalOpen(true);
    const notes = await getCompanyNotes(company.id);
    setNotesForViewing(notes);
    setIsNotesLoading(false);
  };
  
  const filteredNotesForViewing = useMemo(() => {
    if (noteFilter === 'all') {
        return notesForViewing;
    }
    return notesForViewing.filter(note => note.type === noteFilter);
  }, [notesForViewing, noteFilter]);


  const renderUserTable = (userList: CompanyUserProfile[]) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Firma Adı</TableHead>
            <TableHead className="min-w-[150px] hidden md:table-cell">Yetkili Kişi</TableHead>
            <TableHead className="min-w-[150px]">İletişim</TableHead>
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
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={user.logoUrl || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="company logo"/>
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        {user.name}
                        {isSponsor && <Badge variant="outline" className="text-xs ml-2 px-1 py-0 border-yellow-500 text-yellow-600">Sponsor</Badge>}
                        <div className="text-xs text-muted-foreground md:hidden">{user.contactFullName}</div>
                    </div>
                  </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{user.contactFullName}</TableCell>
              <TableCell className="text-sm">
                {user.mobilePhone && <div className="flex items-center gap-1.5"><Phone size={12}/>{user.mobilePhone}</div>}
                {user.email && <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail size={12}/>{user.email}</div>}
              </TableCell>
              <TableCell className="text-center hidden sm:table-cell">
                  <Badge variant={user.isActive ? "default" : "outline"} className={user.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-yellow-500/10 text-yellow-700 border-yellow-400"}>
                  {user.isActive ? <CheckCircle size={14} className="inline mr-1"/> : <XCircle size={14} className="inline mr-1"/>}
                  {user.isActive ? 'Onaylı' : 'Onay Bekliyor'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                   <Button variant="ghost" size="icon" onClick={() => handleViewNotes(user)} title="Notları Görüntüle" className="hover:bg-accent">
                    <StickyNote className="h-4 w-4" />
                  </Button>
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
          <CardTitle className="text-2xl flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Firma Yönetimi</CardTitle>
          <CardDescription>Onaylanmış firma kayıtlarını ve iletişim bilgilerini yönetin. Kişisel notlar ekleyebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Firma ara (Firma, Yetkili, E-posta)..."
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

          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-muted/30 rounded-lg border">
            <Button size="sm" variant={activeFilter === 'all' ? 'default' : 'ghost'} onClick={() => setActiveFilter('all')} className="h-8 px-3">Tümü</Button>
            <Button size="sm" variant={activeFilter === 'members' ? 'default' : 'ghost'} onClick={() => setActiveFilter('members')} className="h-8 px-3">Üyeliği Olanlar</Button>
            <Button size="sm" variant={activeFilter === 'pending' ? 'default' : 'ghost'} onClick={() => setActiveFilter('pending')} className="h-8 px-3">Onay Bekleyenler</Button>
            <Button size="sm" variant={activeFilter === 'sponsors' ? 'default' : 'ghost'} onClick={() => setActiveFilter('sponsors')} className="h-8 px-3">Sponsorlar</Button>
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
                            <Label htmlFor="edit-addressCountry">Adres Ülke (*)</Label>
                            <Select value={currentFormData.addressCountry} onValueChange={(v) => setCurrentFormData(prev => ({...prev, addressCountry: v}))} required>
                                <SelectTrigger id="edit-addressCountry"><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                                <SelectContent>{COUNTRIES.filter(c=>c.code !== 'OTHER').map(country => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-addressCity">Adres İl (*)</Label>
                            <Select value={currentFormData.addressCity} onValueChange={(v) => setCurrentFormData(prev => ({...prev, addressCity: v, addressDistrict: ''}))} required disabled={currentFormData.addressCountry !== 'TR'}>
                                <SelectTrigger id="edit-addressCity"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                                <SelectContent>{TURKISH_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-addressDistrict">Adres İlçe</Label>
                            <Select value={currentFormData.addressDistrict} onValueChange={(v) => setCurrentFormData(prev => ({...prev, addressDistrict: v}))} disabled={!availableDistricts.length}>
                                <SelectTrigger id="edit-addressDistrict"><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                                <SelectContent>{availableDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-fullAddress">Açık Adres (*)</Label>
                            <Textarea id="edit-fullAddress" placeholder="Mahalle, cadde, sokak, no, daire..." value={currentFormData.fullAddress} onChange={(e) => setCurrentFormData(prev => ({...prev, fullAddress: e.target.value}))} required />
                        </div>
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
                                onValueChange={handleMembershipChange}
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
                <CardFooter>
                    <Button type="button" variant="outline" onClick={() => {
                        if (editingUser) {
                            setNoteContent({ title: `Not: ${editingUser.name}`, content: '' });
                            setIsAddNoteModalOpen(true);
                        }
                    }}>
                    <StickyNote className="mr-2 h-4 w-4" />
                    Bu Firma İçin Not Ekle
                    </Button>
                </CardFooter>
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
      
      {viewingCompany && (
        <Dialog open={isViewNotesModalOpen} onOpenChange={(open) => {
            if (!open) {
              setViewingCompany(null);
              setNoteFilter('all');
            }
            setIsViewNotesModalOpen(open);
          }}>
          <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                  <DialogTitle>"{viewingCompany?.name}" İçin Notlar</DialogTitle>
                  <DialogDescription>
                      Bu firma için kaydedilmiş tüm yönetici notları ve ödeme kayıtları.
                  </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2 border-b pb-4">
                  <Button size="sm" variant={noteFilter === 'all' ? 'default' : 'ghost'} onClick={() => setNoteFilter('all')}>Tümü</Button>
                  <Button size="sm" variant={noteFilter === 'note' ? 'default' : 'ghost'} onClick={() => setNoteFilter('note')}>Notlar</Button>
                  <Button size="sm" variant={noteFilter === 'payment' ? 'default' : 'ghost'} onClick={() => setNoteFilter('payment')}>Ödemeler</Button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-1 -mx-1 pr-3">
                  {isNotesLoading ? (
                      <div className="flex justify-center items-center h-24">
                          <Loader2 className="h-6 w-6 animate-spin"/>
                      </div>
                  ) : filteredNotesForViewing.length > 0 ? (
                      <div className="space-y-4">
                          {filteredNotesForViewing.map(note => (
                              <div key={note.id} className="p-4 border rounded-lg bg-muted/30">
                                  <h4 className="font-semibold text-md flex items-center gap-2">
                                      {note.type === 'payment' ? <CreditCard className="h-4 w-4 text-green-600" /> : <StickyNote className="h-4 w-4 text-blue-600" />}
                                      {note.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{note.content}</p>
                                  <p className="text-xs text-muted-foreground/70 mt-3 text-right">
                                      {format(parseISO(note.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                                      {note.author && ` - ${note.author}`}
                                  </p>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-center text-muted-foreground py-8">
                          {noteFilter === 'all' ? 'Bu firma için kayıtlı not bulunmamaktadır.' : `Bu firma için kayıtlı ${noteFilter === 'note' ? 'not' : 'ödeme'} bulunmamaktadır.`}
                      </p>
                  )}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => {
                      setIsViewNotesModalOpen(false);
                      setViewingCompany(null);
                      setNoteFilter('all');
                  }}>Kapat</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      )}

      {editingUser && (
        <>
            <Dialog open={isAddNoteModalOpen} onOpenChange={setIsAddNoteModalOpen}>
                <DialogContent>
                    <form onSubmit={handleNoteSubmit}>
                        <DialogHeader>
                            <DialogTitle>Firma İçin Not Ekle</DialogTitle>
                            <DialogDescription>
                                "{editingUser.name}" firması için dahili bir not oluşturun. Bu notlar sadece adminler tarafından görülebilir.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="note-title" className="text-right">Başlık</Label>
                                <Input id="note-title" value={noteContent.title} onChange={(e) => setNoteContent(prev => ({...prev, title: e.target.value}))} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="note-content" className="text-right">İçerik</Label>
                                <Textarea id="note-content" value={noteContent.content} onChange={(e) => setNoteContent(prev => ({...prev, content: e.target.value}))} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline" type="button">İptal</Button></DialogClose>
                            <Button type="submit" disabled={formSubmitting}>
                                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Notu Kaydet
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isRecordFeeAlertOpen} onOpenChange={setIsRecordFeeAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Üyelik Ücreti Kaydı</AlertDialogTitle>
                    <AlertDialogDescription>
                        Firmaya yeni bir üyelik tanımlıyorsunuz. Lütfen alınan ücreti girin. Bu bilgi, bu firmaya özel "Notlar" bölümüne kaydedilecektir.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Label htmlFor="membership-fee">Alınan Ücret (TL)</Label>
                        <Input
                            id="membership-fee"
                            type="number"
                            value={membershipFee}
                            onChange={(e) => setMembershipFee(e.target.value)}
                            placeholder="Örn: 249"
                        />
                    </div>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPendingMembershipSelection(null)}>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRecordFeeSubmit} disabled={formSubmitting || !membershipFee}>
                        {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Onayla ve Kaydet
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
      )}

    </div>
  );
}
