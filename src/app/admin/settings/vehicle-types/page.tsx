
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
import { PlusCircle, Edit, Trash2, Search, Truck, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { VehicleTypeSetting } from '@/types';
import { getAllVehicleTypes, addVehicleType, updateVehicleType, deleteVehicleType } from '@/services/vehicleTypesService';
import { Skeleton } from '@/components/ui/skeleton';

export default function VehicleTypesPage() {
  const { toast } = useToast();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleTypeSetting | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{ name: string; description: string; isActive: boolean }>({ name: '', description: '', isActive: true });

  const fetchVehicleTypes = useCallback(async () => {
    setIsLoading(true);
    const types = await getAllVehicleTypes();
    setVehicleTypes(types);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicleTypes();
  }, [fetchVehicleTypes]);

  useEffect(() => {
    if (editingVehicleType) {
      setCurrentFormData({
        name: editingVehicleType.name,
        description: editingVehicleType.description || '',
        isActive: editingVehicleType.isActive,
      });
    } else {
      setCurrentFormData({ name: '', description: '', isActive: true });
    }
  }, [editingVehicleType, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingVehicleType(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (vehicleType: VehicleTypeSetting) => {
    setEditingVehicleType(vehicleType);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFormData.name.trim()) {
        toast({ title: "Hata", description: "Araç tipi adı boş bırakılamaz.", variant: "destructive" });
        return;
    }
    setFormSubmitting(true);
    let success = false;
    if (editingVehicleType) {
      success = await updateVehicleType(editingVehicleType.id, currentFormData);
      if (success) toast({ title: "Başarılı", description: "Araç tipi güncellendi." });
    } else {
      const newId = await addVehicleType(currentFormData);
      if (newId) {
        success = true;
        toast({ title: "Başarılı", description: "Yeni araç tipi eklendi." });
      }
    }

    if (success) {
      fetchVehicleTypes();
      setIsAddEditDialogOpen(false);
    } else {
      toast({ title: "Hata", description: `Araç tipi ${editingVehicleType ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`, variant: "destructive" });
    }
    setFormSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteVehicleType(id);
    if (success) {
      toast({ title: "Başarılı", description: "Araç tipi silindi.", variant: "destructive" });
      fetchVehicleTypes();
    } else {
      toast({ title: "Hata", description: "Araç tipi silinirken bir sorun oluştu.", variant: "destructive" });
    }
  };

  const filteredVehicleTypes = vehicleTypes.filter(vt => 
    vt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vt.description && vt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Truck className="h-6 w-6 text-primary" /> Araç Tipleri Yönetimi</CardTitle>
          <CardDescription>Kayıtlı araç tiplerini yönetin, yenilerini ekleyin veya mevcutları güncelleyin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Araç tipi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Araç Tipi Ekle
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
                  <TableHead className="min-w-[150px]">Adı</TableHead>
                  <TableHead className="min-w-[250px]">Açıklama</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicleTypes.length > 0 ? filteredVehicleTypes.map((vt) => (
                  <TableRow key={vt.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{vt.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{vt.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={vt.isActive ? "default" : "outline"} className={vt.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                        {vt.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(vt)} title="Düzenle" className="hover:bg-accent">
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
                                "{vt.name}" adlı araç tipini silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(vt.id)} className="bg-destructive hover:bg-destructive/90">
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
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı araç tipi bulunamadı.'}
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
          if (!isOpen) setEditingVehicleType(null);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingVehicleType ? 'Araç Tipini Düzenle' : 'Yeni Araç Tipi Ekle'}</DialogTitle>
              <DialogDescription>
                {editingVehicleType ? `"${editingVehicleType.name}" araç tipinin bilgilerini güncelleyin.` : 'Yeni bir araç tipi için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="font-medium">Adı (*)</Label>
                <Input id="name" value={currentFormData.name} onChange={(e) => setCurrentFormData({...currentFormData, name: e.target.value})} placeholder="Örn: Kamyonet" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="font-medium">Açıklama</Label>
                <Textarea id="description" value={currentFormData.description} onChange={(e) => setCurrentFormData({...currentFormData, description: e.target.value})} placeholder="Araç tipi hakkında kısa bir açıklama" rows={3}/>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="isActive" checked={currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="isActive" className="font-medium cursor-pointer">Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingVehicleType ? 'Değişiklikleri Kaydet' : 'Araç Tipi Ekle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
