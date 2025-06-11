
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
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
import { PlusCircle, Edit, Trash2, Search, Users as UsersIcon, User as UserIcon, Building, ShieldAlert, CheckCircle, XCircle, Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, IndividualUserProfile, CompanyUserProfile, UserRole } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const initialUsers: UserProfile[] = [
  { id: 'user1', name: 'Ali Veli', email: 'ali.veli@example.com', role: 'individual', isActive: true, createdAt: new Date(2023, 10, 15) },
  { id: 'user2', name: 'Ayşe Yılmaz (Firma)', email: 'info@aysefirmasi.com', role: 'company', username: 'ayseFirma', contactFullName: 'Ayşe Yılmaz', mobilePhone: '05551234567', companyType: 'local', addressCity: 'İstanbul', fullAddress: 'Bir yer', workingMethods:[], workingRoutes:[], preferredCities:[], preferredCountries:[], isActive: true, createdAt: new Date(2023, 9, 20), membershipStatus: 'Premium' },
  { id: 'user3', name: 'Mehmet Kaya', email: 'mehmet.kaya@example.com', role: 'individual', isActive: false, createdAt: new Date(2024, 0, 5) },
  { id: 'user4', name: 'Nakliyat A.Ş.', email: 'destek@nakliyat.as', role: 'company', username: 'nakliyatAS', contactFullName: 'Caner Nakliyat', mobilePhone: '05329876543', companyType: 'local', addressCity: 'Ankara', fullAddress: 'Bir yer daha', workingMethods:[], workingRoutes:[], preferredCities:[], preferredCountries:[], isActive: true, createdAt: new Date(2023, 11, 1), membershipStatus: 'Standart' },
  { id: 'user5', name: 'Global Transport Ltd.', email: 'contact@globaltransport.com', role: 'company', username: 'globaltrans', contactFullName: 'John Doe', mobilePhone: '05421112233', companyType: 'foreign', addressCity: 'Berlin', fullAddress: 'Some Str. 123', workingMethods:[], workingRoutes:[], preferredCities:[], preferredCountries:[], isActive: false, createdAt: new Date(2024, 1, 10), membershipStatus: 'Yok' },
];

const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'individual', label: 'Bireysel Kullanıcı' },
  { value: 'company', label: 'Firma Kullanıcısı' },
];

const MEMBERSHIP_STATUS_OPTIONS = ['Yok', 'Standart', 'Premium'];


export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<Partial<UserProfile> & { role: UserRole, name: string, email: string }>({
    role: 'individual', name: '', email: '', isActive: true
  });

  useEffect(() => {
    if (editingUser) {
      setCurrentFormData({
        ...editingUser,
        name: editingUser.name || '', // Ensure name is not undefined
        email: editingUser.email || '', // Ensure email is not undefined
      });
    } else {
      setCurrentFormData({ role: 'individual', name: '', email: '', isActive: true, username: '', contactFullName: '', mobilePhone: '', membershipStatus: 'Yok' });
    }
  }, [editingUser, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingUser(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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


    if (editingUser) {
      const updatedUsers = users.map(u => u.id === editingUser.id ? { ...editingUser, ...currentFormData, name: currentFormData.name!, email: currentFormData.email! } as UserProfile : u);
      setUsers(updatedUsers);
      toast({ title: "Başarılı", description: "Kullanıcı güncellendi." });
    } else {
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        createdAt: new Date(),
        ...currentFormData,
        name: currentFormData.name!,
        email: currentFormData.email!,
        // Ensure company specific fields are initialized if role is company
        ...(currentFormData.role === 'company' ? {
            username: (currentFormData as CompanyUserProfile).username || `firma${Date.now()}`,
            contactFullName: (currentFormData as CompanyUserProfile).contactFullName || currentFormData.name!,
            mobilePhone: (currentFormData as CompanyUserProfile).mobilePhone || '',
            companyType: (currentFormData as CompanyUserProfile).companyType || 'local',
            addressCity: (currentFormData as CompanyUserProfile).addressCity || '',
            fullAddress: (currentFormData as CompanyUserProfile).fullAddress || '',
            workingMethods: (currentFormData as CompanyUserProfile).workingMethods || [],
            workingRoutes: (currentFormData as CompanyUserProfile).workingRoutes || [],
            preferredCities: (currentFormData as CompanyUserProfile).preferredCities || [],
            preferredCountries: (currentFormData as CompanyUserProfile).preferredCountries || [],
            membershipStatus: (currentFormData as CompanyUserProfile).membershipStatus || 'Yok',
        } : {})
      } as UserProfile;
      setUsers([newUser, ...users]);
      toast({ title: "Başarılı", description: "Yeni kullanıcı eklendi." });
    }
    setIsAddEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
    toast({ title: "Başarılı", description: "Kullanıcı silindi.", variant: "destructive" });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.role === 'company' && (user as CompanyUserProfile).username?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }, [users, searchTerm]);

  const getRoleBadge = (role: UserRole) => {
    if (role === 'company') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1"><Building size={14}/> Firma</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 flex items-center gap-1"><UserIcon size={14}/> Bireysel</Badge>;
  };
  
  const getMembershipBadge = (status?: string) => {
    if (!status || status === 'Yok') return <Badge variant="outline" className="text-xs">Yok</Badge>;
    if (status === 'Standart') return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-xs flex items-center gap-1"><Star size={12}/> Standart</Badge>;
    if (status === 'Premium') return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-xs flex items-center gap-1"><Star size={12}/> Premium</Badge>;
    return <Badge variant="outline" className="text-xs">{status}</Badge>;
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><UsersIcon className="h-6 w-6 text-primary" /> Kullanıcı Yönetimi</CardTitle>
          <CardDescription>Uygulamadaki bireysel ve firma kullanıcılarını yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Kullanıcı ara (Ad, E-posta, K.Adı)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kullanıcı Ekle
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="min-w-[180px]">Ad / Firma Adı</TableHead>
                  <TableHead className="min-w-[180px]">E-posta</TableHead>
                  <TableHead className="min-w-[120px]">Rol</TableHead>
                  <TableHead className="min-w-[120px]">Üyelik</TableHead>
                  <TableHead className="w-[120px]">Kayıt Tarihi</TableHead>
                  <TableHead className="w-[100px] text-center">Durum</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={(user as CompanyUserProfile).logoUrl || `https://placehold.co/40x40.png?text=${user.name.charAt(0)}`} alt={user.name} data-ai-hint="person company" />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                        {user.name}
                        {user.role === 'company' && <div className="text-xs text-muted-foreground">K.Adı: {(user as CompanyUserProfile).username}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.role === 'company' ? getMembershipBadge((user as CompanyUserProfile).membershipStatus) : '-'}
                    </TableCell>
                     <TableCell className="text-sm text-muted-foreground">
                        {user.createdAt ? format(user.createdAt, "dd.MM.yyyy", { locale: tr }) : '-'}
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
                                "{user.name}" adlı kullanıcıyı silmek üzeresiniz. Bu işlem geri alınamaz.
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
                    <TableCell colSpan={8} className="h-32 text-center">
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
        </CardContent>
      </Card>

      <Dialog open={isAddEditDialogOpen} onOpenChange={(isOpen) => {
          setIsAddEditDialogOpen(isOpen);
          if (!isOpen) setEditingUser(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingUser ? `"${editingUser.name}" kullanıcısının bilgilerini güncelleyin.` : 'Yeni bir kullanıcı için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="userRole" className="font-medium">Kullanıcı Rolü (*)</Label>
                <Select 
                    value={currentFormData.role} 
                    onValueChange={(value: UserRole) => setCurrentFormData(prev => ({...prev, role: value, name: prev.name || '', email: prev.email || ''}))}
                    disabled={!!editingUser}
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
                    <Input id="companyTitle" value={currentFormData.name || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, name: e.target.value}))} placeholder="Firma resmi ünvanı" />
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
                        onValueChange={(value) => setCurrentFormData(prev => ({...(prev as CompanyUserProfile), membershipStatus: value}))}
                    >
                    <SelectTrigger id="membershipStatus"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {MEMBERSHIP_STATUS_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="space-y-1.5">
                <Label htmlFor="userEmail" className="font-medium">E-posta Adresi (*)</Label>
                <Input id="userEmail" type="email" value={currentFormData.email || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, email: e.target.value}))} placeholder="kullanici@example.com" />
              </div>
              
              {!editingUser && ( // Only show password for new users
                 <div className="space-y-1.5">
                    <Label htmlFor="userPassword">Şifre (Yeni Kullanıcı)</Label>
                    <Input id="userPassword" type="password" placeholder="Yeni şifre belirleyin" 
                        onChange={(e) => setCurrentFormData(prev => ({...prev, password: e.target.value}))} 
                    />
                    <p className="text-xs text-muted-foreground">Kullanıcı ilk girişte şifresini değiştirebilir.</p>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="userIsActive" checked={currentFormData.isActive === undefined ? true : currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData(prev => ({...prev, isActive: checked}))} />
                <Label htmlFor="userIsActive" className="font-medium cursor-pointer">Aktif Kullanıcı</Label>
              </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editingUser ? 'Değişiklikleri Kaydet' : 'Kullanıcı Ekle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
