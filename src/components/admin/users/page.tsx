
"use client";

import { useState, useEffect, type FormEvent, useMemo, useCallback } from 'react';
// import Image from 'next/image'; // next/image artık logolar için kullanılmayacak
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle, Edit, Trash2, Search, Users as UsersIcon, User as UserIcon, Building, ShieldAlert, CheckCircle, XCircle, Star, Clock, CalendarIcon, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, IndividualUserProfile, CompanyUserProfile, UserRole, RegisterData } from '@/types';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  getAllUserProfiles, 
  updateUserProfile,
  deleteUserProfile,
  createUserProfile // Assuming a way to create users from admin, this might need more specific handling for passwords
} from '@/services/authService'; // Now importing Server Actions
import { Skeleton } from '@/components/ui/skeleton';

const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'individual', label: 'Bireysel Kullanıcı' },
  { value: 'company', label: 'Firma Kullanıcısı' },
];

const MEMBERSHIP_STATUS_OPTIONS = ['Yok', 'Standart', 'Premium'];

// For admin user creation, password needs to be handled carefully.
// Firebase Auth user creation typically happens on client or via Admin SDK.
// This form will create the Firestore profile; Firebase Auth user needs separate creation.
// For simplicity, this example will focus on profile management.
// A real admin "create user" would likely involve sending an invite or temporary password.
// Or, if creating a Firebase Auth user directly via a backend, it needs a password.
// Since this is admin panel, we might assume admin creates a profile and sets a temp password,
// or just profile details for an existing Firebase Auth user.
// The `createUserProfile` server action is designed to create the Firestore profile *after* Firebase Auth user is created.
// So, "Add New User" here will be more like "Add New User Profile".

export default function UsersPage() {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<UserRole>('individual');
  const [showOnlyMembers, setShowOnlyMembers] = useState(false);
  
  // Current form data now aligns more with UserProfile, less with RegisterData for "new user"
  const [currentFormData, setCurrentFormData] = useState<Partial<UserProfile> & { role: UserRole, name: string, email: string /* password removed */ }>({
    role: 'individual', name: '', email: '', isActive: true
  });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const usersFromDb = await getAllUserProfiles(); // Use new Server Action
    setAllUsers(usersFromDb);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (editingUser) {
      let membershipEndDateToSet: Date | undefined = undefined;
      if (editingUser.role === 'company' && (editingUser as CompanyUserProfile).membershipEndDate) {
          const parsedDate = parseISO((editingUser as CompanyUserProfile).membershipEndDate as string);
          if(isValid(parsedDate)) {
            membershipEndDateToSet = parsedDate;
          }
      }
      setCurrentFormData({
        ...editingUser,
        name: editingUser.name || '', 
        email: editingUser.email || '',
        ...(editingUser.role === 'company' && {
            membershipEndDate: membershipEndDateToSet
        })
      });
    } else {
      // For new user, default to activeTab role
      const defaultRole = activeTab;
      const baseNewUser: Partial<UserProfile> & { role: UserRole, name: string, email: string } = {
        role: defaultRole,
        name: '',
        email: '',
        isActive: true,
      };
      if (defaultRole === 'company') {
        setCurrentFormData({
          ...baseNewUser,
          username: '',
          companyTitle: '',
          contactFullName: '',
          mobilePhone: '',
          membershipStatus: 'Yok',
          membershipEndDate: undefined,
          companyType: 'local', // Default value
          addressCity: '',
          fullAddress: '',
          workingMethods: [],
          workingRoutes: [],
          preferredCities: [],
          preferredCountries: [],

        });
      } else {
        setCurrentFormData(baseNewUser);
      }
    }
  }, [editingUser, isAddEditDialogOpen, activeTab]);

  const handleAddNew = () => {
    setEditingUser(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFormData.name?.trim() || !currentFormData.email?.trim()) {
        toast({ title: "Hata", description: "Ad/Firma Adı ve E-posta boş bırakılamaz.", variant: "destructive" });
        return;
    }
    if (currentFormData.role === 'company' && !(currentFormData as CompanyUserProfile).username?.trim()) {
        toast({ title: "Hata", description: "Firma kullanıcıları için Kullanıcı Adı zorunludur.", variant: "destructive" });
        return;
    }
     if (currentFormData.role === 'company' && !(currentFormData as CompanyUserProfile).contactFullName?.trim()) {
        toast({ title: "Hata", description: "Firma kullanıcıları için Yetkili Adı Soyadı zorunludur.", variant: "destructive" });
        return;
    }
    // Password handling for new user creation is complex from admin panel without Admin SDK
    // For now, "Add New User" will focus on creating/updating the Firestore profile.
    // The Firebase Auth user would need to be created separately or via an invite system.
    /*
    if (!editingUser && !currentFormData.password?.trim()) { // Password only for new user via SDK
        toast({ title: "Hata", description: "Yeni kullanıcı için şifre zorunludur.", variant: "destructive" });
        return;
    }
    */
    setFormSubmitting(true);

    const dataToSubmit: any = { ...currentFormData };

    if (dataToSubmit.role === 'company' && dataToSubmit.membershipEndDate instanceof Date) {
        dataToSubmit.membershipEndDate = format(dataToSubmit.membershipEndDate, "yyyy-MM-dd");
    } else if (dataToSubmit.role === 'company' && dataToSubmit.membershipEndDate === undefined) {
        dataToSubmit.membershipEndDate = undefined; // Firestore handles undefined as 'not set'
    }

    if (editingUser) {
      const { id, createdAt, password, ...updateData } = dataToSubmit; 
      // Ensure role and email are not in updateData if they are not meant to be changed here
      delete updateData.role;
      delete updateData.email; 

      const success = await updateUserProfile(editingUser.id, updateData as Partial<UserProfile>);
      if (success) {
        toast({ title: "Başarılı", description: "Kullanıcı güncellendi." });
        fetchUsers();
      } else {
        toast({ title: "Hata", description: "Kullanıcı güncellenemedi.", variant: "destructive" });
      }
    } else {
      // Admin creating a new user profile.
      // This flow assumes Firebase Auth user already exists or will be created by other means.
      // We are creating the Firestore PROFILE document.
      // A proper "admin create user" would involve more, e.g. using Firebase Admin SDK on a backend.
      // For now, let's assume this is to add a profile for an existing auth user, or one to be created manually in Firebase console.
      // We'd need a UID. Since we don't have one, this part is problematic for *new* user creation from admin.
      // We'll disable "add new user" functionality that requires Firebase Auth creation from here for now
      // unless we implement a mechanism to get/set a UID.
      // For the purpose of this example, let's assume the admin is only editing existing users for now.
      // Or, if we were to create a NEW Firebase user, we'd need a password and call a different method.
      // The `createUserProfile` server action expects a UID.
      // For simplicity, let's say Admin CANNOT create new Firebase Auth users from here, only edit profiles.
      // TODO: Revisit admin user creation if needed.
      toast({ title: "Not Implemented", description: "Admin user creation from this panel is not fully implemented for Firebase Auth users. Please use Firebase Console or implement Admin SDK.", variant: "destructive" });
    }
    setFormSubmitting(false);
    setIsAddEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteUserProfile(id); // Use new Server Action
    if (success) {
      toast({ title: "Başarılı", description: "Kullanıcı profili silindi. (Firebase Auth kullanıcısı hala mevcut olabilir)", variant: "destructive" });
      fetchUsers();
    } else {
      toast({ title: "Hata", description: "Kullanıcı profili silinemedi.", variant: "destructive" });
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

  const filteredIndividualUsers = useMemo(() => {
    return allUsers.filter(user =>
      user.role === 'individual' &&
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => (parseISO(b.createdAt).getTime() || 0) - (parseISO(a.createdAt).getTime() || 0));
  }, [allUsers, searchTerm]);

  const filteredCompanyUsers = useMemo(() => {
    return allUsers.filter(user => {
      if (user.role !== 'company') return false;
      const companyUser = user as CompanyUserProfile;
      const matchesSearch = companyUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            companyUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (companyUser.username && companyUser.username.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;
      if (showOnlyMembers && (!companyUser.membershipStatus || companyUser.membershipStatus === 'Yok')) return false;
      return true;
    }).sort((a, b) => (parseISO(b.createdAt).getTime() || 0) - (parseISO(a.createdAt).getTime() || 0));
  }, [allUsers, searchTerm, showOnlyMembers]);

  const getMembershipBadge = (status?: string) => {
    if (!status || status === 'Yok') return <Badge variant="outline" className="text-xs">Yok</Badge>;
    if (status === 'Standart') return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-xs flex items-center gap-1"><Star size={12}/> Standart</Badge>;
    if (status === 'Premium') return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-xs flex items-center gap-1"><Star size={12}/> Premium</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };

  const renderUserTable = (userList: UserProfile[], type: UserRole) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">Logo/Avatar</TableHead>
            <TableHead className="min-w-[180px]">{type === 'company' ? 'Firma Adı' : 'Ad Soyad'}</TableHead>
            <TableHead className="min-w-[180px]">E-posta</TableHead>
            {type === 'company' && <TableHead className="min-w-[120px]">Üyelik</TableHead>}
            {type === 'company' && <TableHead className="min-w-[120px]">Kalan Üyelik</TableHead>}
            <TableHead className="w-[120px]">Kayıt Tarihi</TableHead>
            <TableHead className="w-[100px] text-center">Durum</TableHead>
            <TableHead className="w-[120px] text-right">Eylemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {userList.length > 0 ? userList.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                {user.role === 'company' && (user as CompanyUserProfile).logoUrl ? (
                  <div className="w-12 h-12 relative border border-muted rounded-md overflow-hidden bg-card flex items-center justify-center p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(user as CompanyUserProfile).logoUrl!}
                      alt={`${user.name} logo`}
                      className="max-w-full max-h-full object-contain"
                      data-ai-hint="company logo"
                    />
                  </div>
                ) : (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={(user.role === 'company' && (user as CompanyUserProfile).logoUrl) ? (user as CompanyUserProfile).logoUrl : `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="person company"/>
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
              </TableCell>
              <TableCell className="font-medium">
                  {user.name}
                  {user.role === 'company' && <div className="text-xs text-muted-foreground">K.Adı: {(user as CompanyUserProfile).username}</div>}
              </TableCell>
              <TableCell className="text-sm">{user.email}</TableCell>
              {type === 'company' && <TableCell>{getMembershipBadge((user as CompanyUserProfile).membershipStatus)}</TableCell>}
              {type === 'company' && <TableCell className="text-sm"><Clock size={14} className="inline mr-1 text-muted-foreground"/> {calculateRemainingDays((user as CompanyUserProfile).membershipEndDate)}</TableCell>}
              <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt ? format(parseISO(user.createdAt), "dd.MM.yyyy", { locale: tr }) : '-'}
              </TableCell>
              <TableCell className="text-center">
                  <Badge variant={user.isActive === undefined || user.isActive ? "default" : "outline"} className={user.isActive === undefined || user.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                  {user.isActive === undefined || user.isActive ? <CheckCircle size={14} className="inline mr-1"/> : <XCircle size={14} className="inline mr-1"/>}
                  {user.isActive === undefined || user.isActive ? 'Aktif' : 'Pasif'}
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
                          "{user.name}" adlı kullanıcının profilini silmek üzeresiniz. Bu işlem Firebase Auth kullanıcısını silmez. Bu işlem geri alınamaz.
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
              <TableCell colSpan={type === 'company' ? 8 : 6} className="h-32 text-center">
                <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı kullanıcı bulunamadı.'}
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading && allUsers.length === 0) {
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
            <Skeleton className="h-10 w-full mb-4" /> {/* For TabsList */}
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
          <CardTitle className="text-2xl flex items-center gap-2"><UsersIcon className="h-6 w-6 text-primary" /> Kullanıcı Yönetimi</CardTitle>
          <CardDescription>Uygulamadaki bireysel ve firma kullanıcılarını yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Kullanıcı ara (Ad, E-posta, K.Adı)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90" disabled>
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kullanıcı Ekle (Devre Dışı)
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="individual" className="flex items-center gap-2"><UserIcon size={16}/> Bireysel Kullanıcılar</TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-2"><Building size={16}/> Firma Kullanıcıları</TabsTrigger>
            </TabsList>
            <TabsContent value="individual">
              {isLoading ? <div><Skeleton className="h-64 w-full"/></div> : renderUserTable(filteredIndividualUsers, 'individual')}
            </TabsContent>
            <TabsContent value="company">
              <div className="flex items-center space-x-2 mb-4 p-3 bg-muted/30 rounded-md border">
                <Switch
                  id="showOnlyMembers"
                  checked={showOnlyMembers}
                  onCheckedChange={setShowOnlyMembers}
                />
                <Label htmlFor="showOnlyMembers" className="font-medium">Sadece Üyeliği Olanları Göster</Label>
              </div>
              {isLoading ? <div><Skeleton className="h-64 w-full"/></div> : renderUserTable(filteredCompanyUsers, 'company')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isAddEditDialogOpen} onOpenChange={(isOpen) => {
          setIsAddEditDialogOpen(isOpen);
          if (!isOpen) setEditingUser(null);
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Kullanıcı Profilini Düzenle' : 'Yeni Kullanıcı Profili Ekle (UID Gerekli)'}</DialogTitle>
              <DialogDescription>
                 {editingUser ? `"${editingUser.name}" kullanıcısının profilini güncelleyin.` : `Yeni bir ${currentFormData.role === 'individual' ? 'bireysel' : 'firma'} kullanıcı profili için bilgileri girin.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="userRole" className="font-medium">Kullanıcı Rolü</Label>
                <Select 
                    value={currentFormData.role} 
                    onValueChange={(value: UserRole) => setCurrentFormData(prev => ({...prev, role: value, name: prev.name || '', email: prev.email || ''}))}
                    disabled={!!editingUser} // Rolü sadece yeni kullanıcı eklerken (veya hiç eklenemiyorsa) veya düzenlerken değiştirilemez yap
                >
                  <SelectTrigger id="userRole"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {USER_ROLE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {currentFormData.role === 'individual' && (
                <div className="space-y-1.5">
                  <Label htmlFor="userName" className="font-medium">Ad Soyad (*)</Label>
                  <Input id="userName" value={currentFormData.name || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, name: e.target.value}))} placeholder="Kullanıcının tam adı" />
                </div>
              )}

              {currentFormData.role === 'company' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyTitle" className="font-medium">Firma Adı (*)</Label>
                    <Input id="companyTitle" value={currentFormData.name || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, name: e.target.value, companyTitle: e.target.value}))} placeholder="Firma resmi ünvanı" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyUsername" className="font-medium">Kullanıcı Adı (Login) (*)</Label>
                    <Input id="companyUsername" value={(currentFormData as CompanyUserProfile).username || ''} onChange={(e) => setCurrentFormData(prev => ({...(prev as CompanyUserProfile), username: e.target.value}))} placeholder="Firmanın giriş için kullanıcı adı" />
                  </div>
                   <div className="space-y-1.5">
                    <Label htmlFor="companyContactFullName" className="font-medium">Yetkili Adı Soyadı (*)</Label>
                    <Input id="companyContactFullName" value={(currentFormData as CompanyUserProfile).contactFullName || ''} onChange={(e) => setCurrentFormData(prev => ({...(prev as CompanyUserProfile), contactFullName: e.target.value}))} placeholder="Firma yetkilisinin tam adı" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="companyMobilePhone" className="font-medium">Cep Telefonu</Label>
                    <Input id="companyMobilePhone" value={(currentFormData as CompanyUserProfile).mobilePhone || ''} onChange={(e) => setCurrentFormData(prev => ({...(prev as CompanyUserProfile), mobilePhone: e.target.value}))} placeholder="Yetkilinin cep telefonu" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="membershipStatus" className="font-medium">Üyelik Durumu</Label>
                    <Select 
                        value={(currentFormData as CompanyUserProfile).membershipStatus || 'Yok'} 
                        onValueChange={(value) => setCurrentFormData(prev => ({...(prev as CompanyUserProfile), membershipStatus: value as CompanyUserProfile['membershipStatus']}))}
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
                        <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!(currentFormData as CompanyUserProfile).membershipEndDate && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {(currentFormData as CompanyUserProfile).membershipEndDate && isValid(new Date((currentFormData as CompanyUserProfile).membershipEndDate!))
                                ? format(new Date((currentFormData as CompanyUserProfile).membershipEndDate!), "PPP", { locale: tr }) 
                                : <span>Tarih seçin</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar 
                                mode="single" 
                                selected={(currentFormData as CompanyUserProfile).membershipEndDate ? new Date((currentFormData as CompanyUserProfile).membershipEndDate!) : undefined} 
                                onSelect={(date) => setCurrentFormData(prev => ({...(prev as CompanyUserProfile), membershipEndDate: date ? date.toISOString().split('T')[0] : undefined}))} 
                                initialFocus 
                                locale={tr} 
                            />
                        </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="userEmail" className="font-medium">E-posta Adresi (*)</Label>
                <Input id="userEmail" type="email" value={currentFormData.email || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, email: e.target.value}))} placeholder="kullanici@example.com" disabled={!!editingUser} />
                {editingUser && <p className="text-xs text-muted-foreground">E-posta adresi Firebase Auth ile yönetildiği için buradan değiştirilemez.</p>}
              </div>
              
              {/* Password field removed for admin edit/add profile form - passwords managed by Firebase Auth */}

              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="userIsActive" checked={currentFormData.isActive === undefined ? true : currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData(prev => ({...prev, isActive: checked}))} />
                <Label htmlFor="userIsActive" className="font-medium cursor-pointer">Aktif Kullanıcı</Label>
              </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting || !editingUser /* Disable if not editing, since new user creation is complex here */}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? 'Değişiklikleri Kaydet' : 'Kullanıcı Ekle (Devre Dışı)'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
