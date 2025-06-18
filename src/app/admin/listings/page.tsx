
"use client";

import { useState, useEffect, type FormEvent, useMemo, useCallback } from 'react';
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
import { PlusCircle, Edit, Trash2, Search, Package as PackageIcon, CalendarIcon, Repeat, Truck, Home, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import type { Freight, CommercialFreight, ResidentialFreight, EmptyVehicleListing, FreightType, CargoType as CargoTypeName, VehicleNeeded as VehicleNeededName, LoadingType, CargoForm, WeightUnit, ShipmentScope, ResidentialTransportType, ResidentialPlaceType, ResidentialElevatorStatus, ResidentialFloorLevel, FreightCreationData, FreightUpdateData, VehicleTypeSetting, CargoTypeSetting, TransportTypeSetting, EmptyVehicleServiceType } from '@/types'; // Added EmptyVehicleListing and ServiceType
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type CountryCode, type TurkishCity } from '@/lib/locationData';
import { 
  LOADING_TYPES, 
  CARGO_FORMS, 
  WEIGHT_UNITS,
  FREIGHT_TYPES,
  RESIDENTIAL_PLACE_TYPES,
  RESIDENTIAL_ELEVATOR_STATUSES,
  RESIDENTIAL_FLOOR_LEVELS,
  EMPTY_VEHICLE_SERVICE_TYPES // Added
} from '@/lib/constants'; 
import { getAllListingsForAdmin, addListing, updateListing, deleteListing } from '@/services/listingsService';
import { getAllVehicleTypes } from '@/services/vehicleTypesService';
import { getAllCargoTypes } from '@/services/cargoTypesService';
import { getAllTransportTypes } from '@/services/transportTypesService';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth'; 

const createEmptyFormData = (type: FreightType = 'Yük', currentUserId?: string, currentUserName?: string): Partial<Freight> => { // Changed 'Ticari' to 'Yük'
  const base = {
    userId: currentUserId || 'admin-placeholder-uid', 
    postedBy: currentUserName || 'Admin', 
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
    isActive: true,
    description: '',
  };

  if (type === 'Yük') { // Changed from 'Ticari'
    return {
      ...base,
      freightType: 'Yük', // Changed from 'Ticari'
      cargoType: '' as CargoTypeName, 
      vehicleNeeded: '' as VehicleNeededName,
      loadingType: LOADING_TYPES[0] as LoadingType, 
      cargoForm: CARGO_FORMS[0] as CargoForm, 
      cargoWeight: 0,
      cargoWeightUnit: 'Ton' as WeightUnit,
      isContinuousLoad: false,
      shipmentScope: 'Yurt İçi' as ShipmentScope,
    };
  } else if (type === 'Evden Eve') { 
    return {
      ...base,
      freightType: 'Evden Eve',
      residentialTransportType: '' as ResidentialTransportType, 
      residentialPlaceType: RESIDENTIAL_PLACE_TYPES[0] as ResidentialPlaceType,
      residentialElevatorStatus: RESIDENTIAL_ELEVATOR_STATUSES[0] as ResidentialElevatorStatus,
      residentialFloorLevel: RESIDENTIAL_FLOOR_LEVELS[0] as ResidentialFloorLevel,
    };
  } else { // Boş Araç
     return {
      ...base,
      freightType: 'Boş Araç',
      advertisedVehicleType: '',
      serviceTypeForLoad: EMPTY_VEHICLE_SERVICE_TYPES[0] as EmptyVehicleServiceType,
      vehicleStatedCapacity: 0,
      vehicleStatedCapacityUnit: 'Ton' as WeightUnit,
    };
  }
};

export default function AdminListingsPage() {
  const { toast } = useToast();
  const { user } = useAuth(); 
  const [allListings, setAllListings] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Freight | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const [currentFormData, setCurrentFormData] = useState<Partial<Freight>>(createEmptyFormData('Yük', user?.id, user?.name)); // Changed 'Ticari' to 'Yük'
  
  const [availableOriginDistricts, setAvailableOriginDistricts] = useState<readonly string[]>([]);
  const [availableDestinationDistricts, setAvailableDestinationDistricts] = useState<readonly string[]>([]);

  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<VehicleTypeSetting[]>([]);
  const [cargoTypeOptions, setCargoTypeOptions] = useState<CargoTypeSetting[]>([]);
  const [residentialTransportTypeOptions, setResidentialTransportTypeOptions] = useState<TransportTypeSetting[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const fetchFormOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const [vehicles, cargos, transportTypes] = await Promise.all([
        getAllVehicleTypes(),
        getAllCargoTypes(),
        getAllTransportTypes()
      ]);
      setVehicleTypeOptions(vehicles.filter(v => v.isActive));
      setCargoTypeOptions(cargos.filter(c => c.isActive));
      setResidentialTransportTypeOptions(
        transportTypes.filter(t => (t.applicableTo === 'Evden Eve' || t.applicableTo === 'Her İkisi de') && t.isActive)
      );
    } catch (error) {
      console.error("Error fetching form options for admin:", error);
      toast({ title: "Hata", description: "Form seçenekleri yüklenemedi.", variant: "destructive" });
    }
    setOptionsLoading(false);
  }, [toast]);


  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const listingsFromDb = await getAllListingsForAdmin();
      setAllListings(listingsFromDb);
    } catch (error) {
      console.error("Failed to fetch admin listings:", error);
      toast({ title: "Hata", description: "İlanlar yüklenirken bir sorun oluştu.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchListings();
    fetchFormOptions();
  }, [fetchListings, fetchFormOptions]);

  useEffect(() => {
    if (isAddEditDialogOpen) {
      if (editingListing) {
        const formDataToSet: Partial<Freight> = {
          ...editingListing,
          loadingDate: editingListing.loadingDate && isValid(parseISO(editingListing.loadingDate)) 
            ? format(parseISO(editingListing.loadingDate), "yyyy-MM-dd") 
            : format(new Date(), "yyyy-MM-dd"),
        };
        setCurrentFormData(formDataToSet);
      } else {
        setCurrentFormData(createEmptyFormData(currentFormData.freightType || 'Yük', user?.id, user?.name)); // Changed 'Ticari' to 'Yük'
      }
    }
  }, [editingListing, isAddEditDialogOpen, user, currentFormData.freightType]);

  // Effect to update available origin districts when origin city/country changes
  useEffect(() => {
    let newDistricts: readonly string[] = [];
    if (currentFormData.originCountry === 'TR' && currentFormData.originCity && TURKISH_CITIES.includes(currentFormData.originCity as TurkishCity)) {
      newDistricts = DISTRICTS_BY_CITY_TR[currentFormData.originCity as TurkishCity] || [];
    }
    setAvailableOriginDistricts(newDistricts);
  }, [currentFormData.originCity, currentFormData.originCountry]);

  // Effect to reset origin district if it becomes invalid after city/country change
  useEffect(() => {
    if (currentFormData.originDistrict && !availableOriginDistricts.includes(currentFormData.originDistrict)) {
      setCurrentFormData(prev => ({ ...prev, originDistrict: '' }));
    }
  }, [availableOriginDistricts, currentFormData.originDistrict]);

  // Effect to update available destination districts when destination city/country changes
  useEffect(() => {
    let newDistricts: readonly string[] = [];
    if (currentFormData.destinationCountry === 'TR' && currentFormData.destinationCity && TURKISH_CITIES.includes(currentFormData.destinationCity as TurkishCity)) {
      newDistricts = DISTRICTS_BY_CITY_TR[currentFormData.destinationCity as TurkishCity] || [];
    }
    setAvailableDestinationDistricts(newDistricts);
  }, [currentFormData.destinationCity, currentFormData.destinationCountry]);

  // Effect to reset destination district if it becomes invalid after city/country change
  useEffect(() => {
    if (currentFormData.destinationDistrict && !availableDestinationDistricts.includes(currentFormData.destinationDistrict)) {
      setCurrentFormData(prev => ({ ...prev, destinationDistrict: '' }));
    }
  }, [availableDestinationDistricts, currentFormData.destinationDistrict]);


  const handleAddNew = () => {
    setEditingListing(null);
    // Retain current dialog type or default to 'Yük'
    const currentType = currentFormData.freightType || 'Yük'; // Changed 'Ticari' to 'Yük'
    setCurrentFormData(createEmptyFormData(currentType, user?.id, user?.name)); 
    setIsAddEditDialogOpen(true);
  };

  const handleEdit = (listing: Freight) => {
    setEditingListing(listing);
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitting(true);

    if (!user) {
      toast({ title: "Yetkilendirme Hatası", description: "Bu işlemi yapmak için yetkiniz yok veya oturumunuz sonlanmış.", variant: "destructive" });
      setFormSubmitting(false);
      return;
    }
    
    const requiredFields: (keyof Freight)[] = ['freightType', 'companyName', 'contactPerson', 'mobilePhone', 'originCity', 'destinationCity', 'loadingDate', 'description'];
    if (currentFormData.freightType === 'Yük') { // Changed 'Ticari'
        requiredFields.push('cargoType', 'vehicleNeeded', 'loadingType', 'cargoForm', 'cargoWeight');
    } else if (currentFormData.freightType === 'Evden Eve') {
        requiredFields.push('residentialTransportType', 'residentialPlaceType', 'residentialElevatorStatus', 'residentialFloorLevel');
    } else if (currentFormData.freightType === 'Boş Araç') {
        requiredFields.push('advertisedVehicleType', 'serviceTypeForLoad', 'vehicleStatedCapacity');
    }


    for (const field of requiredFields) {
        let valueToCheck: any;
        // Type assertion to access specific fields
        if (currentFormData.freightType === 'Yük') {
            valueToCheck = (currentFormData as Partial<CommercialFreight>)[field as keyof CommercialFreight];
        } else if (currentFormData.freightType === 'Evden Eve') {
            valueToCheck = (currentFormData as Partial<ResidentialFreight>)[field as keyof ResidentialFreight];
        } else if (currentFormData.freightType === 'Boş Araç') {
            valueToCheck = (currentFormData as Partial<EmptyVehicleListing>)[field as keyof EmptyVehicleListing];
        } else {
            valueToCheck = (currentFormData as any)[field];
        }
        
        let isMissing = valueToCheck === undefined || valueToCheck === null || (typeof valueToCheck === 'string' && !valueToCheck.trim());
        
        if (field === 'cargoWeight' && (currentFormData as Partial<CommercialFreight>).cargoWeight === 0) isMissing = false; // 0 is a valid weight
        if (field === 'vehicleStatedCapacity' && (currentFormData as Partial<EmptyVehicleListing>).vehicleStatedCapacity === 0) isMissing = false; // 0 is a valid capacity


        if (isMissing) {
            toast({ title: "Eksik Bilgi", description: `Lütfen "${field}" alanını doldurun.`, variant: "destructive" });
            setFormSubmitting(false);
            return;
        }
    }
    
    const dataPayload = {
      ...currentFormData,
      postedBy: currentFormData.companyName, 
      loadingDate: currentFormData.loadingDate ? format(parseISO(currentFormData.loadingDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"), 
    } as FreightCreationData; 

    const { id, postedAt, userId, ...updatePayloadForService } = dataPayload;


    try {
      if (editingListing && editingListing.id) {
        const success = await updateListing(editingListing.id, updatePayloadForService as FreightUpdateData);
        if (success) {
          toast({ title: "Başarılı", description: "İlan güncellendi." });
        } else {
          throw new Error("İlan güncellenemedi.");
        }
      } else {
        const newListingId = await addListing(user.id, dataPayload);
        if (newListingId) {
          toast({ title: "Başarılı", description: "Yeni ilan eklendi." });
        } else {
          throw new Error("Yeni ilan eklenemedi.");
        }
      }
      fetchListings(); 
      setIsAddEditDialogOpen(false); 
    } catch (error: any) {
      console.error("Error submitting listing:", error);
      toast({ title: "Hata", description: error.message || "Bir sorun oluştu.", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (listingId: string) => {
    try {
      const success = await deleteListing(listingId);
      if (success) {
        toast({ title: "Başarılı", description: "İlan silindi.", variant: "destructive" });
        fetchListings(); 
      } else {
        throw new Error("İlan silinemedi.");
      }
    } catch (error: any) {
      console.error("Error deleting listing:", error);
      toast({ title: "Hata", description: error.message || "İlan silinirken bir sorun oluştu.", variant: "destructive" });
    }
  };

  const filteredListings = useMemo(() => {
    return allListings.filter(listing => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        listing.id.toLowerCase().includes(searchTermLower) ||
        (listing.companyName && listing.companyName.toLowerCase().includes(searchTermLower)) ||
        (listing.freightType && listing.freightType.toLowerCase().includes(searchTermLower)) ||
        (listing.originCity && (listing.originCity as string).toLowerCase().includes(searchTermLower)) ||
        (listing.destinationCity && (listing.destinationCity as string).toLowerCase().includes(searchTermLower))
      );
    }).sort((a, b) => (a.postedAt && b.postedAt) ? parseISO(b.postedAt).getTime() - parseISO(a.postedAt).getTime() : 0);
  }, [allListings, searchTerm]);

  const renderCityInput = (country: CountryCode | string | undefined, city: string | TurkishCity | undefined, setCity: (city: string | TurkishCity) => void, type: 'origin' | 'destination') => {
    if (country === 'TR') {
      return (
        <Select value={city as TurkishCity || ''} onValueChange={(value) => setCity(value as TurkishCity)}>
          <SelectTrigger id={`dlg-${type}CityTR`}><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
          <SelectContent>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return <Input id={`dlg-${type}CityOther`} placeholder="Şehir (Elle Giriş)" value={city as string || ''} onChange={(e) => setCity(e.target.value)} />;
  };

  const renderDistrictInput = (country: CountryCode | string | undefined, city: string | TurkishCity | undefined, district: string | undefined, setDistrict: (district: string) => void, availableDistrictsForInput: readonly string[], type: 'origin' | 'destination') => {
    if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity) && availableDistrictsForInput.length > 0) {
        return (
          <Select value={district || ''} onValueChange={(value) => setDistrict(value)}>
          <SelectTrigger id={`dlg-${type}DistrictTR`}><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
          <SelectContent>{availableDistrictsForInput.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        );
    }
    if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity) && availableDistrictsForInput.length === 0) {
      return <Input id={`dlg-${type}DistrictOtherTR`} placeholder="İlçe (Elle Giriş)" value={district || ''} onChange={(e) => setDistrict(e.target.value)} />;
    }
    return null;
  };
  
  const handleFreightTypeChangeInDialog = (newType: FreightType) => {
    setCurrentFormData(prev => ({
      ...createEmptyFormData(newType, user?.id, user?.name), 
      companyName: prev.companyName,
      contactPerson: prev.contactPerson,
      contactEmail: prev.contactEmail,
      workPhone: prev.workPhone,
      mobilePhone: prev.mobilePhone,
      isActive: prev.isActive,
      description: prev.description,
      originCountry: prev.originCountry,
      originCity: prev.originCity,
      originDistrict: prev.originDistrict,
      destinationCountry: prev.destinationCountry,
      destinationCity: prev.destinationCity,
      destinationDistrict: prev.destinationDistrict,
      loadingDate: prev.loadingDate,
      freightType: newType, 
    }));
  };

  const isLoadingCombined = isLoading || optionsLoading;

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
            <Button onClick={handleAddNew} className="w-full sm:w-auto bg-primary hover:bg-primary/90" disabled={optionsLoading}>
              {optionsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni İlan Ekle
            </Button>
          </div>
          {isLoadingCombined ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
            </div>
          ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">İlan ID</TableHead>
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
                    <TableCell className="font-mono text-xs truncate" title={listing.id}>{listing.id.substring(0,10)}...</TableCell>
                    <TableCell>
                      <Badge variant={listing.freightType === 'Yük' ? 'default' : (listing.freightType === 'Evden Eve' ? 'secondary' : 'outline')} className="text-xs"> {/* Changed 'Ticari' to 'Yük' */}
                        {listing.freightType === 'Yük' ? <Truck size={14} className="mr-1.5"/> : (listing.freightType === 'Evden Eve' ? <Home size={14} className="mr-1.5"/> : <PackageIcon size={14} className="mr-1.5"/> )} {/* Changed 'Ticari' to 'Yük' */}
                        {listing.freightType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{listing.companyName}</TableCell>
                    <TableCell className="text-sm">{listing.originCity as string} &rarr; {listing.destinationCity as string}</TableCell>
                    <TableCell className="text-sm">
                      {listing.loadingDate && isValid(parseISO(listing.loadingDate)) 
                        ? format(parseISO(listing.loadingDate), "dd.MM.yyyy", { locale: tr }) 
                        : 'Geçersiz Tarih'}
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge variant={listing.isActive ? "default" : "outline"} className={listing.isActive ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}>
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
                                "{listing.companyName}" firmasının "{listing.id.substring(0,8)}..." ID'li ilanını silmek üzeresiniz. Bu işlem geri alınamaz.
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddEditDialogOpen} onOpenChange={(isOpen) => {
          setIsAddEditDialogOpen(isOpen);
          if (!isOpen) setEditingListing(null); 
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-2xl">{editingListing ? 'İlanı Düzenle' : 'Yeni İlan Ekle'}</DialogTitle>
              <DialogDescription>
                 {editingListing ? `"${editingListing.id.substring(0,8)}..." ID'li ilanın bilgilerini güncelleyin.` : 'Yeni bir ilan için gerekli bilgileri girin.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-6 grid gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="dlg-listingFreightType">İlan Tipi (*)</Label>
                <Select 
                    value={currentFormData.freightType || 'Yük'} // Changed 'Ticari' to 'Yük'
                    onValueChange={(value) => handleFreightTypeChangeInDialog(value as FreightType)}
                    disabled={!!editingListing} 
                >
                  <SelectTrigger id="dlg-listingFreightType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREIGHT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Card className="border shadow-sm">
                <CardHeader className="bg-muted/30"><CardTitle className="text-base">Temel İlan Bilgileri</CardTitle></CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="dlg-listingCompanyName">Firma Adı / Ad Soyad (*)</Label>
                          <Input id="dlg-listingCompanyName" value={currentFormData.companyName || ''} onChange={(e) => setCurrentFormData({...currentFormData, companyName: e.target.value})} required />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="dlg-listingContactPerson">Yetkili Kişi (*)</Label>
                          <Input id="dlg-listingContactPerson" value={currentFormData.contactPerson || ''} onChange={(e) => setCurrentFormData({...currentFormData, contactPerson: e.target.value})} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="dlg-listingContactEmail">E-Posta</Label>
                          <Input id="dlg-listingContactEmail" type="email" value={currentFormData.contactEmail || ''} onChange={(e) => setCurrentFormData({...currentFormData, contactEmail: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="dlg-listingWorkPhone">İş Telefonu</Label>
                          <Input id="dlg-listingWorkPhone" value={currentFormData.workPhone || ''} onChange={(e) => setCurrentFormData({...currentFormData, workPhone: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="dlg-listingMobilePhone">Cep Telefonu (*)</Label>
                          <Input id="dlg-listingMobilePhone" value={currentFormData.mobilePhone || ''} onChange={(e) => setCurrentFormData({...currentFormData, mobilePhone: e.target.value})} required />
                        </div>
                    </div>
                </CardContent>
              </Card>

              {currentFormData.freightType === 'Yük' && ( // Changed 'Ticari'
                <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30"><CardTitle className="text-base">Yük Detayları</CardTitle></CardHeader> {/* Changed */}
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                            <Label htmlFor="dlg-listingCargoType">Yük Cinsi (*)</Label>
                            <Select value={(currentFormData as Partial<CommercialFreight>).cargoType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, cargoType: v as CargoTypeName})} required disabled={optionsLoading}>
                                <SelectTrigger id="dlg-listingCargoType"><SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Seçin..."} /></SelectTrigger>
                                <SelectContent>
                                  {cargoTypeOptions.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            </div>
                            <div className="space-y-1.5">
                            <Label htmlFor="dlg-listingVehicleNeeded">Aranılan Araç (*)</Label>
                             <Select value={(currentFormData as Partial<CommercialFreight>).vehicleNeeded || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, vehicleNeeded: v as VehicleNeededName})} required disabled={optionsLoading}>
                                <SelectTrigger id="dlg-listingVehicleNeeded"><SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Seçin..."} /></SelectTrigger>
                                <SelectContent>
                                  {vehicleTypeOptions.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                            <Label htmlFor="dlg-listingLoadingType">Yükleniş Şekli (*)</Label>
                            <Select value={(currentFormData as Partial<CommercialFreight>).loadingType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, loadingType: v as LoadingType})} required>
                                <SelectTrigger id="dlg-listingLoadingType"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{LOADING_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                            <div className="space-y-1.5">
                            <Label htmlFor="dlg-listingCargoForm">Yükün Biçimi (*)</Label>
                             <Select value={(currentFormData as Partial<CommercialFreight>).cargoForm || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, cargoForm: v as CargoForm})} required>
                                <SelectTrigger id="dlg-listingCargoForm"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{CARGO_FORMS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                            </Select>
                            </div>
                            <div className="space-y-1.5">
                            <Label htmlFor="dlg-listingCargoWeight">Yük Miktarı/Tonajı (*)</Label>
                            <div className="flex gap-2">
                                <Input id="dlg-listingCargoWeight" type="number" value={(currentFormData as Partial<CommercialFreight>).cargoWeight?.toString() || ''} onChange={(e) => setCurrentFormData({...currentFormData, cargoWeight: parseFloat(e.target.value) || 0})} required />
                                <Select value={(currentFormData as Partial<CommercialFreight>).cargoWeightUnit || 'Ton'} onValueChange={(v) => setCurrentFormData({...currentFormData, cargoWeightUnit: v as WeightUnit})}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{WEIGHT_UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            </div>
                        </div>
                         <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="dlg-listingIsContinuousLoad" checked={(currentFormData as Partial<CommercialFreight>).isContinuousLoad || false} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isContinuousLoad: Boolean(checked)})} />
                            <Label htmlFor="dlg-listingIsContinuousLoad" className="text-sm font-medium cursor-pointer">Sürekli (Proje) Yük</Label>
                        </div>
                    </CardContent>
                </Card>
              )}

              {currentFormData.freightType === 'Evden Eve' && (
                 <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30"><CardTitle className="text-base">Evden Eve Nakliyat Detayları</CardTitle></CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="dlg-listingResidentialTransportType">Taşımacılık Türü (*)</Label>
                                <Select value={(currentFormData as Partial<ResidentialFreight>).residentialTransportType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, residentialTransportType: v as ResidentialTransportType})} required disabled={optionsLoading}>
                                <SelectTrigger id="dlg-listingResidentialTransportType"><SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Seçin..."} /></SelectTrigger>
                                <SelectContent>
                                  {residentialTransportTypeOptions.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                                </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dlg-listingResidentialPlaceType">Nakliyesi Yapılacak Yer (*)</Label>
                                <Select value={(currentFormData as Partial<ResidentialFreight>).residentialPlaceType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, residentialPlaceType: v as ResidentialPlaceType})} required>
                                <SelectTrigger id="dlg-listingResidentialPlaceType"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{RESIDENTIAL_PLACE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="dlg-listingResidentialElevatorStatus">Asansör Durumu (*)</Label>
                                <Select value={(currentFormData as Partial<ResidentialFreight>).residentialElevatorStatus || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, residentialElevatorStatus: v as ResidentialElevatorStatus})} required>
                                <SelectTrigger id="dlg-listingResidentialElevatorStatus"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{RESIDENTIAL_ELEVATOR_STATUSES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dlg-listingResidentialFloorLevel">Eşyanın Bulunduğu Kat (*)</Label>
                                <Select value={(currentFormData as Partial<ResidentialFreight>).residentialFloorLevel || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, residentialFloorLevel: v as ResidentialFloorLevel})} required>
                                <SelectTrigger id="dlg-listingResidentialFloorLevel"><SelectValue placeholder="Seçin..." /></SelectTrigger>
                                <SelectContent>{RESIDENTIAL_FLOOR_LEVELS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              )}

              {currentFormData.freightType === 'Boş Araç' && (
                 <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30"><CardTitle className="text-base">Boş Araç Detayları</CardTitle></CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="dlg-advertisedVehicleType">Araç Cinsi (*)</Label>
                                <Select value={(currentFormData as Partial<EmptyVehicleListing>).advertisedVehicleType || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, advertisedVehicleType: v as string})} required disabled={optionsLoading}>
                                <SelectTrigger id="dlg-advertisedVehicleType"><SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Araç cinsi seçin..."} /></SelectTrigger>
                                <SelectContent>
                                    {vehicleTypeOptions.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                                </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dlg-serviceTypeForLoad">Taşıma Hizmet Tipi (*)</Label>
                                <Select value={(currentFormData as Partial<EmptyVehicleListing>).serviceTypeForLoad || ''} onValueChange={(v) => setCurrentFormData({...currentFormData, serviceTypeForLoad: v as EmptyVehicleServiceType})} required>
                                <SelectTrigger id="dlg-serviceTypeForLoad"><SelectValue placeholder="Hizmet tipi seçin..." /></SelectTrigger>
                                <SelectContent>{EMPTY_VEHICLE_SERVICE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="dlg-vehicleStatedCapacity">Aracın Kapasitesi (*)</Label>
                            <div className="flex gap-2">
                                <Input id="dlg-vehicleStatedCapacity" type="number" placeholder="00" value={(currentFormData as Partial<EmptyVehicleListing>).vehicleStatedCapacity?.toString() || ''} onChange={(e) => setCurrentFormData({...currentFormData, vehicleStatedCapacity: parseFloat(e.target.value) || 0})} required className="flex-grow" />
                                <Select value={(currentFormData as Partial<EmptyVehicleListing>).vehicleStatedCapacityUnit || 'Ton'} onValueChange={(v) => setCurrentFormData({...currentFormData, vehicleStatedCapacityUnit: v as WeightUnit})}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>{WEIGHT_UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              )}
              
               <Card className="border shadow-sm">
                <CardHeader className="bg-muted/30"><CardTitle className="text-base">Konum ve Tarih Bilgileri</CardTitle></CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Yükleneceği Yer (*)</h4>
                          <div className="space-y-1.5">
                              <Label htmlFor="dlg-listingOriginCountry">Ülke</Label>
                              <Select value={currentFormData.originCountry || 'TR'} onValueChange={(v) => setCurrentFormData({...currentFormData, originCountry: v as CountryCode, originCity: '', originDistrict: ''})}>
                              <SelectTrigger id="dlg-listingOriginCountry"><SelectValue /></SelectTrigger>
                              <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-1.5">
                              <Label htmlFor="dlg-listingOriginCity">Şehir (*)</Label>
                              {renderCityInput(currentFormData.originCountry, currentFormData.originCity, (cityVal: TurkishCity | string) => setCurrentFormData({...currentFormData, originCity: cityVal, originDistrict: ''}), 'origin')}
                          </div>
                          {currentFormData.originCountry === 'TR' && (
                              <div className="space-y-1.5">
                              <Label htmlFor="dlg-listingOriginDistrict">İlçe</Label>
                              {renderDistrictInput(currentFormData.originCountry, currentFormData.originCity, currentFormData.originDistrict, (districtVal: string) => setCurrentFormData({...currentFormData, originDistrict: districtVal}), availableOriginDistricts, 'origin')}
                              </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">İstikamet (Varış Yeri) (*)</h4>
                          <div className="space-y-1.5">
                              <Label htmlFor="dlg-listingDestinationCountry">Ülke</Label>
                              <Select value={currentFormData.destinationCountry || 'TR'} onValueChange={(v) => setCurrentFormData({...currentFormData, destinationCountry: v as CountryCode, destinationCity: '', destinationDistrict: ''})}>
                              <SelectTrigger id="dlg-listingDestinationCountry"><SelectValue /></SelectTrigger>
                              <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-1.5">
                              <Label htmlFor="dlg-listingDestinationCity">Şehir (*)</Label>
                              {renderCityInput(currentFormData.destinationCountry, currentFormData.destinationCity, (cityVal: TurkishCity | string) => setCurrentFormData({...currentFormData, destinationCity: cityVal, destinationDistrict: ''}), 'destination')}
                          </div>
                          {currentFormData.destinationCountry === 'TR' && (
                              <div className="space-y-1.5">
                              <Label htmlFor="dlg-listingDestinationDistrict">İlçe</Label>
                              {renderDistrictInput(currentFormData.destinationCountry, currentFormData.destinationCity, currentFormData.destinationDistrict, (districtVal: string) => setCurrentFormData({...currentFormData, destinationDistrict: districtVal}), availableDestinationDistricts, 'destination')}
                              </div>
                          )}
                        </div>
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="dlg-listingLoadingDate">Yükleme Tarihi (*)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!currentFormData.loadingDate && "text-muted-foreground"}`}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {currentFormData.loadingDate && isValid(parseISO(currentFormData.loadingDate)) 
                                  ? format(parseISO(currentFormData.loadingDate), "PPP", { locale: tr }) 
                                  : <span>Tarih seçin</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar 
                                mode="single" 
                                selected={currentFormData.loadingDate && isValid(parseISO(currentFormData.loadingDate)) ? parseISO(currentFormData.loadingDate) : undefined} 
                                onSelect={(date) => setCurrentFormData({...currentFormData, loadingDate: date ? format(date, "yyyy-MM-dd") : undefined})} 
                                initialFocus 
                                locale={tr} 
                                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                            />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
               </Card>

              <div className="space-y-1.5">
                <Label htmlFor="dlg-listingDescription">Açıklama (*)</Label>
                <Textarea id="dlg-listingDescription" value={currentFormData.description || ''} onChange={(e) => setCurrentFormData({...currentFormData, description: e.target.value})} required rows={3}/>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                 <Switch id="dlg-listingIsActive" checked={currentFormData.isActive === undefined ? true : currentFormData.isActive} onCheckedChange={(checked) => setCurrentFormData({...currentFormData, isActive: checked})} />
                <Label htmlFor="dlg-listingIsActive" className="font-medium cursor-pointer">İlan Aktif mi?</Label>
              </div>
            </div>
            <DialogFooter className="p-6 pt-0 border-t sticky bottom-0 bg-background">
                 <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={formSubmitting || optionsLoading}>İptal</Button>
                </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting || optionsLoading}>
                {(formSubmitting || optionsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingListing ? 'Değişiklikleri Kaydet' : 'İlanı Ekle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

