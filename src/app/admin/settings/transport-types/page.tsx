
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
import { PlusCircle, Edit, Trash2, Search, Route as RouteIcon, RouteOff, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { TransportTypeSetting, ApplicableTo } from '@/types';
import { getAllTransportTypes, addTransportType, updateTransportType, deleteTransportType } from '@/services/transportTypesService';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransportTypesPage() {
  const { toast } = useToast();
  const [transportTypes, setTransportTypes] = useState<TransportTypeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingTransportType, setEditingTransportType] = useState<TransportTypeSetting | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{ name: string; description: string; applicableTo: ApplicableTo; isActive: boolean }>({ name: '', description: '', applicableTo: 'Ticari', isActive: true });

  const fetchTransportTypes = useCallback(async () => {
    setIsLoading(true);
    const types = await getAllTransportTypes();
    setTransportTypes(types);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTransportTypes();
  }, [fetchTransportTypes]);

  useEffect(() => {
    if (editingTransportType) {
      setCurrentFormData({
        name: editingTransportType.name,
        description: editingTransportType.description || '',
        applicableTo: editingTransportType.applicableTo,
        isActive: editingTransportType.isActive,
      });
    } else {
      setCurrentFormData({ name: '', description: '', applicableTo: 'Ticari', isActive: true });
    }
  }, [editingTransportType, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingTransportType(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (transportType: TransportTypeSetting) => {
    setEditingTransportType(transportType);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
     if (!currentFormData.name.trim()) {
        toast({ title: "Hata", description: "Taşımacılık türü adı boş bırakılamaz.", variant: "destructive" });
        return;
    }
    setFormSubmitting(true);
    let success = false;
    if (editingTransportType) {
      success = await updateTransportType(editingTransportType.id, currentFormData);
      if (success) toast({ title: "Başarılı", description: "Taşımacılık türü güncellendi." });
    } else {
      const newId = await addTransportType(currentFormData);
      if (newId) {
        success = true;
        toast({ title: "Başarılı", description: "Yeni taşımacılık türü eklendi." });
      }
    }
    
    if (success) {
      fetchTransportTypes();
      setIsAddEditDialogOpen(false);
    } else {
      toast({ title: "Hata", description: `Taşımacılık türü ${editingTransportType ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`, variant: "destructive" });
    }
    setFormSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteTransportType(id);
    if (success) {
      toast({ title: "Başarılı", description: "Taşımacılık türü silindi.", variant: "destructive" });
      fetchTransportTypes();
    } else {
      toast({ title: "Hata", description: "Taşımacılık türü silinirken bir sorun oluştu.", variant: "destructive" });
    }
  };

  const filteredTransportTypes = transportTypes.filter(tt => 
    tt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tt.description && tt.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    tt.applicableTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><RouteIcon className="h-6 w-6 text-primary" /> Taşımacılık Türleri Yönetimi</CardTitle>
          <CardDescription>Sunulan farklı taşımacılık türlerini ve yöntemlerini yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tür ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Tür Ekle
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
                  <TableHead className="min-w-[200px]">Tür Adı</TableHead>
                  <TableHead className="min-w-[250px]">Açıklama</TableHead>
                  <TableHead className="min-w-[150px]">Uygulanabilirlik</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransportTypes.length > 0 ? filteredTransportTypes.map((tt) => (
                  <TableRow key={tt.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{tt.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tt.description || '-'}</TableCell>
                    <TableCell>{tt.applicableTo}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={tt.isActive ? "default" : "outline"} className={tt.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                        {tt.isActive ? <RouteIcon className="inline mr-1 h-3 w-3"/> : <RouteOff className="inline mr-1 h-3 w-3"/>}
                        {tt.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tt)} title="Düzenle" className="hover:bg-accent">
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
                                "{tt.name}" adlı taşımacılık türünü silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(tt.id)} className="bg-destructive hover:bg-destructive/90">
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
                       {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı taşımacılık türü bulunamadı.'}
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
          if (!isOpen) setEditingTransportType(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTransportType ? 'Taşımacılık Türünü Düzenle' : 'Yeni Taşımacılık Türü Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingTransportType ? `"${editingTransportType.name}" türünün bilgilerini güncelleyin.` : 'Yeni bir taşımacılık türü için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="typeName" className="font-medium">Tür Adı (*)</Label>
                <Input id="typeName" value={currentFormData.name} onChange={(e) => setCurrentFormData({...currentFormData, name: e.target.value})} placeholder="Örn: Ekspres Kargo" />
              </div>
               <div className="space-y-1.5">
                <Label htmlFor="applicableTo" className="font-medium">Hangi İlan Türü İçin? (*)</Label>
                <Select value={currentFormData.applicableTo} onValueChange={(value: ApplicableTo) => setCurrentFormData({...currentFormData, applicableTo: value})}>
                  <SelectTrigger id="applicableTo">
                    <SelectValue placeholder="Seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ticari">Ticari</SelectItem>
                    <SelectItem value="Evden Eve">Evden Eve</SelectItem>
                    <SelectItem value="Her İkisi de">Her İkisi de</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="typeDescription" className="font-medium">Açıklama</Label>
                <Textarea id="typeDescription" value={currentFormData.description} onChange={(e) => setCurrentFormData({...currentFormData, description: e.target.value})} placeholder="Taşımacılık türü hakkında kısa açıklama" rows={3}/>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="typeIsActive" checked={currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="typeIsActive" className="font-medium cursor-pointer">Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTransportType ? 'Değişiklikleri Kaydet' : 'Tür Ekle'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
