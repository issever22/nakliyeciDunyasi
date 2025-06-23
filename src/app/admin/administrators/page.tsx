
"use client";

import { useState, useEffect, type FormEvent, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Loader2, ShieldAlert, PlusCircle, Edit, Trash2, User, Lock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { AdminProfile } from '@/types';
import { getAllAdmins, addAdmin, updateAdmin, deleteAdmin } from '@/services/adminsService';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdministratorsPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminProfile | null>(null);
  const [formData, setFormData] = useState<Partial<AdminProfile>>({ role: 'admin', isActive: true });
  
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    const adminInfo = localStorage.getItem('admin_profile_info');
    if(adminInfo) {
      try {
         // Although the full profile is stored, we only need the ID here.
         const parsedInfo = JSON.parse(adminInfo); 
         // Assuming login saves the full profile with ID now. Let's adjust for that.
         // Let's assume the profile from login has an ID.
         const profile = JSON.parse(localStorage.getItem('admin_full_profile') || '{}');
         setCurrentAdminId(profile.id || null);
      } catch (e) {
        console.error("Could not parse admin info from storage", e);
      }
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllAdmins();
    setAdmins(data);
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    if (editingAdmin) {
      setFormData({
        userName: editingAdmin.userName,
        role: editingAdmin.role,
        isActive: editingAdmin.isActive,
        password: '' // Always clear password field for editing
      });
    } else {
      setFormData({ userName: '', role: 'admin', isActive: true, password: '' });
    }
  }, [editingAdmin, isModalOpen]);

  const handleOpenAddModal = () => {
    setEditingAdmin(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (admin: AdminProfile) => {
    setEditingAdmin(admin);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.userName) {
        toast({ title: "Hata", description: "Kullanıcı adı boş bırakılamaz.", variant: "destructive" });
        return;
    }
    if (!editingAdmin && (!formData.password || formData.password.length < 6)) {
        toast({ title: "Hata", description: "Yeni admin için en az 6 karakterli bir şifre belirleyin.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        let result: { success: boolean; message: string; };
        if (editingAdmin) {
            const updateData: Partial<AdminProfile> = { role: formData.role, isActive: formData.isActive };
            if (formData.password) {
                if (formData.password.length < 6) {
                    toast({ title: "Hata", description: "Yeni şifre en az 6 karakter olmalıdır.", variant: "destructive" });
                    setIsSubmitting(false);
                    return;
                }
                updateData.password = formData.password;
            }
            result = await updateAdmin(editingAdmin.id, updateData);
        } else {
            result = await addAdmin({
                userName: formData.userName,
                password: formData.password!,
                role: formData.role || 'admin',
                isActive: formData.isActive === undefined ? true : formData.isActive
            });
        }

        if (result.success) {
            toast({ title: "Başarılı", description: result.message });
            setIsModalOpen(false);
            fetchAdmins();
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ title: "İşlem Başarısız", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (adminId: string) => {
      const result = await deleteAdmin(adminId);
      if (result.success) {
          toast({ title: "Başarılı", description: result.message, variant: "destructive"});
          fetchAdmins();
      } else {
          toast({ title: "Hata", description: result.message, variant: "destructive" });
      }
  };
  
  const filteredAdmins = useMemo(() => {
    return admins.filter(admin => admin.id !== currentAdminId);
  }, [admins, currentAdminId]);

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardTitle className="text-2xl flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-primary" /> Yönetici Yönetimi</CardTitle>
                <CardDescription>Yeni yöneticiler ekleyin, mevcutları düzenleyin veya silin.</CardDescription>
            </div>
            <Button onClick={handleOpenAddModal}>
                <PlusCircle className="mr-2 h-4 w-4"/> Yeni Yönetici Ekle
            </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full"/>
                <Skeleton className="h-12 w-full"/>
                <Skeleton className="h-12 w-full"/>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı Adı</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.length > 0 ? filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.userName}</TableCell>
                      <TableCell><Badge variant={admin.role === 'superAdmin' ? 'default' : 'secondary'}>{admin.role}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={admin.isActive ? "default" : "outline"} className={admin.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                          {admin.isActive ? <CheckCircle size={14} className="inline mr-1"/> : <XCircle size={14} className="inline mr-1"/>}
                          {admin.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(admin)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>"{admin.userName}" kullanıcısını kalıcı olarak sileceksiniz. Bu işlem geri alınamaz.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(admin.id)}>Onayla ve Sil</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Başka yönetici bulunmamaktadır.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
              <form onSubmit={handleSubmit}>
                  <DialogHeader>
                      <DialogTitle>{editingAdmin ? 'Yöneticiyi Düzenle' : 'Yeni Yönetici Ekle'}</DialogTitle>
                      <DialogDescription>
                          {editingAdmin ? `"${editingAdmin.userName}" kullanıcısının bilgilerini düzenleyin.` : 'Yeni bir yönetici hesabı oluşturun.'}
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="space-y-1.5">
                          <Label htmlFor="userName">Kullanıcı Adı</Label>
                          <Input id="userName" value={formData.userName || ''} onChange={e => setFormData(p => ({...p, userName: e.target.value}))} required disabled={!!editingAdmin}/>
                      </div>
                      <div className="space-y-1.5">
                          <Label htmlFor="password">Şifre</Label>
                          <Input id="password" type="password" value={formData.password || ''} onChange={e => setFormData(p => ({...p, password: e.target.value}))} placeholder={editingAdmin ? 'Değiştirmek için yeni şifre girin' : 'En az 6 karakter'}/>
                      </div>
                       <div className="space-y-1.5">
                          <Label htmlFor="role">Rol</Label>
                          <Select value={formData.role || 'admin'} onValueChange={v => setFormData(p => ({...p, role: v as 'admin' | 'superAdmin'}))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="superAdmin">Super Admin</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-2">
                           <Switch id="isActive" checked={formData.isActive} onCheckedChange={c => setFormData(p => ({...p, isActive: c}))} />
                           <Label htmlFor="isActive">Hesap Aktif mi?</Label>
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild><Button variant="outline" type="button" disabled={isSubmitting}>İptal</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          {editingAdmin ? 'Güncelle' : 'Ekle'}
                      </Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
