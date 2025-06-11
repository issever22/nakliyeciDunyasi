
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Search, PackageSearch, Boxes } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { CARGO_TYPES as DEFAULT_CARGO_TYPES } from '@/lib/constants'; // Import default cargo types

interface CargoTypeSetting {
  id: string;
  name: string;
  category?: string; // Example: Gıda, Sanayi, etc.
  isActive: boolean;
}

// Initialize with default cargo types from constants.ts
const initialCargoTypes: CargoTypeSetting[] = DEFAULT_CARGO_TYPES.map((name, index) => ({
    id: `ct_default_${index + 1}`,
    name: name,
    category: 'Genel', // Assign a default category or derive it if possible
    isActive: true,
}));

// Add a few custom ones for demonstration
initialCargoTypes.push(
    { id: 'ct_custom_1', name: 'Tehlikeli Madde', category: 'Özel', isActive: true },
    { id: 'ct_custom_2', name: 'Soğuk Zincir Ürünü', category: 'Gıda', isActive: true }
);


export default function CargoTypesPage() {
  const { toast } = useToast();
  const [cargoTypes, setCargoTypes] = useState<CargoTypeSetting[]>(initialCargoTypes);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingCargoType, setEditingCargoType] = useState<CargoTypeSetting | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{ name: string; category: string; isActive: boolean }>({ name: '', category: '', isActive: true });

  useEffect(() => {
    if (editingCargoType) {
      setCurrentFormData({
        name: editingCargoType.name,
        category: editingCargoType.category || '',
        isActive: editingCargoType.isActive,
      });
    } else {
      setCurrentFormData({ name: '', category: '', isActive: true });
    }
  }, [editingCargoType, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingCargoType(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (cargoType: CargoTypeSetting) => {
    setEditingCargoType(cargoType);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFormData.name.trim()) {
        toast({ title: "Hata", description: "Yük cinsi adı boş bırakılamaz.", variant: "destructive" });
        return;
    }
    if (editingCargoType) {
      setCargoTypes(cargoTypes.map(ct => ct.id === editingCargoType.id ? { ...editingCargoType, ...currentFormData } : ct));
      toast({ title: "Başarılı", description: "Yük cinsi güncellendi." });
    } else {
      const newCargoType: CargoTypeSetting = { 
        id: `ct${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, 
        ...currentFormData 
      };
      setCargoTypes([newCargoType, ...cargoTypes]);
      toast({ title: "Başarılı", description: "Yeni yük cinsi eklendi." });
    }
    setIsAddEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setCargoTypes(cargoTypes.filter(ct => ct.id !== id));
    toast({ title: "Başarılı", description: "Yük cinsi silindi.", variant: "destructive" });
  };

  const filteredCargoTypes = cargoTypes.filter(ct => 
    ct.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ct.category && ct.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Boxes className="h-6 w-6 text-primary" /> Yük Cinsleri Yönetimi</CardTitle>
          <CardDescription>Uygulamada kullanılacak yük cinslerini (kategorilerini) yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Yük cinsi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Yük Cinsi Ekle
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Yük Cinsi Adı</TableHead>
                  <TableHead className="min-w-[150px]">Kategori</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCargoTypes.length > 0 ? filteredCargoTypes.map((ct) => (
                  <TableRow key={ct.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{ct.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ct.category || '-'}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={ct.isActive ? "default" : "outline"} className={ct.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                        {ct.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ct)} title="Düzenle" className="hover:bg-accent">
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
                                "{ct.name}" adlı yük cinsini silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(ct.id)} className="bg-destructive hover:bg-destructive/90">
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
                      {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı yük cinsi bulunamadı.'}
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
          if (!isOpen) setEditingCargoType(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingCargoType ? 'Yük Cinsini Düzenle' : 'Yeni Yük Cinsi Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingCargoType ? `"${editingCargoType.name}" yük cinsinin bilgilerini güncelleyin.` : 'Yeni bir yük cinsi için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="cargoName" className="font-medium">Yük Cinsi Adı (*)</Label>
                <Input id="cargoName" value={currentFormData.name} onChange={(e) => setCurrentFormData({...currentFormData, name: e.target.value})} placeholder="Örn: Gıda Maddesi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cargoCategory" className="font-medium">Kategori</Label>
                <Input id="cargoCategory" value={currentFormData.category} onChange={(e) => setCurrentFormData({...currentFormData, category: e.target.value})} placeholder="Örn: Genel, Özel, Sanayi" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="cargoIsActive" checked={currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="cargoIsActive" className="font-medium cursor-pointer">Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editingCargoType ? 'Değişiklikleri Kaydet' : 'Yük Cinsi Ekle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
