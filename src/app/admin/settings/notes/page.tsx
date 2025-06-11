
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
import { PlusCircle, Edit, Trash2, Search, StickyNote, BookUser, Code, Cog } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';

type NoteCategory = 'Yönetici' | 'Kullanıcı Geri Bildirimi' | 'Geliştirme' | 'Genel';

interface AdminNote {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdDate: Date;
  lastModifiedDate: Date;
  isImportant: boolean;
}

const initialNotes: AdminNote[] = [
  { id: 'note1', title: 'Yeni Üyelik Fiyatlarını Gözden Geçir', content: 'Premium üyelik fiyatı %10 artırılabilir mi? Rakip analizi yapılacak.', category: 'Yönetici', createdDate: new Date(2024, 5, 10), lastModifiedDate: new Date(2024, 5, 12), isImportant: true },
  { id: 'note2', title: 'Filtreleme Sorunu - Mobil', content: 'Kullanıcılar mobil cihazlarda şehir filtresinin bazen çalışmadığını bildiriyor.', category: 'Kullanıcı Geri Bildirimi', createdDate: new Date(2024, 5, 15), lastModifiedDate: new Date(2024, 5, 15), isImportant: true },
  { id: 'note3', name: 'Firestore Kuralları Güncellemesi', content: 'Yeni yetki belgeleri koleksiyonu için Firestore güvenlik kuralları yazılacak.', category: 'Geliştirme', createdDate: new Date(2024, 5, 18), lastModifiedDate: new Date(2024, 5, 18), isImportant: false },
];

export default function AdminNotesPage() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<AdminNote[]>(initialNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<AdminNote | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{ title: string; content: string; category: NoteCategory; isImportant: boolean }>({ title: '', content: '', category: 'Genel', isImportant: false });

  useEffect(() => {
    if (editingNote) {
      setCurrentFormData({
        title: editingNote.title,
        content: editingNote.content,
        category: editingNote.category,
        isImportant: editingNote.isImportant,
      });
    } else {
      setCurrentFormData({ title: '', content: '', category: 'Genel', isImportant: false });
    }
  }, [editingNote, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingNote(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (note: AdminNote) => {
    setEditingNote(note);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFormData.title.trim() || !currentFormData.content.trim()) {
        toast({ title: "Hata", description: "Başlık ve içerik boş bırakılamaz.", variant: "destructive" });
        return;
    }

    const noteData = {
      ...currentFormData,
      lastModifiedDate: new Date(),
    };

    if (editingNote) {
      setNotes(notes.map(n => n.id === editingNote.id ? { ...editingNote, ...noteData } : n));
      toast({ title: "Başarılı", description: "Not güncellendi." });
    } else {
      const newNote: AdminNote = { 
        id: `note${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, 
        ...noteData,
        createdDate: new Date(), 
      };
      setNotes([newNote, ...notes]);
      toast({ title: "Başarılı", description: "Yeni not eklendi." });
    }
    setIsAddEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    toast({ title: "Başarılı", description: "Not silindi.", variant: "destructive" });
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => b.lastModifiedDate.getTime() - a.lastModifiedDate.getTime());

  const CategoryIcon = ({ category }: { category: NoteCategory }) => {
    if (category === 'Yönetici') return <Cog className="h-4 w-4 mr-1.5 text-red-600" />;
    if (category === 'Kullanıcı Geri Bildirimi') return <BookUser className="h-4 w-4 mr-1.5 text-blue-600" />;
    if (category === 'Geliştirme') return <Code className="h-4 w-4 mr-1.5 text-green-600" />;
    return <StickyNote className="h-4 w-4 mr-1.5 text-gray-600" />;
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><StickyNote className="h-6 w-6 text-primary" /> Yönetici Notları</CardTitle>
          <CardDescription>Dahili kullanım için notlar oluşturun, düzenleyin ve takip edin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Not ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Not Ekle
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Başlık</TableHead>
                  <TableHead className="min-w-[150px]">Kategori</TableHead>
                  <TableHead className="min-w-[150px]">Son Güncelleme</TableHead>
                  <TableHead className="w-[100px] text-center">Önemli</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.length > 0 ? filteredNotes.map((note) => (
                  <TableRow key={note.id} className={`hover:bg-muted/50 ${note.isImportant ? 'bg-yellow-500/5' : ''}`}>
                    <TableCell className="font-medium">{note.title}</TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center w-fit">
                           <CategoryIcon category={note.category} /> {note.category}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(note.lastModifiedDate, "dd.MM.yyyy HH:mm", { locale: tr })}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={note.isImportant ? "destructive" : "outline"} className={note.isImportant ? "bg-yellow-500/20 text-yellow-700 border-yellow-500" : ""}>
                        {note.isImportant ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(note)} title="Düzenle" className="hover:bg-accent">
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
                                "{note.title}" başlıklı notu silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(note.id)} className="bg-destructive hover:bg-destructive/90">
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
                       {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı not bulunamadı.'}
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
          if (!isOpen) setEditingNote(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}</DialogTitle>
               <DialogDescription>
                 {editingNote ? `"${editingNote.title}" notunun bilgilerini güncelleyin.` : 'Yeni bir not için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="noteTitle" className="font-medium">Başlık (*)</Label>
                <Input id="noteTitle" value={currentFormData.title} onChange={(e) => setCurrentFormData({...currentFormData, title: e.target.value})} placeholder="Not başlığı" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="noteContent" className="font-medium">İçerik (*)</Label>
                <Textarea id="noteContent" value={currentFormData.content} onChange={(e) => setCurrentFormData({...currentFormData, content: e.target.value})} placeholder="Not içeriği..." rows={6}/>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="noteCategory" className="font-medium">Kategori (*)</Label>
                <Select value={currentFormData.category} onValueChange={(value: NoteCategory) => setCurrentFormData({...currentFormData, category: value})}>
                  <SelectTrigger id="noteCategory"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Genel">Genel</SelectItem>
                    <SelectItem value="Yönetici">Yönetici</SelectItem>
                    <SelectItem value="Kullanıcı Geri Bildirimi">Kullanıcı Geri Bildirimi</SelectItem>
                    <SelectItem value="Geliştirme">Geliştirme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="noteIsImportant" checked={currentFormData.isImportant} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isImportant: checked})} />
                <Label htmlFor="noteIsImportant" className="font-medium cursor-pointer">Önemli olarak işaretle</Label>
              </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editingNote ? 'Değişiklikleri Kaydet' : 'Not Ekle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

