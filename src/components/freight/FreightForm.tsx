
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LOADING_TYPES, 
  CARGO_FORMS, 
  WEIGHT_UNITS,
} from '@/lib/constants';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type CountryCode, type TurkishCity } from '@/lib/locationData';
import type { CommercialFreight, CargoType as CargoTypeName, VehicleNeeded as VehicleNeededName, LoadingType, CargoForm, WeightUnit, ShipmentScope, VehicleTypeSetting, CargoTypeSetting, CompanyUserProfile } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import { Send, Briefcase, User, Mail, Phone, Smartphone, Package, Truck, Layers, Scale, FileText, MapPin, CalendarIcon, Repeat, Loader2 } from 'lucide-react';
import { getAllVehicleTypes } from '@/services/vehicleTypesService';
import { getAllCargoTypes } from '@/services/cargoTypesService';

interface FreightFormProps {
  onSubmitSuccess: (newFreightData: Omit<CommercialFreight, 'id' | 'postedAt' | 'userId'>) => Promise<void>;
  initialData?: Partial<CommercialFreight>; 
}

export default function FreightForm({ onSubmitSuccess, initialData }: FreightFormProps) {
  const { user, isAuthenticated } = useAuth(); // user is CompanyUserProfile | null
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [workPhone, setWorkPhone] = useState(initialData?.workPhone || '');
  const [mobilePhone, setMobilePhone] = useState(initialData?.mobilePhone || '');

  const [cargoType, setCargoType] = useState<CargoTypeName | ''>(initialData?.cargoType || '');
  const [vehicleNeeded, setVehicleNeeded] = useState<VehicleNeededName | ''>(initialData?.vehicleNeeded || '');
  const [loadingType, setLoadingType] = useState<LoadingType | ''>(initialData?.loadingType || '');
  const [cargoForm, setCargoForm] = useState<CargoForm | ''>(initialData?.cargoForm || '');
  const [cargoWeight, setCargoWeight] = useState<string>(initialData?.cargoWeight?.toString() || '');
  const [cargoWeightUnit, setCargoWeightUnit] = useState<WeightUnit>(initialData?.cargoWeightUnit ||'Ton');
  const [description, setDescription] = useState(initialData?.description || '');

  const [originCountry, setOriginCountry] = useState<CountryCode | string>(initialData?.originCountry || 'TR');
  const [originCity, setOriginCity] = useState<TurkishCity | string>(initialData?.originCity || '');
  const [originDistrict, setOriginDistrict] = useState(initialData?.originDistrict || '');
  
  const [destinationCountry, setDestinationCountry] = useState<CountryCode | string>(initialData?.destinationCountry || 'TR');
  const [destinationCity, setDestinationCity] = useState<TurkishCity | string>(initialData?.destinationCity || '');
  const [destinationDistrict, setDestinationDistrict] = useState(initialData?.destinationDistrict || '');
  
  const [loadingDate, setLoadingDate] = useState<Date | undefined>(
    initialData?.loadingDate && isValid(parseISO(initialData.loadingDate)) ? parseISO(initialData.loadingDate) : undefined
  );
  
  const [isContinuousLoad, setIsContinuousLoad] = useState(initialData?.isContinuousLoad || false);
  
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [availableOriginDistricts, setAvailableOriginDistricts] = useState<readonly string[]>([]);
  const [availableDestinationDistricts, setAvailableDestinationDistricts] = useState<readonly string[]>([]);

  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<VehicleTypeSetting[]>([]);
  const [cargoTypeOptions, setCargoTypeOptions] = useState<CargoTypeSetting[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const [vehicles, cargos] = await Promise.all([
          getAllVehicleTypes(),
          getAllCargoTypes()
        ]);
        setVehicleTypeOptions(vehicles.filter(v => v.isActive));
        setCargoTypeOptions(cargos.filter(c => c.isActive));
      } catch (error) {
        console.error("Error fetching form options:", error);
        toast({ title: "Hata", description: "Form seçenekleri yüklenemedi.", variant: "destructive" });
      }
      setOptionsLoading(false);
    };
    fetchOptions();
  }, [toast]);
  
  useEffect(() => {
    // Pre-fill contact info if a company user is logged in and it's not an edit scenario with initialData
    if (isAuthenticated && user && user.role === 'company' && !initialData) { 
      const companyUser = user as CompanyUserProfile; // Cast since role is 'company'
      setCompanyName(companyUser.companyTitle || ''); 
      setContactPerson(companyUser.contactFullName || '');
      setMobilePhone(companyUser.mobilePhone || '');
      setContactEmail(companyUser.email || '');
      setWorkPhone(companyUser.workPhone || '');
    } else if (!isAuthenticated && !initialData) {
      // Clear fields if user logs out or for guest new form
      setCompanyName('');
      setContactPerson('');
      setMobilePhone('');
      setContactEmail('');
      setWorkPhone('');
    }
    // If initialData is provided, it means we are editing, so fields are already set from initialData
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
    // For guests or logged-in users, these fields are now mandatory at form level
    if (!companyName || !contactPerson || !mobilePhone || !cargoType || !vehicleNeeded || !loadingType || !cargoForm || !cargoWeight || !originCity || !destinationCity || !loadingDate || !description ) {
       toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu (*) alanları doldurun.", variant: "destructive" });
       return;
    }
    const parsedCargoWeight = parseFloat(cargoWeight);
    if (isNaN(parsedCargoWeight) || parsedCargoWeight <= 0) {
      toast({ title: "Geçersiz Yük Miktarı", description: "Lütfen geçerli bir yük miktarı girin.", variant: "destructive" });
      return;
    }

    setFormSubmitting(true);

    const determinedShipmentScope: ShipmentScope = (originCountry === 'TR' && destinationCountry === 'TR') ? 'Yurt İçi' : 'Yurt Dışı';

    // postedBy will be handled by the parent page based on auth state
    const newFreightData: Omit<CommercialFreight, 'id' | 'postedAt' | 'userId'> = {
      freightType: 'Yük', 
      companyName,
      contactPerson,
      contactEmail: contactEmail || undefined,
      workPhone: workPhone || undefined,
      mobilePhone,
      cargoType: cargoType as CargoTypeName,
      vehicleNeeded: vehicleNeeded as VehicleNeededName,
      loadingType: loadingType as LoadingType,
      cargoForm: cargoForm as CargoForm,
      cargoWeight: parsedCargoWeight,
      cargoWeightUnit,
      description,
      originCountry,
      originCity,
      originDistrict: originCountry === 'TR' ? originDistrict || undefined : undefined, 
      destinationCountry,
      destinationCity,
      destinationDistrict: destinationCountry === 'TR' ? destinationDistrict || undefined : undefined, 
      loadingDate: format(loadingDate, "yyyy-MM-dd"),
      isContinuousLoad,
      shipmentScope: determinedShipmentScope,
      isActive: true, 
      // userId and postedBy will be added by the parent onSubmitSuccess handler
      postedBy: '', // Placeholder, will be overridden
    };
    
    try {
      await onSubmitSuccess(newFreightData);
    } catch (error) {
      console.error("Error in onSubmitSuccess for commercial freight:", error);
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
          <SelectTrigger id={`com-${type}CityTR`}><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
          <SelectContent>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return <Input id={`com-${type}CityOther`} placeholder="Şehir (Elle Giriş)" value={city as string} onChange={(e) => setCity(e.target.value)} />;
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
          <SelectTrigger id={`com-${type}DistrictTR`}><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
          <SelectContent>{availableDistrictsForInput.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity) && availableDistrictsForInput.length === 0) {
      return <Input id={`com-${type}DistrictOtherTR`} placeholder="İlçe (Elle Giriş)" value={district} onChange={(e) => setDistrict(e.target.value)} />;
    }
    return null; 
  };

  if (optionsLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Yükleniyor...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Briefcase size={20}/> İletişim Bilgileri</CardTitle>
          <CardDescription>İlan veren firma/kişi ve yetkili iletişim bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="com-companyName">Firma Adı / Ad Soyad (*)</Label>
              <Input id="com-companyName" placeholder="Nakliyat A.Ş. veya Ad Soyad" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-contactPerson">Yetkili Kişi (*)</Label>
              <Input id="com-contactPerson" placeholder="Ahmet Yılmaz" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="com-contactEmail">E-Posta</Label>
              <Input id="com-contactEmail" type="email" placeholder="info@firma.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-workPhone">İş Telefonu</Label>
              <Input id="com-workPhone" placeholder="0212 XXX XX XX" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-mobilePhone">Cep Telefonu (*)</Label>
              <Input id="com-mobilePhone" placeholder="0532 XXX XX XX" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Package size={20}/> Yük Detayları</CardTitle>
          <CardDescription>Taşınacak yükün özellikleri ve aranan araç tipi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="com-cargoType">Yük Cinsi (*)</Label>
              <Select value={cargoType} onValueChange={(value) => setCargoType(value as CargoTypeName)} required>
                <SelectTrigger id="com-cargoType"><SelectValue placeholder="Yük cinsi seçin..." /></SelectTrigger>
                <SelectContent>
                  {cargoTypeOptions.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-vehicleNeeded">Aranılan Araç (*)</Label>
              <Select value={vehicleNeeded} onValueChange={(value) => setVehicleNeeded(value as VehicleNeededName)} required>
                <SelectTrigger id="com-vehicleNeeded"><SelectValue placeholder="Araç tipi seçin..." /></SelectTrigger>
                <SelectContent>
                  {vehicleTypeOptions.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="com-loadingType">Yükün Yükleniş Şekli (*)</Label>
              <Select value={loadingType} onValueChange={(value) => setLoadingType(value as LoadingType)} required>
                <SelectTrigger id="com-loadingType"><SelectValue placeholder="Yükleniş şekli..." /></SelectTrigger>
                <SelectContent>{LOADING_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-cargoForm">Yükün Biçimi (*)</Label>
              <Select value={cargoForm} onValueChange={(value) => setCargoForm(value as CargoForm)} required>
                <SelectTrigger id="com-cargoForm"><SelectValue placeholder="Yük biçimi..." /></SelectTrigger>
                <SelectContent>{CARGO_FORMS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-cargoWeight">Yükün Miktarı/Tonajı (*)</Label>
              <div className="flex gap-2">
                <Input id="com-cargoWeight" type="number" placeholder="00" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} required className="flex-grow" />
                <Select value={cargoWeightUnit} onValueChange={(value) => setCargoWeightUnit(value as WeightUnit)}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{WEIGHT_UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
           <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="com-isContinuousLoad" checked={isContinuousLoad} onCheckedChange={(checked) => setIsContinuousLoad(Boolean(checked))} />
              <Label htmlFor="com-isContinuousLoad" className="text-sm font-normal cursor-pointer flex items-center gap-1">
                <Repeat size={16}/> Sürekli (Proje) Yük
              </Label>
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><MapPin size={20}/> Güzergah ve Tarih</CardTitle>
          <CardDescription>Yükün alınacağı, teslim edileceği yerler ve yükleme tarihi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 border rounded-md bg-muted/10">
              <h4 className="font-medium">Yükleneceği Yer (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="com-originCountry">Ülke</Label>
                <Select value={originCountry} onValueChange={(value) => { setOriginCountry(value); setOriginCity(''); setOriginDistrict(''); }}>
                  <SelectTrigger id="com-originCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="com-originCityTR">Şehir (*)</Label>
                {renderCityInput(originCountry, originCity, setOriginCity, 'origin')}
              </div>
              {originCountry === 'TR' && (
                <div className="space-y-1.5">
                  <Label htmlFor="com-originDistrictTR">İlçe</Label>
                  {renderDistrictInput(originCountry, originCity, originDistrict, setOriginDistrict, availableOriginDistricts, 'origin')}
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-muted/10">
              <h4 className="font-medium">İstikamet (Varış Yeri) (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="com-destinationCountry">Ülke</Label>
                <Select value={destinationCountry} onValueChange={(value) => { setDestinationCountry(value); setDestinationCity(''); setDestinationDistrict(''); }}>
                  <SelectTrigger id="com-destinationCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="com-destinationCityTR">Şehir (*)</Label>
                {renderCityInput(destinationCountry, destinationCity, setDestinationCity, 'destination')}
              </div>
              {destinationCountry === 'TR' && (
                 <div className="space-y-1.5">
                  <Label htmlFor="com-destinationDistrictTR">İlçe</Label>
                  {renderDistrictInput(destinationCountry, destinationCity, destinationDistrict, setDestinationDistrict, availableDestinationDistricts, 'destination')}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="com-loadingDate">Yükleme Tarihi (*)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!loadingDate && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {loadingDate ? format(loadingDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={loadingDate}
                  onSelect={setLoadingDate}
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
            <CardTitle className="flex items-center gap-2 text-xl"><FileText size={20}/> Açıklama</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-1.5">
                <Label htmlFor="com-description">Yükle İlgili Açıklama (*)</Label>
                <Textarea id="com-description" placeholder="Yükün cinsi, ağırlığı, hacmi, yükleme/boşaltma saatleri, özel gereksinimler gibi bilgileri giriniz." value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
            </div>
        </CardContent>
      </Card>
      
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3 font-semibold flex items-center justify-center gap-2" disabled={formSubmitting || optionsLoading}>
        {formSubmitting || optionsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={20} />}
        {formSubmitting ? 'İlan Yayınlanıyor...' : (optionsLoading ? 'Seçenekler Yükleniyor...' : 'Yük İlanı Yayınla')}
      </Button>
    </form>
  );
}

    