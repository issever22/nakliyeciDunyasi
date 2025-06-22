
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
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
import { PlusCircle, Edit, Trash2, Search, Image as HeroIcon, Loader2, Video, FileImage, Type } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { HeroSlide, HeroSlideType, HeroSlideCreationData, HeroSlideUpdateData } from '@/types';
import { getAllHeroSlides, addHeroSlide, updateHeroSlide, deleteHeroSlide } from '@/services/heroSlidesService';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const SLIDE_TYPES: { value: HeroSlideType; label: string }[] = [
    { value: 'centered', label: 'Ortalı Tanıtım' },
    { value: 'left-aligned', label: 'Sola Hizalı Tanıtım' },
    { value: 'with-input', label: 'Form İçeren Tanıtım' },
    { value: 'split', label: 'İki Kolonlu Tanıtım' },
    { value: 'title-only', label: 'Sade Başlık' },
    { value: 'video-background', label: 'Video Arka Planlı' }
];

const createEmptyFormData = (): HeroSlideCreationData => ({
    type: 'centered',
    title: '',
    isActive: true,
    order: 0,
    backgroundImageUrl: '',
});

export default function HeroSlidesPage() {
  const { toast } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<Partial<HeroSlideCreationData>>(createEmptyFormData());

  const fetchSlides = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllHeroSlides();
    setSlides(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  useEffect(() => {
    if (editingSlide) {
      setCurrentFormData(editingSlide);
    } else {
      setCurrentFormData(createEmptyFormData());
    }
  }, [editingSlide, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingSlide(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFormData.title || !currentFormData.type) {
        toast({ title: "Hata", description: "Başlık ve Slayt Tipi alanları zorunludur.", variant: "destructive" });
        return;
    }
    setFormSubmitting(true);
    
    let success = false;
    if (editingSlide) {
      success = await updateHeroSlide(editingSlide.id, currentFormData as HeroSlideUpdateData);
      if(success) toast({ title: "Başarılı", description: "Slayt güncellendi." });
    } else {
      const newId = await addHeroSlide(currentFormData as HeroSlideCreationData);
      if (newId) {
        success = true;
        toast({ title: "Başarılı", description: "Yeni slayt eklendi." });
      }
    }

    if (success) {
      fetchSlides();
      setIsAddEditDialogOpen(false);
    } else {
      toast({ title: "Hata", description: `Slayt ${editingSlide ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`, variant: "destructive" });
    }
    setFormSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteHeroSlide(id);
    if (success) {
      toast({ title: "Başarılı", description: "Slayt silindi.", variant: "destructive" });
      fetchSlides();
    } else {
      toast({ title: "Hata", description: "Slayt silinirken bir sorun oluştu.", variant: "destructive" });
    }
  };

  const renderDialogFields = () => {
    const { type } = currentFormData;
    return (
        <>
            {/* Common Fields */}
            <div className="space-y-1.5"><Label htmlFor="slideTitle">Başlık (*)</Label><Input id="slideTitle" value={currentFormData.title || ''} onChange={(e) => setCurrentFormData(p => ({...p, title: e.target.value}))} required /></div>
            <div className="space-y-1.5"><Label htmlFor="slideSubtitle">Alt Başlık</Label><Textarea id="slideSubtitle" value={currentFormData.subtitle || ''} onChange={(e) => setCurrentFormData(p => ({...p, subtitle: e.target.value}))} rows={2} /></div>

            {/* Type-Specific Fields */}
            {['centered', 'left-aligned', 'with-input', 'title-only'].includes(type!) && <div className="space-y-1.5"><Label htmlFor="backgroundImageUrl">Arka Plan Resim URL'si</Label><Input id="backgroundImageUrl" value={(currentFormData as any).backgroundImageUrl || ''} onChange={(e) => setCurrentFormData(p => ({...p, backgroundImageUrl: e.target.value}))} /></div>}
            {['centered', 'left-aligned', 'video-background'].includes(type!) && <> <div className="space-y-1.5"><Label htmlFor="buttonText">Buton Yazısı</Label><Input id="buttonText" value={(currentFormData as any).buttonText || ''} onChange={(e) => setCurrentFormData(p => ({...p, buttonText: e.target.value}))} /></div> <div className="space-y-1.5"><Label htmlFor="buttonUrl">Buton URL</Label><Input id="buttonUrl" value={(currentFormData as any).buttonUrl || ''} onChange={(e) => setCurrentFormData(p => ({...p, buttonUrl: e.target.value}))} /></div> </>}
            {type === 'left-aligned' && <> <div className="space-y-1.5"><Label htmlFor="textColor">Yazı Rengi (örn: #FFFFFF)</Label><Input id="textColor" value={(currentFormData as any).textColor || ''} onChange={(e) => setCurrentFormData(p => ({...p, textColor: e.target.value}))} /></div> <div className="space-y-1.5"><Label htmlFor="overlayOpacity">Karartma Opaklığı (0-1)</Label><Input type="number" step="0.1" min="0" max="1" id="overlayOpacity" value={(currentFormData as any).overlayOpacity || ''} onChange={(e) => setCurrentFormData(p => ({...p, overlayOpacity: parseFloat(e.target.value)}))} /></div> </>}
            {type === 'with-input' && <> <div className="space-y-1.5"><Label htmlFor="inputPlaceholder">Form Alanı İpucu</Label><Input id="inputPlaceholder" value={(currentFormData as any).inputPlaceholder || ''} onChange={(e) => setCurrentFormData(p => ({...p, inputPlaceholder: e.target.value}))} /></div> <div className="space-y-1.5"><Label htmlFor="buttonText">Buton Yazısı (*)</Label><Input id="buttonText" value={(currentFormData as any).buttonText || ''} onChange={(e) => setCurrentFormData(p => ({...p, buttonText: e.target.value}))} required /></div> <div className="space-y-1.5"><Label htmlFor="formActionUrl">Form Hedef URL (*)</Label><Input id="formActionUrl" value={(currentFormData as any).formActionUrl || ''} onChange={(e) => setCurrentFormData(p => ({...p, formActionUrl: e.target.value}))} required /></div> </>}
            {type === 'split' && <> <div className="space-y-1.5"><Label>Medya Tipi</Label><Select value={(currentFormData as any).mediaType || 'image'} onValueChange={(v) => setCurrentFormData(p => ({...p, mediaType: v}))}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="image">Resim</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent></Select></div> <div className="space-y-1.5"><Label>Medya URL</Label><Input value={(currentFormData as any).mediaUrl || ''} onChange={(e) => setCurrentFormData(p => ({...p, mediaUrl: e.target.value}))} /></div> <div className="space-y-1.5"><Label>Buton Yazısı</Label><Input value={(currentFormData as any).buttonText || ''} onChange={(e) => setCurrentFormData(p => ({...p, buttonText: e.target.value}))} /></div> <div className="space-y-1.5"><Label>Buton URL</Label><Input value={(currentFormData as any).buttonUrl || ''} onChange={(e) => setCurrentFormData(p => ({...p, buttonUrl: e.target.value}))} /></div> <div className="space-y-1.5"><Label>Arka Plan Rengi</Label><Input value={(currentFormData as any).backgroundColor || ''} onChange={(e) => setCurrentFormData(p => ({...p, backgroundColor: e.target.value}))} placeholder="#FFFFFF"/></div> </>}
            {type === 'video-background' && <div className="space-y-1.5"><Label>Video URL</Label><Input value={(currentFormData as any).videoUrl || ''} onChange={(e) => setCurrentFormData(p => ({...p, videoUrl: e.target.value}))} /></div>}

            <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="order">Sıralama</Label>
                    <Input id="order" type="number" value={currentFormData.order || 0} onChange={(e) => setCurrentFormData(p => ({...p, order: parseInt(e.target.value, 10) || 0}))} />
                </div>
                 <div className="flex items-center space-x-2 pt-6">
                    <Switch id="isActive" checked={currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData(p => ({...p, isActive: checked}))} />
                    <Label htmlFor="isActive" className="font-medium cursor-pointer">Aktif mi?</Label>
                </div>
            </div>
        </>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><HeroIcon className="h-6 w-6 text-primary" /> Hero Alanı Yönetimi</CardTitle>
          <CardDescription>Ana sayfada gösterilecek dinamik slaytları yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-6">
            <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Slayt Ekle
            </Button>
          </div>
          {isLoading ? (
             <div className="space-y-4"> <Skeleton className="h-12 w-full" /> <Skeleton className="h-20 w-full" /> <Skeleton className="h-20 w-full" /> </div>
            ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sıra</TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Tipi</TableHead>
                  <TableHead className="text-center">Aktif</TableHead>
                  <TableHead className="text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.length > 0 ? slides.map((slide) => (
                  <TableRow key={slide.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{slide.order}</TableCell>
                    <TableCell>{slide.title}</TableCell>
                    <TableCell><Badge variant="outline">{SLIDE_TYPES.find(t => t.value === slide.type)?.label || slide.type}</Badge></TableCell>
                    <TableCell className="text-center"><Badge variant={slide.isActive ? "default" : "outline"} className={slide.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>{slide.isActive ? 'Evet' : 'Hayır'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(slide)} title="Düzenle"><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Sil" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>"{slide.title}" başlıklı slaytı silmek üzeresiniz. Bu işlem geri alınamaz.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(slide.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Kayıtlı slayt bulunamadı.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSlide ? 'Slaytı Düzenle' : 'Yeni Slayt Ekle'}</DialogTitle>
              <DialogDescription>{editingSlide ? `"${editingSlide.title}" slaytını güncelleyin.` : 'Yeni bir slayt için gerekli bilgileri girin.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
                <div className="space-y-1.5">
                    <Label htmlFor="slideType">Slayt Tipi (*)</Label>
                    <Select value={currentFormData.type} onValueChange={(value) => setCurrentFormData(p => ({ ...createEmptyFormData(), title: p.title, subtitle: p.subtitle, order: p.order, isActive: p.isActive, type: value as HeroSlideType }))} required>
                        <SelectTrigger id="slideType"><SelectValue/></SelectTrigger>
                        <SelectContent>{SLIDE_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                {renderDialogFields()}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button></DialogClose>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting}>{formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{editingSlide ? 'Değişiklikleri Kaydet' : 'Slayt Ekle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
