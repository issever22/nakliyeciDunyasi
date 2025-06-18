
"use client";

import { useState, useEffect, type FormEvent, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { PlusCircle, Edit, Trash2, Search, Building, ShieldAlert, CheckCircle, XCircle, Star, Clock, CalendarIcon, Loader2, ListFilter } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { CompanyUserProfile, CompanyCategory, CompanyRegisterData } from '@/types';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COMPANY_CATEGORIES } from '@/lib/constants';
import { 
  getAllUserProfiles, 
  updateUserProfile,
  deleteUserProfile,
  createCompanyUser as createCompanyUserServerAction,
} from '@/services/authService'; 
import { Skeleton } from '@/components/ui/skeleton';

const MEMBERSHIP_STATUS_OPTIONS = ['Yok', 'Standart', 'Premium'];

export default function UsersPage() {
  const { toast } = useToast();
  const [allCompanyUsers, setAllCompanyUsers] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUserProfile | null>(null);
  const [showOnlyMembers, setShowOnlyMembers] = useState(false);
  const [showOnlyPendingApproval, setShowOnlyPendingApproval] = useState(false);
  
  const [currentFormData, setCurrentFormData] = useState<Partial<CompanyUserProfile> & { name: string, email: string, category: CompanyCategory, password?: string }>({ 
    role: 'company', name: '', email: '', isActive: true, category: 'Nakliyeci', password: ''
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const usersFromDb = await getAllUserProfiles();
    setAllCompanyUsers(usersFromDb);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
        name: editingUser.name || '', 
        email: editingUser.email || '',
        membershipEndDate: membershipEndDateToSet,
        role: 'company', 
        category: editingUser.category || 'Nakliyeci',
        password: '', // Clear password for edit mode
      });
    } else {
      // For new company user profile
      setCurrentFormData({
        role: 'company',
        name: '',
        email: '',
        password: '',
        isActive: true, // Default for new company created by admin
        category: 'Nakliyeci',
        username: '',
        companyTitle: '',
        contactFullName: '',
        mobilePhone: '',
        membershipStatus: 'Yok',
        membershipEndDate: undefined,
        companyType: 'local',
        addressCity: '',
        fullAddress: '',
        workingMethods: [],
        workingRoutes: [],
        preferredCities: [],
        preferredCountries: [],
      });
    }
  }, [editingUser, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingUser(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (user: CompanyUserProfile) => {
    setEditingUser(user);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFormData.name?.trim() || !currentFormData.email?.trim()) {
        toast({ title: "Hata", description: "Firma Adı ve E-posta boş bırakılamaz.", variant: "destructive" });
        return;
    }
    if (!currentFormData.username?.trim()) {
        toast({ title: "Hata", description: "Kullanıcı Adı zorunludur.", variant: "destructive" });
        return;
    }
     if (!currentFormData.category?.trim()) {
        toast({ title: "Hata", description: "Firma Kategorisi zorunludur.", variant: "destructive" });
        return;
    }
    if (!currentFormData.contactFullName?.trim()) {
        toast({ title: "Hata", description: "Yetkili Adı Soyadı zorunludur.", variant: "destructive" });
        return;
    }
    if (!currentFormData.mobilePhone?.trim()) {
        toast({ title: "Hata", description: "Cep Telefonu zorunludur.", variant: "destructive" });
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


    if (editingUser) {
      const { id, createdAt, password, email, role, ...updateData } = dataToSubmit; 
      
      const success = await updateUserProfile(editingUser.id, updateData as Partial<CompanyUserProfile>);
      if (success) {
        toast({ title: "Başarılı", description: "Firma profili güncellendi." });
        fetchUsers();
      } else {
        toast({ title: "Hata", description: "Firma profili güncellenemedi.", variant: "destructive" });
      }
    } else {
      // Adding new company
      if (!currentFormData.password?.trim() || currentFormData.password.length < 6) {
        toast({ title: "Hata", description: "Yeni firma için en az 6 karakterli bir şifre girilmelidir.", variant: "destructive" });
        setFormSubmitting(false);
        return;
      }
      
      const registrationPayload: CompanyRegisterData = {
        role: 'company',
        email: currentFormData.email!,
        password: currentFormData.password!,
        name: currentFormData.companyTitle || currentFormData.name!,
        username: currentFormData.username!,
        category: currentFormData.category!,
        logoUrl: currentFormData.logoUrl || undefined,
        contactFullName: currentFormData.contactFullName!,
        workPhone: currentFormData.workPhone || undefined,
        mobilePhone: currentFormData.mobilePhone!,
        fax: currentFormData.fax || undefined,
        website: currentFormData.website || undefined,
        companyDescription: currentFormData.companyDescription || undefined,
        companyType: currentFormData.companyType!,
        addressCity: currentFormData.addressCity!,
        addressDistrict: currentFormData.addressDistrict || undefined,
        fullAddress: currentFormData.fullAddress!,
        workingMethods: currentFormData.workingMethods || [],
        workingRoutes: currentFormData.workingRoutes || [],
        preferredCities: currentFormData.preferredCities?.filter(c => c) || [],
        preferredCountries: currentFormData.preferredCountries?.filter(c => c) || [],
        isActive: currentFormData.isActive, // Pass admin's choice for initial active state
      };

      const result = await createCompanyUserServerAction(registrationPayload);
      if (result.profile) {
        toast({ title: "Başarılı", description: `Yeni firma "${result.profile.name}" oluşturuldu.`});
        fetchUsers();
      } else {
        toast({ title: "Firma Oluşturma Hatası", description: result.error || "Firma oluşturulamadı.", variant: "destructive"});
      }
    }
    setFormSubmitting(false);
    setIsAddEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteUserProfile(id); 
    if (success) {
      toast({ title: "Başarılı", description: "Firma profili silindi.", variant: "destructive" });
      fetchUsers();
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
    return allCompanyUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (user.category && user.category.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      if (showOnlyMembers && (!user.membershipStatus || user.membershipStatus === 'Yok')) return false;
      if (showOnlyPendingApproval && user.isActive === true) return false;
      return true;
    }).sort((a, b) => (parseISO(b.createdAt).getTime() || 0) - (parseISO(a.createdAt).getTime() || 0));
  }, [allCompanyUsers, searchTerm, showOnlyMembers, showOnlyPendingApproval]);

  const getMembershipBadge = (status?: string) => {
    if (!status || status === 'Yok') return <Badge variant="outline" className="text-xs">Yok</Badge>;
    if (status === 'Standart') return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-xs flex items-center gap-1"><Star size={12}/> Standart</Badge>;
    if (status === 'Premium') return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-xs flex items-center gap-1"><Star size={12}/> Premium</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  const renderUserTable = (userList: CompanyUserProfile[]) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]"></TableHead>
            <TableHead className="min-w-[180px]">Firma Adı</TableHead>
            <TableHead className="min-w-[150px]">Kategori</TableHead>
            <TableHead className="min-w-[180px]">E-posta</TableHead>
            <TableHead className="min-w-[120px]">Üyelik</TableHead>
            <TableHead className="min-w-[120px]">Kalan Üyelik</TableHead>
            <TableHead className="w-[120px]">Kayıt Tarihi</TableHead>
            <TableHead className="w-[100px] text-center">Durum (Onay)</TableHead>
            <TableHead className="w-[120px] text-right">Eylemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.length > 0 ? userList.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.logoUrl || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="company logo"/>
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                  {user.name}
                  <div className="text-xs text-muted-foreground">K.Adı: {user.username}</div>
              </TableCell>
              <TableCell><Badge variant="secondary" className="text-xs">{user.category}</Badge></TableCell>
              <TableCell className="text-sm">{user.email}</TableCell>
              <TableCell>{getMembershipBadge(user.membershipStatus)}</TableCell>
              <TableCell className="text-sm"><Clock size={14} className="inline mr-1 text-muted-foreground"/> {calculateRemainingDays(user.membershipEndDate)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt ? format(parseISO(user.createdAt), "dd.MM.yyyy", { locale: tr }) : '-'}
              </TableCell>
              <TableCell className="text-center">
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
              <TableCell colSpan={9} className="h-32 text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı firma kullanıcısı bulunamadı.'}
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading && allCompanyUsers.length === 0) {
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
          <CardTitle className="text-2xl flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Firma Kullanıcıları Yönetimi</CardTitle>
          <CardDescription>Uygulamadaki firma kullanıcılarını yönetin.</CardDescription>
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
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Firma Ekle
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-4 p-3 bg-muted/30 rounded-md border items-center">
            <div className="flex items-center space-x-2 flex-grow">
              <Switch
                  id="showOnlyMembers"
                  checked={showOnlyMembers}
                  onCheckedChange={setShowOnlyMembers}
              />
              <Label htmlFor="showOnlyMembers" className="font-medium whitespace-nowrap">Sadece Üyeliği Olanlar</Label>
            </div>
            <div className="flex items-center space-x-2 flex-grow">
              <Switch
                  id="showOnlyPendingApproval"
                  checked={showOnlyPendingApproval}
                  onCheckedChange={setShowOnlyPendingApproval}
              />
              <Label htmlFor="showOnlyPendingApproval" className="font-medium whitespace-nowrap">Sadece Onay Bekleyenler</Label>
            </div>
          </div>
          {isLoading ? <div><Skeleton className="h-64 w-full"/></div> : renderUserTable(filteredCompanyUsers)}
          
        </CardContent>
      </Card>

      <Dialog open={isAddEditDialogOpen} onOpenChange={(isOpen) => {
          setIsAddEditDialogOpen(isOpen);
          if (!isOpen) setEditingUser(null);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Firma Profilini Düzenle' : 'Yeni Firma Profili Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingUser ? `"${editingUser.name}" firmasının profilini güncelleyin.` : `Yeni bir firma profili için bilgileri girin.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyTitle" className="font-medium">Firma Adı (*)</Label>
                    <Input id="companyTitle" value={currentFormData.companyTitle || currentFormData.name || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, name: e.target.value, companyTitle: e.target.value}))} placeholder="Firma resmi ünvanı" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyUsername" className="font-medium">Kullanıcı Adı (Login) (*)</Label>
                    <Input id="companyUsername" value={currentFormData.username || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, username: e.target.value}))} placeholder="Firmanın giriş için kullanıcı adı" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyCategory" className="font-medium">Firma Kategorisi (*)</Label>
                    <Select 
                        value={currentFormData.category || 'Nakliyeci'} 
                        onValueChange={(value) => setCurrentFormData(prev => ({...prev, category: value as CompanyCategory}))}
                    >
                    <SelectTrigger id="companyCategory"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {COMPANY_CATEGORIES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-1.5">
                    <Label htmlFor="companyContactFullName" className="font-medium">Yetkili Adı Soyadı (*)</Label>
                    <Input id="companyContactFullName" value={currentFormData.contactFullName || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, contactFullName: e.target.value}))} placeholder="Firma yetkilisinin tam adı" />
                  </div>
                   <div className="space-y-1.5">
                    <Label htmlFor="companyMobilePhone" className="font-medium">Cep Telefonu (*)</Label>
                    <Input id="companyMobilePhone" value={currentFormData.mobilePhone || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, mobilePhone: e.target.value}))} placeholder="Yetkilinin cep telefonu" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="userEmail" className="font-medium">E-posta Adresi (*)</Label>
                    <Input id="userEmail" type="email" value={currentFormData.email || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, email: e.target.value}))} placeholder="kullanici@example.com" disabled={!!editingUser && !currentFormData.email?.includes('@example.com')} />
                    {editingUser && !currentFormData.email?.includes('@example.com') && <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>}
                  </div>
                  {!editingUser && (
                    <div className="space-y-1.5">
                        <Label htmlFor="companyPassword">Şifre (Yeni Firma İçin) (*)</Label>
                        <Input id="companyPassword" type="password" value={currentFormData.password || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, password: e.target.value}))} placeholder="En az 6 karakter" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="membershipStatus" className="font-medium">Üyelik Durumu</Label>
                    <Select 
                        value={currentFormData.membershipStatus || 'Yok'} 
                        onValueChange={(value) => setCurrentFormData(prev => ({...prev, membershipStatus: value as CompanyUserProfile['membershipStatus']}))}
                    >
                    <SelectTrigger id="membershipStatus"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {MEMBERSHIP_STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="membershipEndDate" className="font-medium">Üyelik Bitiş Tarihi</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!currentFormData.membershipEndDate && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentFormData.membershipEndDate && isValid(new Date(currentFormData.membershipEndDate!))
                                ? format(new Date(currentFormData.membershipEndDate!), "PPP", { locale: tr }) 
                                : <span>Tarih seçin</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar 
                                mode="single" 
                                selected={currentFormData.membershipEndDate ? new Date(currentFormData.membershipEndDate!) : undefined} 
                                onSelect={(date) => setCurrentFormData(prev => ({...prev, membershipEndDate: date ? date.toISOString().split('T')[0] : undefined}))} 
                                initialFocus 
                                locale={tr} 
                            />
                        </PopoverContent>
                    </Popover>
                  </div>
                </>
              
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="userIsActive" checked={currentFormData.isActive === undefined ? true : currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData(prev => ({...prev, isActive: checked}))} />
                <Label htmlFor="userIsActive" className="font-medium cursor-pointer">Firma Onay Durumu (Aktif/Pasif)</Label>
              </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Değişiklikleri Kaydet' : 'Yeni Firma Ekle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

