
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, Edit, Trash2, Search, Megaphone, CalendarIcon, Users, Globe, Building, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import type { AnnouncementSetting, TargetAudience } from '@/types';
import { getAllAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/services/announcementsService';
import { Skeleton } from '@/components/ui/skeleton';


export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<AnnouncementSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementSetting | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{ title: string; content: string; targetAudience: TargetAudience; startDate?: Date; endDate?: Date; isActive: boolean }>({ title: '', content: '', targetAudience: 'Tümü', isActive: true });

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllAnnouncements();
    setAnnouncements(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    if (editingAnnouncement) {
      setCurrentFormData({
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        targetAudience: editingAnnouncement.targetAudience,
        startDate: editingAnnouncement.startDate && isValid(parseISO(editingAnnouncement.startDate)) ? parseISO(editingAnnouncement.startDate) : undefined,
        endDate: editingAnnouncement.endDate && isValid(parseISO(editingAnnouncement.endDate)) ? parseISO(editingAnnouncement.endDate) : undefined,
        isActive: editingAnnouncement.isActive,
      });
    } else {
      setCurrentFormData({ title: '', content: '', targetAudience: 'Tümü', isActive: true, startDate: undefined, endDate: undefined });
    }
  }, [editingAnnouncement, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingAnnouncement(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (announcement: AnnouncementSetting) => {
    setEditingAnnouncement(announcement);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFormData.title.trim() || !currentFormData.content.trim()) {
        toast({ title: "Hata", description: "Başlık ve içerik boş bırakılamaz.", variant: "destructive" });
        return;
    }
    if(currentFormData.startDate && currentFormData.endDate && currentFormData.startDate > currentFormData.endDate) {
        toast({ title: "Hata", description: "Bitiş tarihi başlangıç tarihinden önce olamaz.", variant: "destructive" });
        return;
    }
    setFormSubmitting(true);

    const announcementData: Partial<Omit<AnnouncementSetting, 'id' | 'createdAt'>> = {
      title: currentFormData.title,
      content: currentFormData.content,
      targetAudience: currentFormData.targetAudience,
      startDate: currentFormData.startDate ? format(currentFormData.startDate, "yyyy-MM-dd") : undefined,
      endDate: currentFormData.endDate ? format(currentFormData.endDate, "yyyy-MM-dd") : undefined,
      isActive: currentFormData.isActive,
    };
    
    let success = false;
    if (editingAnnouncement) {
      success = await updateAnnouncement(editingAnnouncement.id, announcementData);
      if(success) toast({ title: "Başarılı", description: "Duyuru güncellendi." });
    } else {
      const newId = await addAnnouncement(announcementData as Omit<AnnouncementSetting, 'id' | 'createdAt'>);
      if (newId) {
        success = true;
        toast({ title: "Başarılı", description: "Yeni duyuru eklendi." });
      }
    }

    if (success) {
      fetchAnnouncements();
      setIsAddEditDialogOpen(false);
    } else {
      toast({ title: "Hata", description: `Duyuru ${editingAnnouncement ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`, variant: "destructive" });
    }
    setFormSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteAnnouncement(id);
    if (success) {
      toast({ title: "Başarılı", description: "Duyuru silindi.", variant: "destructive" });
      fetchAnnouncements();
    } else {
      toast({ title: "Hata", description: "Duyuru silinirken bir sorun oluştu.", variant: "destructive" });
    }
  };

  const filteredAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ann.content.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());

  const AudienceIcon = ({ audience }: { audience: TargetAudience }) => {
    if (audience === 'Bireysel Kullanıcılar') return <Users className="h-4 w-4 mr-1.5 text-blue-600" />;
    if (audience === 'Firma Kullanıcıları') return <Building className="h-4 w-4 mr-1.5 text-purple-600" />;
    return <Globe className="h-4 w-4 mr-1.5 text-green-600" />;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> Duyurular Yönetimi</CardTitle>
          <CardDescription>Kullanıcılara gösterilecek önemli duyuruları ve bildirimleri yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Duyuru ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Duyuru Ekle
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
                  <TableHead className="min-w-[200px]">Başlık</TableHead>
                  <TableHead className="min-w-[150px]">Hedef Kitle</TableHead>
                  <TableHead className="w-[120px]">Başlangıç</TableHead>
                  <TableHead className="w-[120px]">Bitiş</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.length > 0 ? filteredAnnouncements.map((ann) => (
                  <TableRow key={ann.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{ann.title}</TableCell>
                    <TableCell className="text-sm">
                        <Badge variant="outline" className="flex items-center w-fit">
                            <AudienceIcon audience={ann.targetAudience} /> {ann.targetAudience}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{ann.startDate ? format(parseISO(ann.startDate), "dd.MM.yyyy", { locale: tr }) : '-'}</TableCell>
                    <TableCell className="text-sm">{ann.endDate ? format(parseISO(ann.endDate), "dd.MM.yyyy", { locale: tr }) : '-'}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={ann.isActive ? "default" : "outline"} className={ann.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                        {ann.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ann)} title="Düzenle" className="hover:bg-accent">
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
                                "{ann.title}" başlıklı duyuruyu silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(ann.id)} className="bg-destructive hover:bg-destructive/90">
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
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı duyuru bulunamadı.'}
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
          if (!isOpen) setEditingAnnouncement(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingAnnouncement ? 'Duyuruyu Düzenle' : 'Yeni Duyuru Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingAnnouncement ? `"${editingAnnouncement.title}" duyurusunun bilgilerini güncelleyin.` : 'Yeni bir duyuru için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="annTitle" className="font-medium">Başlık (*)</Label>
                <Input id="annTitle" value={currentFormData.title} onChange={(e) => setCurrentFormData({...currentFormData, title: e.target.value})} placeholder="Duyuru başlığı" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="annContent" className="font-medium">İçerik (*)</Label>
                <Textarea id="annContent" value={currentFormData.content} onChange={(e) => setCurrentFormData({...currentFormData, content: e.target.value})} placeholder="Duyuru metni..." rows={5}/>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="annTargetAudience" className="font-medium">Hedef Kitle (*)</Label>
                <Select value={currentFormData.targetAudience} onValueChange={(value: TargetAudience) => setCurrentFormData({...currentFormData, targetAudience: value})}>
                  <SelectTrigger id="annTargetAudience"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tümü">Tümü</SelectItem>
                    <SelectItem value="Bireysel Kullanıcılar">Bireysel Kullanıcılar</SelectItem>
                    <SelectItem value="Firma Kullanıcıları">Firma Kullanıcıları</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="annStartDate" className="font-medium">Başlangıç Tarihi (Opsiyonel)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!currentFormData.startDate && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentFormData.startDate ? format(currentFormData.startDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={currentFormData.startDate} onSelect={(date) => setCurrentFormData({...currentFormData, startDate: date || undefined})} initialFocus locale={tr} />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="annEndDate" className="font-medium">Bitiş Tarihi (Opsiyonel)</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!currentFormData.endDate && "text-muted-foreground"}`}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {currentFormData.endDate ? format(currentFormData.endDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={currentFormData.endDate} onSelect={(date) => setCurrentFormData({...currentFormData, endDate: date || undefined})} initialFocus locale={tr} />
                        </PopoverContent>
                    </Popover>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="annIsActive" checked={currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="annIsActive" className="font-medium cursor-pointer">Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAnnouncement ? 'Değişiklikleri Kaydet' : 'Duyuru Ekle'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
