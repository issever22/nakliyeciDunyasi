
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Edit, Trash2, Search, Package as PackageIcon, CalendarIcon, Repeat, Truck, Home } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { tr } from 'date-fns/locale';
import type { Freight, CommercialFreight, ResidentialFreight, FreightType, CargoType, VehicleNeeded, LoadingType, CargoForm, WeightUnit, ShipmentScope, ResidentialTransportType, ResidentialPlaceType, ResidentialElevatorStatus, ResidentialFloorLevel } from '@/types';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type CountryCode, type TurkishCity } from '@/lib/locationData';
import { 
  CARGO_TYPES, 
  VEHICLES_NEEDED, 
  LOADING_TYPES, 
  CARGO_FORMS, 
  WEIGHT_UNITS,
  FREIGHT_TYPES,
  RESIDENTIAL_TRANSPORT_TYPES,
  RESIDENTIAL_PLACE_TYPES,
  RESIDENTIAL_ELEVATOR_STATUSES,
  RESIDENTIAL_FLOOR_LEVELS
} from '@/lib/constants';

const mockFreightData: Freight[] = [
  { id: 'com1', userId: 'user1', freightType: 'Ticari', companyName: 'Yılmaz Nakliyat', contactPerson: 'Ahmet Yılmaz', contactEmail: 'ahmet@yilmaznakliyat.com', mobilePhone: '05321234567', cargoType: 'Gıda', vehicleNeeded: 'Kamyon', loadingType: 'Komple', cargoForm: 'Paletli', cargoWeight: 10, cargoWeightUnit: 'Ton', description: 'Ev eşyası taşınacak, acil.', originCountry: 'TR', originCity: 'İstanbul', originDistrict: 'Esenyurt', destinationCountry: 'TR', destinationCity: 'Ankara', destinationDistrict: 'Çankaya', loadingDate: new Date(Date.now() - 1000 * 60 * 30).toISOString().split('T')[0], isContinuousLoad: false, postedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), shipmentScope: 'Yurt İçi', postedBy: 'Yılmaz Nakliyat', isActive: true },
  { id: 'res1', userId: 'userEv1', freightType: 'Evden Eve', companyName: 'Aslan Ev Taşıma', contactPerson: 'Veli Aslan', contactEmail: 'veli@aslannakliyat.com', mobilePhone: '05331112233', residentialTransportType: 'Şehirlerarası Taşımacılık', residentialPlaceType: 'Ev', residentialElevatorStatus: 'Yükleme Adresinde Var', residentialFloorLevel: '3’ncü Kat', description: '3+1 Ev eşyası, beyaz eşyalar ve mobilyalar. Paketleme dahil.', originCountry: 'TR', originCity: 'İstanbul', originDistrict: 'Kadıköy', destinationCountry: 'TR', destinationCity: 'İzmir', destinationDistrict: 'Alsancak', loadingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0], postedAt: new Date().toISOString(), postedBy: 'Aslan Ev Taşıma', isActive: true },
  { id: 'com2', userId: 'user2', freightType: 'Ticari', companyName: 'Demir Lojistik', contactPerson: 'Ayşe Demir', contactEmail: 'ayse@demirlojistik.com', mobilePhone: '05559876543', cargoType: 'Sanayi Üretimi', vehicleNeeded: '13.60 Kapalı Tır', loadingType: 'Komple', cargoForm: 'Kolili', cargoWeight: 20, cargoWeightUnit: 'Ton', description: 'Paletli yük, 20 ton.', originCountry: 'TR', originCity: 'İzmir', originDistrict: 'Bornova', destinationCountry: 'TR', destinationCity: 'Bursa', destinationDistrict: 'Osmangazi', loadingDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString().split('T')[0], isContinuousLoad: false, postedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), shipmentScope: 'Yurt İçi', postedBy: 'Demir Lojistik', isActive: false },
];

const createEmptyFormData = (type: FreightType = 'Ticari'): Partial<Freight> => {
  const base = {
    id: `new-${Date.now()}`, // Temporary ID for new items
    userId: 'admin-user', // Placeholder
    companyName: '',
    contactPerson: '',
    contactEmail: '',
    workPhone: '',
    mobilePhone: '',
    originCountry: 'TR' as CountryCode,
    originCity: '' as TurkishCity,
    originDistrict: '',
    destinationCountry: 'TR' as CountryCode,
    destinationCity: '' as TurkishCity,
    destinationDistrict: '',
    loadingDate: format(new Date(), "yyyy-MM-dd"),
    postedAt: new Date().toISOString(),
    postedBy: '',
    isActive: true,
    description: '',
  };

  if (type === 'Ticari') {
    return {
      ...base,
      freightType: 'Ticari',
      cargoType: '' as CargoType,
      vehicleNeeded: '' as VehicleNeeded,
      loadingType: '' as LoadingType,
      cargoForm: '' as CargoForm,
      cargoWeight: 0,
      cargoWeightUnit: 'Ton' as WeightUnit,
      isContinuousLoad: false,
      shipmentScope: 'Yurt İçi' as ShipmentScope,
    };
  } else { // Evden Eve
    return {
      ...base,
      freightType: 'Evden Eve',
      residentialTransportType: '' as ResidentialTransportType,
      residentialPlaceType: '' as ResidentialPlaceType,
      residentialElevatorStatus: '' as ResidentialElevatorStatus,
      residentialFloorLevel: '' as ResidentialFloorLevel,
    };
  }
};


export default function AdminListingsPage() {
  const { toast } = useToast();
  const [listings, setListings] = useState<Freight[]>(initialListings);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Freight | null>(null);
  
  const [currentFormData, setCurrentFormData] = useState<Partial<Freight>>(createEmptyFormData());
  
  const [availableOriginDistricts, setAvailableOriginDistricts] = useState<readonly string[]>([]);
  const [availableDestinationDistricts, setAvailableDestinationDistricts] = useState<readonly string[]>([]);

  useEffect(() => {
    if (editingListing) {
      const formDataToSet: Partial<Freight> = {
        ...editingListing,
        loadingDate: editingListing.loadingDate ? format(parseISO(editingListing.loadingDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      };
      setCurrentFormData(formDataToSet);
      
      // Set districts for editing listing
      if (editingListing.originCountry === 'TR' && TURKISH_CITIES.includes(editingListing.originCity as TurkishCity)) {
        setAvailableOriginDistricts(DISTRICTS_BY_CITY_TR[editingListing.originCity as TurkishCity] || []);
      } else {
        setAvailableOriginDistricts([]);
      }
      if (editingListing.destinationCountry === 'TR' && TURKISH_CITIES.includes(editingListing.destinationCity as TurkishCity)) {
        setAvailableDestinationDistricts(DISTRICTS_BY_CITY_TR[editingListing.destinationCity as TurkishCity] || []);
      } else {
        setAvailableDestinationDistricts([]);
      }

    } else {
      setCurrentFormData(createEmptyFormData('Ticari')); // Default to Ticari for new
      setAvailableOriginDistricts([]);
      setAvailableDestinationDistricts([]);
    }
  }, [editingListing, isAddEditDialogOpen]);

 useEffect(() => {
    if (currentFormData.originCountry === 'TR' && TURKISH_CITIES.includes(currentFormData.originCity as TurkishCity)) {
      setAvailableOriginDistricts(DISTRICTS_BY_CITY_TR[currentFormData.originCity as TurkishCity] || []);
    } else {
      setAvailableOriginDistricts([]);
    }
    if (!availableOriginDistricts.includes(currentFormData.originDistrict || '')) {
        setCurrentFormData(prev => ({...prev, originDistrict: ''}));
    }
  }, [currentFormData.originCity, currentFormData.originCountry, availableOriginDistricts]);

  useEffect(() => {
    if (currentFormData.destinationCountry === 'TR' && TURKISH_CITIES.includes(currentFormData.destinationCity as TurkishCity)) {
      setAvailableDestinationDistricts(DISTRICTS_BY_CITY_TR[currentFormData.destinationCity as TurkishCity] || []);
    } else {
      setAvailableDestinationDistricts([]);
    }
     if (!availableDestinationDistricts.includes(currentFormData.destinationDistrict || '')) {
        setCurrentFormData(prev => ({...prev, destinationDistrict: ''}));
    }
  }, [currentFormData.destinationCity, currentFormData.destinationCountry, availableDestinationDistricts]);


  const handleAddNew = () => {
    setEditingListing(null);
    setCurrentFormData(createEmptyFormData('Ticari')); // Start with Ticari as default
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (listing: Freight) => {
    setEditingListing(listing);
    // useEffect will set currentFormData
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Basic validation (can be expanded with Zod later)
    if (!currentFormData.freightType || !currentFormData.companyName || !currentFormData.contactPerson || !currentFormData.mobilePhone || !currentFormData.originCity || !currentFormData.destinationCity || !currentFormData.loadingDate) {
      toast({ title: "Hata", description: "Lütfen tüm zorunlu alanları doldurun.", variant: "destructive" });
      return;
    }

    let finalListingData: Freight;

    if (currentFormData.freightType === 'Ticari') {
      finalListingData = {
        ...createEmptyFormData('Ticari'), // Ensures all fields are present
        ...currentFormData,
        id: editingListing ? editingListing.id : `com-${Date.now()}`,
        shipmentScope: (currentFormData.originCountry === 'TR' && currentFormData.destinationCountry === 'TR') ? 'Yurt İçi' : 'Yurt Dışı',
      } as CommercialFreight;
    } else { // Evden Eve
      finalListingData = {
        ...createEmptyFormData('Evden Eve'), // Ensures all fields are present
        ...currentFormData,
        id: editingListing ? editingListing.id : `res-${Date.now()}`,
      } as ResidentialFreight;
    }
    finalListingData.postedAt = editingListing ? editingListing.postedAt : new Date().toISOString();


    if (editingListing) {
      setListings(listings.map(l => l.id === editingListing.id ? finalListingData : l));
      toast({ title: "Başarılı", description: "İlan güncellendi." });
    } else {
      setListings([finalListingData, ...listings]);
      toast({ title: "Başarılı", description: "Yeni ilan eklendi." });
    }
    setIsAddEditDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setListings(listings.filter(l => l.id !== id));
    toast({ title: "Başarılı", description: "İlan silindi.", variant: "destructive" });
  };

  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        listing.id.toLowerCase().includes(searchTermLower) ||
        listing.companyName.toLowerCase().includes(searchTermLower) ||
        listing.freightType.toLowerCase().includes(searchTermLower) ||
        (listing.originCity as string).toLowerCase().includes(searchTermLower) ||
        (listing.destinationCity as string).toLowerCase().includes(searchTermLower)
      );
    }).sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
  }, [listings, searchTerm]);

  const renderCityInput = (country: CountryCode | string | undefined, city: string | TurkishCity | undefined, setCity: (city: string | TurkishCity) => void, type: 'origin' | 'destination') => {
    if (country === 'TR') {
      return (
        <Select value={city as TurkishCity || ''} onValueChange={(value) => setCity(value as TurkishCity)}>
          <SelectTrigger id={`com-${type}CityTR`}><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
          <SelectContent>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return <Input id={`com-${type}CityOther`} placeholder="Şehir (Elle Giriş)" value={city as string || ''} onChange={(e) => setCity(e.target.value)} />;
  };

  const renderDistrictInput = (country: CountryCode | string | undefined, city: string | TurkishCity | undefined, district: string | undefined, setDistrict: (district: string) => void, availableDistricts: readonly string[], type: 'origin' | 'destination') => {
    if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity)) {
        const districtsForCity = DISTRICTS_BY_CITY_TR[city as TurkishCity] || [];
        if (districtsForCity.length > 0) {
             return (
                <Select value={district || ''} onValueChange={(value) => setDistrict(value)}>
                <SelectTrigger id={`com-${type}DistrictTR`}><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                <SelectContent>{districtsForCity.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
            );
        }
        return <Input id={`com-${type}DistrictOtherTR`} placeholder="İlçe (Elle Giriş)" value={district || ''} onChange={(e) => setDistrict(e.target.value)} />;
    }
    return null;
  };
  
  const handleFreightTypeChange = (newType: FreightType) => {
    setCurrentFormData(prev => ({
      ...createEmptyFormData(newType), // Reset to defaults for the new type
      // Preserve common fields if they were already entered
      companyName: prev.companyName,
      contactPerson: prev.contactPerson,
      contactEmail: prev.contactEmail,
      workPhone: prev.workPhone,
      mobilePhone: prev.mobilePhone,
      isActive: prev.isActive,
      description: prev.description,
      // Keep location if they are generic enough, or reset them too
      originCountry: prev.originCountry,
      originCity: prev.originCity,
      destinationCountry: prev.destinationCountry,
      destinationCity: prev.destinationCity,
      loadingDate: prev.loadingDate,
      freightType: newType, // Ensure the new type is set
    }));
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><PackageIcon className="h-6 w-6 text-primary" /> İlan Yönetimi</CardTitle>
          <CardDescription>Mevcut yük ilanlarını yönetin, yenilerini ekleyin veya düzenleyin.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="İlan ara (ID, Firma, Tip)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni İlan Ekle
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">İlan ID</TableHead>
                  <TableHead className="w-[120px]">İlan Tipi</TableHead>
                  <TableHead className="min-w-[180px]">İlan Veren</TableHead>
                  <TableHead className="min-w-[200px]">Güzergah</TableHead>
                  <TableHead className="w-[130px]">Yükleme Tarihi</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.length > 0 ? filteredListings.map((listing) => (
                  <TableRow key={listing.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{listing.id}</TableCell>
                    <TableCell>
                      <Badge variant={listing.freightType === 'Ticari' ? 'default' : 'secondary'} className="text-xs">
                        {listing.freightType === 'Ticari' ? <Truck size={14} className="mr-1.5"/> : <Home size={14} className="mr-1.5"/>}
                        {listing.freightType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{listing.companyName}</TableCell>
                    <TableCell className="text-sm">{listing.originCity as string} &rarr; {listing.destinationCity as string}</TableCell>
                    <TableCell className="text-sm">{format(parseISO(listing.loadingDate), "dd.MM.yyyy", { locale: tr })}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={listing.isActive ? "default" : "outline"} className={listing.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-red-500/10 text-red-700 border-red-400"}>
                        {listing.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(listing)} title="Düzenle" className="hover:bg-accent">
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
                                "{listing.id}" ID'li ilanı silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(listing.id)} className="bg-destructive hover:bg-destructive/90">
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
                      {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Kayıtlı ilan bulunamadı.'}
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
          if (!isOpen) setEditingListing(null); // Reset editing state when dialog closes
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingListing ? 'İlanı Düzenle' : 'Yeni İlan Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingListing ? `"${editingListing.id}" ID'li ilanın bilgilerini güncelleyin.` : 'Yeni bir ilan için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-6">
              <div className="space-y-1.5">
                <Label htmlFor="listingFreightType">İlan Tipi (*)</Label>
                <Select 
                    value={currentFormData.freightType || 'Ticari'} 
                    onValueChange={(value) => handleFreightTypeChange(value as FreightType)}
                    disabled={!!editingListing} // Disable if editing
                >
                  <SelectTrigger id="listingFreightType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREIGHT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Genel Bilgiler */}
              <Card>
                <CardHeader><CardTitle className="text-base">Genel İlan Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                        <Label htmlFor="listingCompanyName">Firma Adı (*)</Label>
                        <Input id="listingCompanyName" value={currentFormData.companyName || ''} onChange={(e) => setCurrentFormData({...currentFormData, companyName: e.target.value, postedBy: e.target.value})} required />
                        </div>
                        <div className="space-y-1.5">
                        <Label htmlFor="listingContactPerson">Yetkili Kişi (*)</Label>
                        <Input id="listingContactPerson" value={currentFormData.contactPerson || ''} onChange={(e) => setCurrentFormData({...currentFormData, contactPerson: e.target.value})} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                        <Label htmlFor="listingContactEmail">E-Posta</Label>
                        <Input id="listingContactEmail" type="email" value={currentFormData.contactEmail || ''} onChange={(e) => setCurrentFormData({...currentFormData, contactEmail: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                        <Label htmlFor="listingWorkPhone">İş Telefonu</Label>
                        <Input id="listingWorkPhone" value={currentFormData.workPhone || ''} onChange={(e) => setCurrentFormData({...currentFormData, workPhone: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                        <Label htmlFor="listingMobilePhone">Cep Telefonu (*)</Label>
                        <Input id="listingMobilePhone" value={currentFormData.mobilePhone || ''} onChange={(e) => setCurrentFormData({...currentFormData, mobilePhone: e.target.value})} required />
                        </div>
                    </div>
                </CardContent>
              </Card>

              {/* İlan Tipine Özel Alanlar */}
              {currentFormData.freightType === 'Ticari' && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Ticari Yük Detayları</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                            <Label htmlFor="listingCargoType">Yük Cinsi (*)</Label>
                            <Select value={(currentFormData as CommercialFreight).cargoType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, cargoType: v as CargoType})}>
                                <SelectTrigger id="listingCargoType"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{CARGO_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                            <div className="space-y-1.5">
                            <Label htmlFor="listingVehicleNeeded">Aranılan Araç (*)</Label>
                             <Select value={(currentFormData as CommercialFreight).vehicleNeeded || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, vehicleNeeded: v as VehicleNeeded})}>
                                <SelectTrigger id="listingVehicleNeeded"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{VEHICLES_NEEDED.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                            <Label htmlFor="listingLoadingType">Yükleniş Şekli (*)</Label>
                            <Select value={(currentFormData as CommercialFreight).loadingType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, loadingType: v as LoadingType})}>
                                <SelectTrigger id="listingLoadingType"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{LOADING_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                            <div className="space-y-1.5">
                            <Label htmlFor="listingCargoForm">Yükün Biçimi (*)</Label>
                             <Select value={(currentFormData as CommercialFreight).cargoForm || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, cargoForm: v as CargoForm})}>
                                <SelectTrigger id="listingCargoForm"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{CARGO_FORMS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                            <div className="space-y-1.5">
                            <Label htmlFor="listingCargoWeight">Yük Miktarı/Tonajı (*)</Label>
                            <div className="flex gap-2">
                                <Input id="listingCargoWeight" type="number" value={(currentFormData as CommercialFreight).cargoWeight || ''} onChange={(e) => setCurrentFormData({...currentFormData, cargoWeight: parseFloat(e.target.value) || 0})} required />
                                <Select value={(currentFormData as CommercialFreight).cargoWeightUnit || 'Ton'} onValueChange={(v) => setCurrentFormData({...currentFormData, cargoWeightUnit: v as WeightUnit})}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{WEIGHT_UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            </div>
                        </div>
                         <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="listingIsContinuousLoad" checked={(currentFormData as CommercialFreight).isContinuousLoad || false} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isContinuousLoad: Boolean(checked)})} />
                            <Label htmlFor="listingIsContinuousLoad" className="text-sm font-medium">Sürekli (Proje) Yük</Label>
                        </div>
                    </CardContent>
                </Card>
              )}

              {currentFormData.freightType === 'Evden Eve' && (
                 <Card>
                    <CardHeader><CardTitle className="text-base">Evden Eve Nakliyat Detayları</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="listingResidentialTransportType">Taşımacılık Türü (*)</Label>
                                <Select value={(currentFormData as ResidentialFreight).residentialTransportType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, residentialTransportType: v as ResidentialTransportType})}>
                                <SelectTrigger id="listingResidentialTransportType"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{RESIDENTIAL_TRANSPORT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="listingResidentialPlaceType">Nakliyesi Yapılacak Yer (*)</Label>
                                <Select value={(currentFormData as ResidentialFreight).residentialPlaceType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, residentialPlaceType: v as ResidentialPlaceType})}>
                                <SelectTrigger id="listingResidentialPlaceType"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{RESIDENTIAL_PLACE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="listingResidentialElevatorStatus">Asansör Durumu (*)</Label>
                                <Select value={(currentFormData as ResidentialFreight).residentialElevatorStatus || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, residentialElevatorStatus: v as ResidentialElevatorStatus})}>
                                <SelectTrigger id="listingResidentialElevatorStatus"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{RESIDENTIAL_ELEVATOR_STATUSES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="listingResidentialFloorLevel">Eşyanın Bulunduğu Kat (*)</Label>
                                <Select value={(currentFormData as ResidentialFreight).residentialFloorLevel || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, residentialFloorLevel: v as ResidentialFloorLevel})}>
                                <SelectTrigger id="listingResidentialFloorLevel"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{RESIDENTIAL_FLOOR_LEVELS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              )}
              
              {/* Konum ve Tarih Bilgileri */}
               <Card>
                <CardHeader><CardTitle className="text-base">Konum ve Tarih Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                        <h4 className="font-medium">Yükleneceği Yer (*)</h4>
                        <div className="space-y-1.5">
                            <Label htmlFor="listingOriginCountry">Ülke</Label>
                            <Select value={currentFormData.originCountry || 'TR'} onValueChange={(v) => setCurrentFormData({...currentFormData, originCountry: v as CountryCode, originCity: '', originDistrict: ''})}>
                            <SelectTrigger id="listingOriginCountry"><SelectValue /></SelectTrigger>
                            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="listingOriginCity">Şehir</Label>
                            {renderCityInput(currentFormData.originCountry, currentFormData.originCity, (cityVal: TurkishCity | string) => setCurrentFormData({...currentFormData, originCity: cityVal, originDistrict: ''}), 'origin')}
                        </div>
                        {currentFormData.originCountry === 'TR' && (
                            <div className="space-y-1.5">
                            <Label htmlFor="listingOriginDistrict">İlçe</Label>
                            {renderDistrictInput(currentFormData.originCountry, currentFormData.originCity, currentFormData.originDistrict, (districtVal: string) => setCurrentFormData({...currentFormData, originDistrict: districtVal}), availableOriginDistricts, 'origin')}
                            </div>
                        )}
                        </div>
                        <div className="space-y-3">
                        <h4 className="font-medium">İstikamet (Varış Yeri) (*)</h4>
                        <div className="space-y-1.5">
                            <Label htmlFor="listingDestinationCountry">Ülke</Label>
                            <Select value={currentFormData.destinationCountry || 'TR'} onValueChange={(v) => setCurrentFormData({...currentFormData, destinationCountry: v as CountryCode, destinationCity: '', destinationDistrict: ''})}>
                            <SelectTrigger id="listingDestinationCountry"><SelectValue /></SelectTrigger>
                            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="listingDestinationCity">Şehir</Label>
                            {renderCityInput(currentFormData.destinationCountry, currentFormData.destinationCity, (cityVal: TurkishCity | string) => setCurrentFormData({...currentFormData, destinationCity: cityVal, destinationDistrict: ''}), 'destination')}
                        </div>
                        {currentFormData.destinationCountry === 'TR' && (
                            <div className="space-y-1.5">
                            <Label htmlFor="listingDestinationDistrict">İlçe</Label>
                            {renderDistrictInput(currentFormData.destinationCountry, currentFormData.destinationCity, currentFormData.destinationDistrict, (districtVal: string) => setCurrentFormData({...currentFormData, destinationDistrict: districtVal}), availableDestinationDistricts, 'destination')}
                            </div>
                        )}
                        </div>
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="listingLoadingDate">Yükleme Tarihi (*)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!currentFormData.loadingDate && "text-muted-foreground"}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentFormData.loadingDate ? format(parseISO(currentFormData.loadingDate), "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={currentFormData.loadingDate ? parseISO(currentFormData.loadingDate) : undefined} onSelect={(date) => setCurrentFormData({...currentFormData, loadingDate: date ? format(date, "yyyy-MM-dd") : undefined})} initialFocus locale={tr} />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
               </Card>

              <div className="space-y-1.5">
                <Label htmlFor="listingDescription">Açıklama (*)</Label>
                <Textarea id="listingDescription" value={currentFormData.description || ''} onChange={(e) => setCurrentFormData({...currentFormData, description: e.target.value})} required rows={4}/>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="listingIsActive" checked={currentFormData.isActive === undefined ? true : currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="listingIsActive" className="font-medium cursor-pointer">İlan Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90">{editingListing ? 'Değişiklikleri Kaydet' : 'İlanı Ekle'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const initialListings: Freight[] = mockFreightData.map((listing, index) => ({
  ...listing,
  id: listing.id || `listing-${index}-${Date.now()}`, // Ensure unique ID
  isActive: listing.isActive === undefined ? true : listing.isActive, // Default to active
}));

