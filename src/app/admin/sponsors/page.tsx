
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, Edit, Trash2, Search, Award, CalendarIcon, Link as LinkIcon, Globe, MapPin, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import type { Sponsor, SponsorEntityType, CompanyUserProfile } from '@/types';
import { COUNTRIES, TURKISH_CITIES, type CountryCode, type TurkishCity } from '@/lib/locationData';
import { getAllSponsors, updateSponsor, deleteSponsor } from '@/services/sponsorsService';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const getCountryName = (code: string) => COUNTRIES.find(c => c.code === code)?.name || code;

export default function SponsorsPage() {
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
  }>({ startDate: undefined, endDate: undefined, isActive: true });

  const fetchSponsors = useCallback(async () => {
    setIsLoading(true);
    try {
      const sponsorsFromDb = await getAllSponsors();
      setSponsors(sponsorsFromDb);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      toast({ title: "Hata", description: "Sponsorlar yüklenirken bir sorun oluştu.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  useEffect(() => {
    if (editingSponsor) {
      setCurrentFormData({
        startDate: editingSponsor.startDate && isValid(parseISO(editingSponsor.startDate)) ? parseISO(editingSponsor.startDate) : undefined,
        endDate: editingSponsor.endDate && isValid(parseISO(editingSponsor.endDate)) ? parseISO(editingSponsor.endDate) : undefined,
        isActive: editingSponsor.isActive,
      });
    } else {
      setCurrentFormData({ startDate: undefined, endDate: undefined, isActive: true });
    }
  }, [editingSponsor, isEditDialogOpen]);

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSponsor) return;

    if (!currentFormData.startDate) {
        toast({ title: "Hata", description: "Başlangıç tarihi zorunludur.", variant: "destructive" });
        return;
    }
     if(currentFormData.startDate && currentFormData.endDate && currentFormData.startDate > currentFormData.endDate) {
        toast({ title: "Hata", description: "Bitiş tarihi başlangıç tarihinden önce olamaz.", variant: "destructive" });
        return;
    }

    setFormSubmitting(true);

    const sponsorData: Partial<Omit<Sponsor, 'id' | 'createdAt' | 'companyId' | 'name' | 'logoUrl' | 'linkUrl' | 'entityType' | 'entityName'>> = {
      startDate: format(currentFormData.startDate, "yyyy-MM-dd"),
      endDate: currentFormData.endDate ? format(currentFormData.endDate, "yyyy-MM-dd") : undefined,
      isActive: currentFormData.isActive,
    };

    const success = await updateSponsor(editingSponsor.id, sponsorData);
    if (success) {
      toast({ title: "Başarılı", description: "Sponsor güncellendi." });
      fetchSponsors();
    } else {
      toast({ title: "Hata", description: "Sponsor güncellenemedi.", variant: "destructive" });
    }

    setFormSubmitting(false);
    setIsEditDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    const success = await deleteSponsor(id);
    if (success) {
      toast({ title: "Başarılı", description: "Sponsor silindi.", variant: "destructive" });
      fetchSponsors();
    } else {
      toast({ title: "Hata", description: "Sponsor silinemedi.", variant: "destructive" });
    }
  };

  const filteredSponsors = sponsors.filter(sp => 
    sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sp.entityName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());

  const EntityDisplay = ({ type, name }: { type: SponsorEntityType, name: string }) => {
    const icon = type === 'country' ? <Globe className="h-4 w-4 mr-1.5 text-blue-600" /> : <MapPin className="h-4 w-4 mr-1.5 text-green-600" />;
    const displayName = type === 'country' ? getCountryName(name) : name;
    return <Badge variant="outline" className="flex items-center w-fit">{icon} {displayName}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Sponsor Yönetimi</CardTitle>
          <CardDescription>Ülke ve şehir bazlı sponsorlukları yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Sponsor veya yer ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <Link href="/admin/sponsors/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Sponsor Ekle
              </Link>
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
                  <TableHead className="w-[80px]">Logo</TableHead>
                  <TableHead className="min-w-[200px]">Sponsor Adı</TableHead>
                  <TableHead className="min-w-[180px]">Sponsor Olunan Yer</TableHead>
                  <TableHead className="w-[120px]">Başlangıç</TableHead>
                  <TableHead className="w-[120px]">Bitiş</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSponsors.length > 0 ? filteredSponsors.map((sp) => (
                  <TableRow key={sp.id} className="hover:bg-muted/50">
                    <TableCell>
                      {sp.logoUrl ? 
                        <Image src={sp.logoUrl} alt={sp.name} width={60} height={30} className="rounded object-contain" data-ai-hint="company logo" /> : 
                        <div className="w-[60px] h-[30px] bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">Logo Yok</div>
                      }
                    </TableCell>
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell><EntityDisplay type={sp.entityType} name={sp.entityName} /></TableCell>
                    <TableCell className="text-sm">{sp.startDate ? format(parseISO(sp.startDate), "dd.MM.yyyy", { locale: tr }) : '-'}</TableCell>
                    <TableCell className="text-sm">{sp.endDate ? format(parseISO(sp.endDate), "dd.MM.yyyy", { locale: tr }) : '-'}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={sp.isActive ? "default" : "outline"} className={sp.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                        {sp.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(sp)} title="Düzenle" className="hover:bg-accent">
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
                                "{sp.name}" adlı sponsoru silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(sp.id)} className="bg-destructive hover:bg-destructive/90">
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
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı sponsor bulunamadı.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) setEditingSponsor(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Sponsorluğu Düzenle</DialogTitle>
              <DialogDescription>
                 {editingSponsor ? `"${editingSponsor.name}" firmasının "${editingSponsor.entityName}" sponsorluğunun bilgilerini güncelleyin.` : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              
              <div className="space-y-1.5">
                <Label>Sponsor Firma (Değiştirilemez)</Label>
                <Input value={editingSponsor?.name || ''} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Sponsor Olunan Yer (Değiştirilemez)</Label>
                <Input value={editingSponsor?.entityType === 'country' ? getCountryName(editingSponsor.entityName) : editingSponsor?.entityName} disabled />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="spStartDate" className="font-medium">Başlangıç Tarihi (*)</Label>
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
                    <Label htmlFor="spEndDate" className="font-medium">Bitiş Tarihi (Opsiyonel)</Label>
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
                 <Switch id="spIsActive" checked={currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="spIsActive" className="font-medium cursor-pointer">Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting}>
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Değişiklikleri Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
