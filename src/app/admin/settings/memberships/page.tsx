
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Search, Star, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { MembershipSetting, DurationUnit } from '@/types';
import { getAllMemberships, addMembership, updateMembership, deleteMembership } from '@/services/membershipsService';
import { Skeleton } from '@/components/ui/skeleton';

export default function MembershipsPage() {
  const { toast } = useToast();
  const [memberships, setMemberships] = useState<MembershipSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<MembershipSetting | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{ name: string; duration: string; durationUnit: DurationUnit; features: string; isActive: boolean; description: string }>({ name: '', duration: '', durationUnit: 'Ay', features: '', isActive: true, description: '' });

  const fetchMemberships = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllMemberships();
    setMemberships(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  useEffect(() => {
    if (editingMembership) {
      setCurrentFormData({
        name: editingMembership.name,
        duration: String(editingMembership.duration),
        durationUnit: editingMembership.durationUnit,
        features: editingMembership.features.join('\n'),
        isActive: editingMembership.isActive,
        description: editingMembership.description || '',
      });
    } else {
      setCurrentFormData({ name: '', duration: '', durationUnit: 'Ay', features: '', isActive: true, description: '' });
    }
  }, [editingMembership, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingMembership(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (membership: MembershipSetting) => {
    setEditingMembership(membership);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const durationNum = parseInt(currentFormData.duration, 10);

    if (!currentFormData.name.trim()) {
        toast({ title: "Hata", description: "Üyelik adı boş bırakılamaz.", variant: "destructive" });
        return;
    }
    if (isNaN(durationNum) || durationNum <= 0) {
      toast({ title: "Hata", description: "Geçerli bir süre girin.", variant: "destructive" });
      return;
    }
    setFormSubmitting(true);

    const featuresArray = currentFormData.features.split('\n').map(f => f.trim()).filter(f => f);

    const membershipData: Omit<MembershipSetting, 'id'> = {
      name: currentFormData.name,
      duration: durationNum,
      durationUnit: currentFormData.durationUnit,
      features: featuresArray,
      isActive: currentFormData.isActive,
      description: currentFormData.description,
    };
    
    let success = false;
    if (editingMembership) {
      success = await updateMembership(editingMembership.id, membershipData);
      if (success) toast({ title: "Başarılı", description: "Üyelik paketi güncellendi." });
    } else {
      const newId = await addMembership(membershipData);
      if (newId) {
        success = true;
        toast({ title: "Başarılı", description: "Yeni üyelik paketi eklendi." });
      }
    }

    if (success) {
      fetchMemberships();
      setIsAddEditDialogOpen(false);
    } else {
      toast({ title: "Hata", description: `Üyelik paketi ${editingMembership ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`, variant: "destructive" });
    }
    setFormSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteMembership(id);
    if (success) {
      toast({ title: "Başarılı", description: "Üyelik paketi silindi.", variant: "destructive" });
      fetchMemberships();
    } else {
      toast({ title: "Hata", description: "Üyelik paketi silinirken bir sorun oluştu.", variant: "destructive" });
    }
  };

  const filteredMemberships = memberships.filter(mem => 
    mem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mem.description && mem.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Star className="h-6 w-6 text-primary" /> Üyelik Paketleri Yönetimi</CardTitle>
          <CardDescription>Kullanıcılar için sunulan üyelik paketlerini yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Paket ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Paket Ekle
            </Button>
          </div>
           {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
             </div>
            ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Paket Adı</TableHead>
                  <TableHead className="w-[120px]">Süre</TableHead>
                  <TableHead className="min-w-[200px]">Özellikler</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemberships.length > 0 ? filteredMemberships.map((mem) => (
                  <TableRow key={mem.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{mem.name}</TableCell>
                    <TableCell>{mem.duration} {mem.durationUnit}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <ul className="list-disc list-inside">
                        {mem.features.slice(0,3).map((feature, i) => <li key={i}>{feature}</li>)}
                        {mem.features.length > 3 && <li>...ve daha fazlası</li>}
                      </ul>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={mem.isActive ? "default" : "outline"} className={mem.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                        {mem.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(mem)} title="Düzenle" className="hover:bg-accent">
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
                                "{mem.name}" adlı üyelik paketini silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(mem.id)} className="bg-destructive hover:bg-destructive/90">
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
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı üyelik paketi bulunamadı.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddEditDialogOpen} onOpenChange={(isOpen) => {
          setIsAddEditDialogOpen(isOpen);
          if (!isOpen) setEditingMembership(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingMembership ? 'Üyelik Paketini Düzenle' : 'Yeni Üyelik Paketi Ekle'}</DialogTitle>
               <DialogDescription>
                 {editingMembership ? `"${editingMembership.name}" paketinin bilgilerini güncelleyin.` : 'Yeni bir üyelik paketi için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="memName" className="font-medium">Paket Adı (*)</Label>
                <Input id="memName" value={currentFormData.name} onChange={(e) => setCurrentFormData({...currentFormData, name: e.target.value})} placeholder="Örn: Premium Üyelik" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="memDuration" className="font-medium">Süre (*)</Label>
                  <Input id="memDuration" type="number" value={currentFormData.duration} onChange={(e) => setCurrentFormData({...currentFormData, duration: e.target.value})} placeholder="Örn: 1" />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="memDurationUnit" className="font-medium">Süre Birimi (*)</Label>
                  <Select value={currentFormData.durationUnit} onValueChange={(value: DurationUnit) => setCurrentFormData({...currentFormData, durationUnit: value})}>
                    <SelectTrigger id="memDurationUnit"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gün">Gün</SelectItem>
                      <SelectItem value="Ay">Ay</SelectItem>
                      <SelectItem value="Yıl">Yıl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
               <div className="space-y-1.5">
                <Label htmlFor="memDesc" className="font-medium">Açıklama</Label>
                <Textarea id="memDesc" value={currentFormData.description} onChange={(e) => setCurrentFormData({...currentFormData, description: e.target.value})} placeholder="Paket hakkında kısa bir açıklama" rows={2}/>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="memFeatures" className="font-medium">Özellikler (Her satıra bir özellik)</Label>
                <Textarea id="memFeatures" value={currentFormData.features} onChange={(e) => setCurrentFormData({...currentFormData, features: e.target.value})} placeholder="Sınırsız ilan verme&#10;Öne çıkan ilanlar&#10;7/24 Destek" rows={4}/>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="memIsActive" checked={currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="memIsActive" className="font-medium cursor-pointer">Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingMembership ? 'Değişiklikleri Kaydet' : 'Paket Ekle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
