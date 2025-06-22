
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

    // Helper to handle input changes
    const handleFieldChange = (field: keyof HeroSlide, value: any) => {
      setCurrentFormData(p => ({ ...p, [field]: value }));
    };
    const handleNumericFieldChange = (field: keyof HeroSlide, value: string) => {
        setCurrentFormData(p => ({ ...p, [field]: value ? parseFloat(value) : undefined }));
    };

    const fields = {
      title: <div className="space-y-1.5" key="title"><Label htmlFor="slideTitle">Başlık (*)</Label><Input id="slideTitle" value={currentFormData.title || ''} onChange={(e) => handleFieldChange('title' as any, e.target.value)} required /></div>,
      subtitle: <div className="space-y-1.5" key="subtitle"><Label>Alt Başlık</Label><Textarea value={currentFormData.subtitle || ''} onChange={(e) => handleFieldChange('subtitle', e.target.value)} rows={2} /></div>,
      backgroundImageUrl: <div className="space-y-1.5" key="bgUrl"><Label>Arka Plan Resim URL'si</Label><Input value={(currentFormData as any).backgroundImageUrl || ''} onChange={(e) => handleFieldChange('backgroundImageUrl' as any, e.target.value)} /></div>,
      videoUrl: <div className="space-y-1.5" key="videoUrl"><Label>Video URL</Label><Input value={(currentFormData as any).videoUrl || ''} onChange={(e) => handleFieldChange('videoUrl' as any, e.target.value)} /></div>,
      buttonText: <div className="space-y-1.5" key="btnTxt"><Label>Buton Yazısı</Label><Input value={(currentFormData as any).buttonText || ''} onChange={(e) => handleFieldChange('buttonText' as any, e.target.value)} /></div>,
      buttonUrl: <div className="space-y-1.5" key="btnUrl"><Label>Buton URL</Label><Input value={(currentFormData as any).buttonUrl || ''} onChange={(e) => handleFieldChange('buttonUrl' as any, e.target.value)} /></div>,
      buttonIcon: <div className="space-y-1.5" key="btnIcon"><Label>Buton İkonu (Lucide-react)</Label><Input value={(currentFormData as any).buttonIcon || ''} onChange={(e) => handleFieldChange('buttonIcon' as any, e.target.value)} placeholder="örn: ArrowRight" /></div>,
      textColor: <div className="space-y-1.5" key="txtColor"><Label>Yazı Rengi (örn: #FFFFFF)</Label><Input placeholder="#FFFFFF" value={(currentFormData as any).textColor || ''} onChange={(e) => handleFieldChange('textColor' as any, e.target.value)} /></div>,
      overlayOpacity: <div className="space-y-1.5" key="overlay"><Label>Karartma Opaklığı (0-1)</Label><Input type="number" step="0.1" min="0" max="1" placeholder="0.5" value={(currentFormData as any).overlayOpacity ?? ''} onChange={(e) => handleNumericFieldChange('overlayOpacity' as any, e.target.value)} /></div>,
      inputPlaceholder: <div className="space-y-1.5" key="inputPl"><Label>Form Alanı İpucu</Label><Input value={(currentFormData as any).inputPlaceholder || ''} onChange={(e) => handleFieldChange('inputPlaceholder' as any, e.target.value)} /></div>,
      formActionUrl: <div className="space-y-1.5" key="formUrl"><Label>Form Hedef URL (*)</Label><Input value={(currentFormData as any).formActionUrl || ''} onChange={(e) => handleFieldChange('formActionUrl' as any, e.target.value)} required /></div>,
      mediaType: <div className="space-y-1.5" key="mediaType"><Label>Medya Tipi</Label><Select value={(currentFormData as any).mediaType || 'image'} onValueChange={(v) => handleFieldChange('mediaType' as any, v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="image">Resim</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent></Select></div>,
      mediaUrl: <div className="space-y-1.5" key="mediaUrl"><Label>Medya URL</Label><Input value={(currentFormData as any).mediaUrl || ''} onChange={(e) => handleFieldChange('mediaUrl' as any, e.target.value)} /></div>,
      backgroundColor: <div className="space-y-1.5" key="bgColor"><Label>Arka Plan Rengi</Label><Input value={(currentFormData as any).backgroundColor || ''} onChange={(e) => handleFieldChange('backgroundColor' as any, e.target.value)} placeholder="#FFFFFF"/></div>,
    };

    let renderedFields: JSX.Element[] = [];

    switch (type) {
      case 'centered':
        renderedFields = [fields.title, fields.subtitle, fields.backgroundImageUrl, fields.buttonText, fields.buttonUrl, fields.buttonIcon, fields.textColor, fields.overlayOpacity];
        break;
      case 'left-aligned':
        renderedFields = [fields.title, fields.subtitle, fields.backgroundImageUrl, fields.buttonText, fields.buttonUrl, fields.buttonIcon, fields.textColor, fields.overlayOpacity];
        break;
      case 'with-input':
        renderedFields = [fields.title, fields.subtitle, fields.backgroundImageUrl, fields.inputPlaceholder, fields.buttonText, fields.formActionUrl, fields.buttonIcon, fields.textColor, fields.overlayOpacity];
        break;
      case 'split':
        renderedFields = [fields.title, fields.subtitle, fields.mediaType, fields.mediaUrl, fields.backgroundColor, fields.buttonText, fields.buttonUrl, fields.buttonIcon];
        break;
      case 'title-only':
        renderedFields = [fields.title, fields.subtitle, fields.backgroundImageUrl, fields.textColor, fields.overlayOpacity];
        break;
      case 'video-background':
        renderedFields = [fields.title, fields.subtitle, fields.videoUrl, fields.buttonText, fields.buttonUrl, fields.buttonIcon, fields.textColor, fields.overlayOpacity];
        break;
      default:
        renderedFields = [fields.title, fields.subtitle];
    }
    
    return (
        <div className="space-y-4">
            {renderedFields}
            <div className="border-t pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="order">Sıralama</Label>
                    <Input id="order" type="number" value={currentFormData.order || 0} onChange={(e) => handleFieldChange('order', parseInt(e.target.value, 10) || 0)} />
                </div>
                 <div className="flex items-center space-x-2 pt-6">
                    <Switch id="isActive" checked={currentFormData.isActive} onCheckedChange={(checked) => handleFieldChange('isActive', checked)} />
                    <Label htmlFor="isActive" className="font-medium cursor-pointer">Aktif mi?</Label>
                </div>
            </div>
        </div>
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
