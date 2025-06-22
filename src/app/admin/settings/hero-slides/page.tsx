
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
import { Separator } from '@/components/ui/separator';

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

    const handleFieldChange = (field: keyof HeroSlide, value: any) => {
      setCurrentFormData(p => ({ ...p, [field]: value }));
    };
    const handleNumericFieldChange = (field: keyof HeroSlide, value: string) => {
        setCurrentFormData(p => ({ ...p, [field]: value ? parseFloat(value) : undefined }));
    };

    const commonContentFields = (
        <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Genel İçerik</h4>
            <div className="space-y-1.5"><Label htmlFor="slideTitle">Başlık (*)</Label><Input id="slideTitle" value={currentFormData.title || ''} onChange={(e) => handleFieldChange('title', e.target.value)} required /></div>
            <div className="space-y-1.5"><Label>Alt Başlık</Label><Textarea value={currentFormData.subtitle || ''} onChange={(e) => handleFieldChange('subtitle', e.target.value)} rows={2} /></div>
            <div className="space-y-1.5"><Label>Yazı Rengi (örn: #FFFFFF)</Label><Input placeholder="#FFFFFF" value={(currentFormData as any).textColor || ''} onChange={(e) => handleFieldChange('textColor', e.target.value)} /></div>
        </div>
    );

    const buttonFields = (
        <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Buton Ayarları</h4>
            <div className="space-y-1.5"><Label>Buton Yazısı</Label><Input value={(currentFormData as any).buttonText || ''} onChange={(e) => handleFieldChange('buttonText', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Buton URL</Label><Input value={(currentFormData as any).buttonUrl || ''} onChange={(e) => handleFieldChange('buttonUrl', e.target.value)} /></div>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="slideButtonIcon">Buton İkonu (Lucide)</Label>
                    <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">İkonları Gör</a>
                </div>
                <Input id="slideButtonIcon" value={(currentFormData as any).buttonIcon || ''} onChange={(e) => handleFieldChange('buttonIcon', e.target.value)} placeholder="örn: ArrowRight" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Buton Arka Plan Rengi</Label><Input value={(currentFormData as any).buttonColor || ''} onChange={(e) => handleFieldChange('buttonColor', e.target.value)} placeholder="örn: #e11d48" /></div>
                <div className="space-y-1.5"><Label>Buton Yazı & İkon Rengi</Label><Input value={(currentFormData as any).buttonTextColor || ''} onChange={(e) => handleFieldChange('buttonTextColor', e.target.value)} placeholder="#FFFFFF" /></div>
            </div>
            <div className="space-y-1.5"><Label>Buton Şekli</Label><Select value={(currentFormData as any).buttonShape || 'default'} onValueChange={(v) => handleFieldChange('buttonShape', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">Varsayılan (Köşeli)</SelectItem><SelectItem value="rounded">Tam Yuvarlak</SelectItem></SelectContent></Select></div>
        </div>
    );

    const backgroundFields = (
        <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Arka Plan Ayarları</h4>
             {type === 'video-background'
                ? <div className="space-y-1.5"><Label>Video URL</Label><Input value={(currentFormData as any).videoUrl || ''} onChange={(e) => handleFieldChange('videoUrl', e.target.value)} /></div>
                : <div className="space-y-1.5"><Label>Arka Plan Resim URL'si</Label><Input value={(currentFormData as any).backgroundImageUrl || ''} onChange={(e) => handleFieldChange('backgroundImageUrl', e.target.value)} /></div>
            }
            <div className="space-y-1.5"><Label>Karartma Opaklığı (0-1)</Label><Input type="number" step="0.1" min="0" max="1" placeholder="0.5" value={(currentFormData as any).overlayOpacity ?? ''} onChange={(e) => handleNumericFieldChange('overlayOpacity', e.target.value)} /></div>
        </div>
    );

    const splitMediaFields = (
        <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Medya Paneli (Sağ Taraf)</h4>
            <div className="space-y-1.5"><Label>Medya Tipi</Label><Select value={(currentFormData as any).mediaType || 'image'} onValueChange={(v) => handleFieldChange('mediaType', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="image">Resim</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Medya URL</Label><Input value={(currentFormData as any).mediaUrl || ''} onChange={(e) => handleFieldChange('mediaUrl', e.target.value)} /></div>
        </div>
    );

    const splitContentFields = (
        <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">İçerik Paneli (Sol Taraf)</h4>
            <div className="space-y-1.5"><Label>Arka Plan Rengi (Resim yoksa)</Label><Input value={(currentFormData as any).backgroundColor || ''} onChange={(e) => handleFieldChange('backgroundColor', e.target.value)} placeholder="#FFFFFF"/></div>
            <div className="space-y-1.5"><Label>Arka Plan Resmi (Opsiyonel)</Label><Input value={(currentFormData as any).backgroundImageUrl || ''} onChange={(e) => handleFieldChange('backgroundImageUrl', e.target.value)} placeholder="https://.../image.jpg"/></div>
            <div className="space-y-1.5"><Label>Karartma Opaklığı (Resim varsa)</Label><Input type="number" step="0.1" min="0" max="1" placeholder="0.3" value={(currentFormData as any).overlayOpacity ?? ''} onChange={(e) => handleNumericFieldChange('overlayOpacity', e.target.value)} /></div>
        </div>
    );

    let renderedFields: JSX.Element[] = [];
    
    switch (type) {
      case 'centered':
      case 'left-aligned':
        renderedFields = [commonContentFields, <Separator key="sep1"/>, backgroundFields, <Separator key="sep2"/>, buttonFields];
        break;
      case 'with-input':
        renderedFields = [commonContentFields, <Separator key="sep1"/>, backgroundFields, <Separator key="sep2"/>, 
            <div key="form-fields" className="space-y-4">
                <h4 className="font-medium text-muted-foreground">Form Ayarları</h4>
                <div className="space-y-1.5"><Label>Form Alanı İpucu</Label><Input value={(currentFormData as any).inputPlaceholder || ''} onChange={(e) => handleFieldChange('inputPlaceholder', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Form Buton Metni (*)</Label><Input value={(currentFormData as any).buttonText || ''} onChange={(e) => handleFieldChange('buttonText', e.target.value)} required /></div>
                <div className="space-y-1.5"><Label>Form Buton İkonu (Lucide)</Label><Input value={(currentFormData as any).buttonIcon || ''} onChange={(e) => handleFieldChange('buttonIcon', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Form Hedef URL (*)</Label><Input value={(currentFormData as any).formActionUrl || ''} onChange={(e) => handleFieldChange('formActionUrl', e.target.value)} required /></div>
            </div>,
             <Separator key="sep3"/>,
             <div key="form-button-style" className="space-y-4">
                 <h4 className="font-medium text-muted-foreground">Form Buton Stili</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Buton Arka Plan Rengi</Label><Input value={(currentFormData as any).buttonColor || ''} onChange={(e) => handleFieldChange('buttonColor', e.target.value)} placeholder="örn: #e11d48" /></div>
                    <div className="space-y-1.5"><Label>Buton Yazı & İkon Rengi</Label><Input value={(currentFormData as any).buttonTextColor || ''} onChange={(e) => handleFieldChange('buttonTextColor', e.target.value)} placeholder="#FFFFFF" /></div>
                 </div>
                <div className="space-y-1.5"><Label>Buton Şekli</Label><Select value={(currentFormData as any).buttonShape || 'default'} onValueChange={(v) => handleFieldChange('buttonShape', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">Varsayılan (Köşeli)</SelectItem><SelectItem value="rounded">Tam Yuvarlak</SelectItem></SelectContent></Select></div>
             </div>
        ];
        break;
      case 'split':
        renderedFields = [commonContentFields, <Separator key="sep1"/>, splitContentFields, <Separator key="sep2"/>, splitMediaFields, <Separator key="sep3"/>, buttonFields];
        break;
      case 'title-only':
        renderedFields = [commonContentFields, <Separator key="sep1"/>, backgroundFields];
        break;
      case 'video-background':
        renderedFields = [commonContentFields, <Separator key="sep1"/>, backgroundFields, <Separator key="sep2"/>, buttonFields];
        break;
      default:
        renderedFields = [commonContentFields];
    }
    
    return (
        <div className="space-y-6">
            {renderedFields}
            <Separator />
            <div className="space-y-4">
                <h4 className="font-medium text-muted-foreground">Genel Ayarlar</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSlide ? 'Slaytı Düzenle' : 'Yeni Slayt Ekle'}</DialogTitle>
              <DialogDescription>{editingSlide ? `"${editingSlide.title}" slaytını güncelleyin.` : 'Yeni bir slayt için gerekli bilgileri girin.'}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
                <div className="space-y-1.5">
                    <Label htmlFor="slideType">Slayt Tipi (*)</Label>
                    <Select value={currentFormData.type} onValueChange={(value) => setCurrentFormData(p => ({ ...createEmptyFormData(), title: p.title, subtitle: p.subtitle, order: p.order, isActive: p.isActive, type: value as HeroSlideType }))} required>
                        <SelectTrigger id="slideType"><SelectValue/></SelectTrigger>
                        <SelectContent>{SLIDE_TYPES.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <Separator />
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
