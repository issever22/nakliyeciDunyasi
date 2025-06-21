
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EMPTY_VEHICLE_SERVICE_TYPES, WEIGHT_UNITS } from '@/lib/constants';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type CountryCode, type TurkishCity } from '@/lib/locationData';
import type { EmptyVehicleListing, EmptyVehicleServiceType, WeightUnit, VehicleTypeSetting, CompanyUserProfile } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import { Send, Briefcase, Truck, User, MapPin, CalendarIcon, FileText, Loader2, Phone, Smartphone, Mail } from 'lucide-react'; // Added contact icons
import { getAllVehicleTypes } from '@/services/vehicleTypesService';

interface EmptyVehicleFormProps {
  onSubmitSuccess: (newFreightData: Omit<EmptyVehicleListing, 'id' | 'postedAt' | 'userId'>) => Promise<void>;
  initialData?: Partial<EmptyVehicleListing>; 
}

export default function EmptyVehicleForm({ onSubmitSuccess, initialData }: EmptyVehicleFormProps) {
  const { user, isAuthenticated } = useAuth(); // user is CompanyUserProfile | null
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  // For EmptyVehicleForm, contactPerson, mobilePhone etc. might be directly from user or entered
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson || '');
  const [mobilePhone, setMobilePhone] = useState(initialData?.mobilePhone || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || ''); // Optional
  
  const [advertisedVehicleType, setAdvertisedVehicleType] = useState<string>(initialData?.advertisedVehicleType || '');
  const [serviceTypeForLoad, setServiceTypeForLoad] = useState<EmptyVehicleServiceType | ''>(initialData?.serviceTypeForLoad || '');
  const [vehicleStatedCapacity, setVehicleStatedCapacity] = useState<string>(initialData?.vehicleStatedCapacity?.toString() || '');
  const [vehicleStatedCapacityUnit, setVehicleStatedCapacityUnit] = useState<WeightUnit>(initialData?.vehicleStatedCapacityUnit ||'Ton');
  const [description, setDescription] = useState(initialData?.description || '');

  const [originCountry, setOriginCountry] = useState<CountryCode | string>(initialData?.originCountry || 'TR');
  const [originCity, setOriginCity] = useState<TurkishCity | string>(initialData?.originCity || '');
  const [originDistrict, setOriginDistrict] = useState(initialData?.originDistrict || '');
  
  const [destinationCountry, setDestinationCountry] = useState<CountryCode | string>(initialData?.destinationCountry || 'TR');
  const [destinationCity, setDestinationCity] = useState<TurkishCity | string>(initialData?.destinationCity || '');
  const [destinationDistrict, setDestinationDistrict] = useState(initialData?.destinationDistrict || '');
  
  const [availabilityDate, setAvailabilityDate] = useState<Date | undefined>(
    initialData?.loadingDate && isValid(parseISO(initialData.loadingDate)) ? parseISO(initialData.loadingDate) : undefined
  );
  
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [availableOriginDistricts, setAvailableOriginDistricts] = useState<readonly string[]>([]);
  const [availableDestinationDistricts, setAvailableDestinationDistricts] = useState<readonly string[]>([]);

  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<VehicleTypeSetting[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const vehicles = await getAllVehicleTypes();
        setVehicleTypeOptions(vehicles.filter(v => v.isActive));
      } catch (error) {
        console.error("Error fetching vehicle type options for empty vehicle form:", error);
        toast({ title: "Hata", description: "Araç tipleri yüklenemedi.", variant: "destructive" });
      }
      setOptionsLoading(false);
    };
    fetchOptions();
  }, [toast]);
  
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'company' && !initialData) { 
      const companyUser = user as CompanyUserProfile;
      setCompanyName(companyUser.companyTitle || ''); 
      setContactPerson(companyUser.contactFullName || '');
      setMobilePhone(companyUser.mobilePhone || '');
      setContactEmail(companyUser.email || '');
    } else if (!isAuthenticated && !initialData) {
        setCompanyName('');
        setContactPerson('');
        setMobilePhone('');
        setContactEmail('');
    }
  }, [user, isAuthenticated, initialData]);

  useEffect(() => {
    let newDistricts: readonly string[] = [];
    if (originCountry === 'TR' && TURKISH_CITIES.includes(originCity as TurkishCity)) {
      newDistricts = DISTRICTS_BY_CITY_TR[originCity as TurkishCity] || [];
    }
    setAvailableOriginDistricts(newDistricts);
    if (!newDistricts.includes(originDistrict)) { 
        setOriginDistrict(''); 
    }
  }, [originCity, originCountry, originDistrict]);

  useEffect(() => {
    let newDistricts: readonly string[] = [];
    if (destinationCountry === 'TR' && TURKISH_CITIES.includes(destinationCity as TurkishCity)) {
      newDistricts = DISTRICTS_BY_CITY_TR[destinationCity as TurkishCity] || [];
    }
    setAvailableDestinationDistricts(newDistricts);
    if (!newDistricts.includes(destinationDistrict)) {
        setDestinationDistrict(''); 
    }
  }, [destinationCity, destinationCountry, destinationDistrict]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!companyName || !contactPerson || !mobilePhone || !advertisedVehicleType || !serviceTypeForLoad || !vehicleStatedCapacity || !originCity || !destinationCity || !availabilityDate || !description ) {
       toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu (*) alanları doldurun.", variant: "destructive" });
       return;
    }
    const parsedCapacity = parseFloat(vehicleStatedCapacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      toast({ title: "Geçersiz Kapasite", description: "Lütfen geçerli bir araç kapasitesi girin.", variant: "destructive" });
      return;
    }

    setFormSubmitting(true);

    const newFreightData: Omit<EmptyVehicleListing, 'id' | 'postedAt' | 'userId'> = {
      freightType: 'Boş Araç',
      companyName, 
      contactPerson, 
      mobilePhone, 
      contactEmail: contactEmail || undefined,
      
      advertisedVehicleType,
      serviceTypeForLoad: serviceTypeForLoad as EmptyVehicleServiceType,
      vehicleStatedCapacity: parsedCapacity,
      vehicleStatedCapacityUnit,
      
      description,
      originCountry,
      originCity,
      originDistrict: originCountry === 'TR' ? originDistrict || undefined : undefined, 
      destinationCountry,
      destinationCity,
      destinationDistrict: destinationCountry === 'TR' ? destinationDistrict || undefined : undefined, 
      loadingDate: format(availabilityDate, "yyyy-MM-dd"),
      isActive: false, // Default to inactive for admin approval
      // userId and postedBy will be added by the parent onSubmitSuccess handler
      postedBy: '', // Placeholder, will be overridden
    };
    
    try {
      await onSubmitSuccess(newFreightData);
    } catch (error) {
      console.error("Error in onSubmitSuccess for empty vehicle listing:", error);
      toast({ title: "İlan Kayıt Hatası", description: "İlan kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
    } finally {
      setFormSubmitting(false);
    }
  };

  const renderCityInput = (
    country: CountryCode | string, 
    city: string | TurkishCity, 
    setCity: (value: TurkishCity | string) => void, 
    type: 'origin' | 'destination'
  ) => {
    if (country === 'TR') {
      return (
        <Select value={city as TurkishCity} onValueChange={setCity}>
          <SelectTrigger id={`empty-${type}CityTR`}><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
          <SelectContent>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return <Input id={`empty-${type}CityOther`} placeholder="Şehir (Elle Giriş)" value={city as string} onChange={(e) => setCity(e.target.value)} />;
  };

  const renderDistrictInput = (
    country: CountryCode | string, 
    city: string | TurkishCity, 
    district: string, 
    setDistrict: (value: string) => void, 
    availableDistrictsForInput: readonly string[], 
    type: 'origin' | 'destination'
  ) => {
    if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity) && availableDistrictsForInput.length > 0) {
      return (
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger id={`empty-${type}DistrictTR`}><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
          <SelectContent>{availableDistrictsForInput.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
     if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity) && availableDistrictsForInput.length === 0) {
      return <Input id={`empty-${type}DistrictOtherTR`} placeholder="İlçe (Elle Giriş)" value={district} onChange={(e) => setDistrict(e.target.value)} />;
    }
    return null; 
  };

  if (optionsLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Araç tipleri yükleniyor...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><User size={20}/> Firma/Kişi Bilgileri</CardTitle>
          <CardDescription>İlan veren firma/kişi ve yetkili iletişim bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                <Label htmlFor="empty-companyName">Firma Adı / Ad Soyad (*)</Label>
                <Input id="empty-companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Nakliyat A.Ş. veya Ad Soyad"/>
                </div>
                <div className="space-y-1.5">
                <Label htmlFor="empty-contactPerson">Yetkili Kişi (*)</Label>
                <Input id="empty-contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required placeholder="Ahmet Yılmaz"/>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                <Label htmlFor="empty-mobilePhone">Cep Telefonu (*)</Label>
                <Input id="empty-mobilePhone" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} required placeholder="05XX XXX XX XX"/>
                </div>
                <div className="space-y-1.5">
                <Label htmlFor="empty-contactEmail">E-Posta (Opsiyonel)</Label>
                <Input id="empty-contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="iletisim@firma.com"/>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Truck size={20}/> Araç Detayları</CardTitle>
          <CardDescription>Boşta olan aracınızın özellikleri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="empty-advertisedVehicleType">Araç Cinsi (*)</Label>
              <Select value={advertisedVehicleType} onValueChange={setAdvertisedVehicleType} required>
                <SelectTrigger id="empty-advertisedVehicleType"><SelectValue placeholder="Araç cinsi seçin..." /></SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empty-serviceTypeForLoad">Taşıma Hizmet Tipi (*)</Label>
              <Select value={serviceTypeForLoad} onValueChange={(value) => setServiceTypeForLoad(value as EmptyVehicleServiceType)} required>
                <SelectTrigger id="empty-serviceTypeForLoad"><SelectValue placeholder="Hizmet tipi seçin..." /></SelectTrigger>
                <SelectContent>{EMPTY_VEHICLE_SERVICE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
              <Label htmlFor="empty-vehicleStatedCapacity">Aracın Kapasitesi (*)</Label>
              <div className="flex gap-2">
                <Input id="empty-vehicleStatedCapacity" type="number" placeholder="00" value={vehicleStatedCapacity} onChange={(e) => setVehicleStatedCapacity(e.target.value)} required className="flex-grow" />
                <Select value={vehicleStatedCapacityUnit} onValueChange={(value) => setVehicleStatedCapacityUnit(value as WeightUnit)}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{WEIGHT_UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><MapPin size={20}/> Konum ve İstikamet</CardTitle>
          <CardDescription>Aracın şu anki konumu, gideceği/gidebileceği yer ve müsaitlik tarihi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 border rounded-md bg-muted/10">
              <h4 className="font-medium">Aracın Bulunduğu Yer (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="empty-originCountry">Ülke</Label>
                <Select value={originCountry} onValueChange={(value) => { setOriginCountry(value); setOriginCity(''); setOriginDistrict(''); }}>
                  <SelectTrigger id="empty-originCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="empty-originCityTR">Şehir (*)</Label>
                {renderCityInput(originCountry, originCity, setOriginCity, 'origin')}
              </div>
              {originCountry === 'TR' && (
                <div className="space-y-1.5">
                  <Label htmlFor="empty-originDistrictTR">İlçe</Label>
                  {renderDistrictInput(originCountry, originCity, originDistrict, setOriginDistrict, availableOriginDistricts, 'origin')}
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-muted/10">
              <h4 className="font-medium">Aracın İstikameti (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="empty-destinationCountry">Ülke</Label>
                <Select value={destinationCountry} onValueChange={(value) => { setDestinationCountry(value); setDestinationCity(''); setDestinationDistrict(''); }}>
                  <SelectTrigger id="empty-destinationCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="empty-destinationCityTR">Şehir (*)</Label>
                {renderCityInput(destinationCountry, destinationCity, setDestinationCity, 'destination')}
              </div>
              {destinationCountry === 'TR' && (
                 <div className="space-y-1.5">
                  <Label htmlFor="empty-destinationDistrictTR">İlçe</Label>
                  {renderDistrictInput(destinationCountry, destinationCity, destinationDistrict, setDestinationDistrict, availableDestinationDistricts, 'destination')}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="empty-availabilityDate">Müsaitlik Tarihi (*)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!availabilityDate && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {availabilityDate ? format(availabilityDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={availabilityDate}
                  onSelect={setAvailabilityDate}
                  initialFocus
                  locale={tr}
                  disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} 
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><FileText size={20}/> Araçla İlgili Açıklama</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-1.5">
                <Label htmlFor="empty-description">Ek Detaylar (*)</Label>
                <Textarea id="empty-description" placeholder="Aracın durumu, ek özellikleri, tercih edilen yük türleri hakkında detaylı bilgi..." value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
            </div>
        </CardContent>
      </Card>
      
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3 font-semibold flex items-center justify-center gap-2" disabled={formSubmitting || optionsLoading}>
        {formSubmitting || optionsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={20} />}
        {formSubmitting ? 'İlan Yayınlanıyor...' : (optionsLoading ? 'Seçenekler Yükleniyor...' : 'Boş Araç İlanı Yayınla')}
      </Button>
    </form>
  );
}
