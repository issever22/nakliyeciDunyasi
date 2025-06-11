
"use client";

import { useState, useEffect, type FormEvent } from 'react';
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
import { PlusCircle, Edit, Trash2, Search, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

type RequiredFor = 'Bireysel' | 'Firma' | 'Her İkisi de';

interface AuthDoc {
  id: string;
  name: string;
  requiredFor: RequiredFor;
  details?: string;
  isActive: boolean;
}

const initialAuthDocs: AuthDoc[] = [
  { id: 'ad1', name: 'K1 Yetki Belgesi', requiredFor: 'Firma', details: 'Yurtiçi ticari eşya taşımacılığı yapacaklara verilir.', isActive: true },
  { id: 'ad2', name: 'SRC Belgesi', requiredFor: 'Bireysel', details: 'Ticari araç kullanacak sürücüler için mesleki yeterlilik belgesi.', isActive: true },
  { id: 'ad3', name: 'Psikoteknik Raporu', requiredFor: 'Bireysel', details: 'Ticari araç sürücülerinin alması gereken sağlık raporu.', isActive: true },
  { id: 'ad4', name: 'TIR Karnesi', requiredFor: 'Firma', details: 'Uluslararası karayolu taşımacılığında kullanılır.', isActive: false },
];

export default function AuthDocsPage() {
  const { toast } = useToast();
  const [authDocs, setAuthDocs] = useState<AuthDoc[]>(initialAuthDocs);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingAuthDoc, setEditingAuthDoc] = useState<AuthDoc | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{ name: string; requiredFor: RequiredFor; details: string; isActive: boolean }>({ name: '', requiredFor: 'Firma', details: '', isActive: true });

  useEffect(() => {
    if (editingAuthDoc) {
      setCurrentFormData({
        name: editingAuthDoc.name,
        requiredFor: editingAuthDoc.requiredFor,
        details: editingAuthDoc.details || '',
        isActive: editingAuthDoc.isActive,
      });
    } else {
      setCurrentFormData({ name: '', requiredFor: 'Firma', details: '', isActive: true });
    }
  }, [editingAuthDoc, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingAuthDoc(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (doc: AuthDoc) => {
    setEditingAuthDoc(doc);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
     if (!currentFormData.name.trim()) {
        toast({ title: "Hata", description: "Belge adı boş bırakılamaz.", variant: "destructive" });
        return;
    }

    if (editingAuthDoc) {
      setAuthDocs(authDocs.map(doc => doc.id === editingAuthDoc.id ? { ...editingAuthDoc, ...currentFormData } : doc));
      toast({ title: "Başarılı", description: "Yetki belgesi güncellendi." });
    } else {
      const newDoc: AuthDoc = { 
        id: `ad${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, 
        ...currentFormData 
      };
      setAuthDocs([newDoc, ...authDocs]);
      toast({ title: "Başarılı", description: "Yeni yetki belgesi eklendi." });
    }
    setIsAddEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAuthDocs(authDocs.filter(doc => doc.id !== id));
    toast({ title: "Başarılı", description: "Yetki belgesi silindi.", variant: "destructive" });
  };

  const filteredAuthDocs = authDocs.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.details && doc.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
    doc.requiredFor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Yetki Belgeleri Yönetimi</CardTitle>
          <CardDescription>Taşımacılık için gerekli olan yetki belgelerini yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Belge ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Yetki Belgesi Ekle
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Belge Adı</TableHead>
                  <TableHead className="min-w-[150px]">Kimler İçin Gerekli</TableHead>
                  <TableHead className="min-w-[250px]">Detaylar</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuthDocs.length > 0 ? filteredAuthDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.requiredFor}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.details || '-'}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={doc.isActive ? "default" : "outline"} className={doc.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                        {doc.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)} title="Düzenle" className="hover:bg-accent">
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
                                "{doc.name}" adlı yetki belgesini silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(doc.id)} className="bg-destructive hover:bg-destructive/90">
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
                       {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı yetki belgesi bulunamadı.'}
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
          if (!isOpen) setEditingAuthDoc(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingAuthDoc ? 'Yetki Belgesini Düzenle' : 'Yeni Yetki Belgesi Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingAuthDoc ? `"${editingAuthDoc.name}" belgesinin bilgilerini güncelleyin.` : 'Yeni bir yetki belgesi için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="docName" className="font-medium">Belge Adı (*)</Label>
                <Input id="docName" value={currentFormData.name} onChange={(e) => setCurrentFormData({...currentFormData, name: e.target.value})} placeholder="Örn: K1 Yetki Belgesi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="requiredFor" className="font-medium">Kimler İçin Gerekli (*)</Label>
                <Select value={currentFormData.requiredFor} onValueChange={(value: RequiredFor) => setCurrentFormData({...currentFormData, requiredFor: value})}>
                  <SelectTrigger id="requiredFor">
                    <SelectValue placeholder="Seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bireysel">Bireysel</SelectItem>
                    <SelectItem value="Firma">Firma</SelectItem>
                    <SelectItem value="Her İkisi de">Her İkisi de</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="docDetails" className="font-medium">Detaylar</Label>
                <Textarea id="docDetails" value={currentFormData.details} onChange={(e) => setCurrentFormData({...currentFormData, details: e.target.value})} placeholder="Belge hakkında kısa açıklama" rows={3}/>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch id="docIsActive" checked={currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="docIsActive" className="font-medium cursor-pointer">Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="outline">İptal</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editingAuthDoc ? 'Değişiklikleri Kaydet' : 'Belge Ekle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
