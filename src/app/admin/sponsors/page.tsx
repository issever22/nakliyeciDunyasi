
"use client";

import { useState, useEffect, type FormEvent } from 'react';
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
import { PlusCircle, Edit, Trash2, Search, Award, CalendarIcon, Link as LinkIcon, Globe, MapPin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns"; // Removed parseISO as it's not needed for direct Date obj
import { tr } from 'date-fns/locale';
import type { Sponsor, SponsorEntityType } from '@/types';
import { COUNTRIES, TURKISH_CITIES, type CountryCode, type TurkishCity } from '@/lib/locationData';

const getCountryName = (code: string) => COUNTRIES.find(c => c.code === code)?.name || code;

const initialSponsors: Sponsor[] = [
  { id: 'sp1', name: 'NakliyatDev Inc.', logoUrl: 'https://placehold.co/100x50.png?text=NDev', linkUrl: 'https://nakliyatdev.com', entityType: 'country', entityName: 'TR', startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31), isActive: true, createdAt: new Date(2023, 11, 15) },
  { id: 'sp2', name: 'Ankara Lojistik A.Ş.', logoUrl: 'https://placehold.co/100x50.png?text=AnkaraLoj', entityType: 'city', entityName: 'Ankara', startDate: new Date(2024, 2, 1), isActive: true, createdAt: new Date(2024, 1, 20) },
  { id: 'sp3', name: 'Global Trans Co.', entityType: 'country', entityName: 'DE', startDate: new Date(2025, 0, 1), isActive: false, createdAt: new Date(2024, 5, 1) },
];

export default function SponsorsPage() {
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<{
    name: string;
    logoUrl: string;
    linkUrl: string;
    entityType: SponsorEntityType;
    selectedCountry: CountryCode | string;
    selectedCity: TurkishCity | string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
  }>({ name: '', logoUrl: '', linkUrl: '', entityType: 'country', selectedCountry: 'TR', selectedCity: '', startDate: undefined, endDate: undefined, isActive: true });

  useEffect(() => {
    if (editingSponsor) {
      setCurrentFormData({
        name: editingSponsor.name,
        logoUrl: editingSponsor.logoUrl || '',
        linkUrl: editingSponsor.linkUrl || '',
        entityType: editingSponsor.entityType,
        selectedCountry: editingSponsor.entityType === 'country' ? editingSponsor.entityName as CountryCode : 'TR',
        selectedCity: editingSponsor.entityType === 'city' ? editingSponsor.entityName as TurkishCity : '',
        startDate: editingSponsor.startDate, // Directly use Date object or undefined
        endDate: editingSponsor.endDate,     // Directly use Date object or undefined
        isActive: editingSponsor.isActive,
      });
    } else {
      setCurrentFormData({ name: '', logoUrl: '', linkUrl: '', entityType: 'country', selectedCountry: 'TR', selectedCity: '', startDate: undefined, endDate: undefined, isActive: true });
    }
  }, [editingSponsor, isAddEditDialogOpen]);

  const handleAddNew = () => {
    setEditingSponsor(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentFormData.name.trim()) {
        toast({ title: "Hata", description: "Sponsor adı boş bırakılamaz.", variant: "destructive" });
        return;
    }
    if (!currentFormData.startDate) {
        toast({ title: "Hata", description: "Başlangıç tarihi zorunludur.", variant: "destructive" });
        return;
    }
     if(currentFormData.startDate && currentFormData.endDate && currentFormData.startDate > currentFormData.endDate) {
        toast({ title: "Hata", description: "Bitiş tarihi başlangıç tarihinden önce olamaz.", variant: "destructive" });
        return;
    }
    if (currentFormData.entityType === 'country' && !currentFormData.selectedCountry) {
        toast({ title: "Hata", description: "Lütfen sponsor olunacak ülkeyi seçin.", variant: "destructive" });
        return;
    }
    if (currentFormData.entityType === 'city' && !currentFormData.selectedCity) {
        toast({ title: "Hata", description: "Lütfen sponsor olunacak şehri seçin.", variant: "destructive" });
        return;
    }

    const entityName = currentFormData.entityType === 'country' ? currentFormData.selectedCountry : currentFormData.selectedCity;

    const sponsorData = {
      name: currentFormData.name,
      logoUrl: currentFormData.logoUrl || undefined,
      linkUrl: currentFormData.linkUrl || undefined,
      entityType: currentFormData.entityType,
      entityName: entityName,
      startDate: currentFormData.startDate!, // startDate is now definitely a Date object or form validation would fail
      endDate: currentFormData.endDate,       // endDate is Date object or undefined
      isActive: currentFormData.isActive,
      createdAt: editingSponsor ? editingSponsor.createdAt : new Date(),
    };

    if (editingSponsor) {
      setSponsors(sponsors.map(sp => sp.id === editingSponsor.id ? { ...editingSponsor, ...sponsorData } : sp));
      toast({ title: "Başarılı", description: "Sponsor güncellendi." });
    } else {
      const newSponsor: Sponsor = { 
        id: `sp${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, 
        ...sponsorData 
      };
      setSponsors([newSponsor, ...sponsors]);
      toast({ title: "Başarılı", description: "Yeni sponsor eklendi." });
    }
    setIsAddEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setSponsors(sponsors.filter(sp => sp.id !== id));
    toast({ title: "Başarılı", description: "Sponsor silindi.", variant: "destructive" });
  };

  const filteredSponsors = sponsors.filter(sp => 
    sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sp.entityName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Sponsor Ekle
            </Button>
          </div>

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
                    <TableCell className="text-sm">{format(sp.startDate, "dd.MM.yyyy", { locale: tr })}</TableCell>
                    <TableCell className="text-sm">{sp.endDate ? format(sp.endDate, "dd.MM.yyyy", { locale: tr }) : '-'}</TableCell>
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
        </CardContent>
      </Card>

      <Dialog open={isAddEditDialogOpen} onOpenChange={(isOpen) => {
          setIsAddEditDialogOpen(isOpen);
          if (!isOpen) setEditingSponsor(null);
      }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingSponsor ? 'Sponsoru Düzenle' : 'Yeni Sponsor Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingSponsor ? `"${editingSponsor.name}" sponsorunun bilgilerini güncelleyin.` : 'Yeni bir sponsor için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="spName" className="font-medium">Sponsor Adı/Şirketi (*)</Label>
                <Input id="spName" value={currentFormData.name} onChange={(e) => setCurrentFormData({...currentFormData, name: e.target.value})} placeholder="Sponsor firma adı" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="spLogoUrl" className="font-medium">Logo URL</Label>
                    <Input id="spLogoUrl" value={currentFormData.logoUrl} onChange={(e) => setCurrentFormData({...currentFormData, logoUrl: e.target.value})} placeholder="https://.../logo.png" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="spLinkUrl" className="font-medium">Link URL</Label>
                    <Input id="spLinkUrl" value={currentFormData.linkUrl} onChange={(e) => setCurrentFormData({...currentFormData, linkUrl: e.target.value})} placeholder="https://sponsor.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Sponsor Olunan Varlık Tipi (*)</Label>
                <RadioGroup 
                    value={currentFormData.entityType} 
                    onValueChange={(value: SponsorEntityType) => setCurrentFormData({...currentFormData, entityType: value})} 
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="country" id="spEntityTypeCountry" />
                        <Label htmlFor="spEntityTypeCountry">Ülke</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="city" id="spEntityTypeCity" />
                        <Label htmlFor="spEntityTypeCity">Şehir</Label>
                    </div>
                </RadioGroup>
              </div>

              {currentFormData.entityType === 'country' && (
                <div className="space-y-1.5">
                    <Label htmlFor="spCountry" className="font-medium">Sponsor Olunan Ülke (*)</Label>
                    <Select value={currentFormData.selectedCountry} onValueChange={(value: CountryCode | string) => setCurrentFormData({...currentFormData, selectedCountry: value})}>
                    <SelectTrigger id="spCountry"><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                    <SelectContent>
                        {COUNTRIES.filter(c => c.code !== 'OTHER').map(country => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
              )}

              {currentFormData.entityType === 'city' && (
                <div className="space-y-1.5">
                    <Label htmlFor="spCity" className="font-medium">Sponsor Olunan Şehir (*)</Label>
                    <Select value={currentFormData.selectedCity} onValueChange={(value: TurkishCity | string) => setCurrentFormData({...currentFormData, selectedCity: value})}>
                    <SelectTrigger id="spCity"><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
                    <SelectContent>
                        {TURKISH_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
              )}
            
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
                        <Calendar mode="single" selected={currentFormData.startDate} onSelect={(date) => setCurrentFormData({...currentFormData, startDate: date})} initialFocus locale={tr} />
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
                        <Calendar mode="single" selected={currentFormData.endDate} onSelect={(date) => setCurrentFormData({...currentFormData, endDate: date})} initialFocus locale={tr} />
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
                    <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editingSponsor ? 'Değişiklikleri Kaydet' : 'Sponsor Ekle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


    