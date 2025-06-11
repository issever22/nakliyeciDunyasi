
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
  CARGO_TYPES, 
  VEHICLES_NEEDED, 
  LOADING_TYPES, 
  CARGO_FORMS, 
  WEIGHT_UNITS,
  SHIPMENT_SCOPES
} from '@/lib/constants';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type CountryCode, type TurkishCity } from '@/lib/locationData';
import type { CommercialFreight, CargoType, VehicleNeeded, LoadingType, CargoForm, WeightUnit, ShipmentScope } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import { Send, Briefcase, User, Mail, Phone, Smartphone, Package, Truck, Layers, Scale, FileText, MapPin, CalendarIcon, Repeat, Loader2 } from 'lucide-react';

interface FreightFormProps {
  onSubmitSuccess?: (newFreightData: Omit<CommercialFreight, 'id' | 'postedAt' | 'userId' | 'postedBy'>) => void;
  initialData?: Partial<CommercialFreight>; // For editing, not used in this context yet
}

export default function FreightForm({ onSubmitSuccess, initialData }: FreightFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Genel Bilgiler
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [workPhone, setWorkPhone] = useState(initialData?.workPhone || '');
  const [mobilePhone, setMobilePhone] = useState(initialData?.mobilePhone || '');

  // Yüke Ait Bilgiler
  const [cargoType, setCargoType] = useState<CargoType | ''>(initialData?.cargoType || '');
  const [vehicleNeeded, setVehicleNeeded] = useState<VehicleNeeded | ''>(initialData?.vehicleNeeded || '');
  const [loadingType, setLoadingType] = useState<LoadingType | ''>(initialData?.loadingType || '');
  const [cargoForm, setCargoForm] = useState<CargoForm | ''>(initialData?.cargoForm || '');
  const [cargoWeight, setCargoWeight] = useState<number | ''>(initialData?.cargoWeight || '');
  const [cargoWeightUnit, setCargoWeightUnit] = useState<WeightUnit>(initialData?.cargoWeightUnit ||'Ton');
  const [description, setDescription] = useState(initialData?.description || '');

  // Yükleme ve Varış Bilgileri
  const [originCountry, setOriginCountry] = useState<CountryCode | string>(initialData?.originCountry || 'TR');
  const [originCity, setOriginCity] = useState<TurkishCity | string>(initialData?.originCity || '');
  const [originDistrict, setOriginDistrict] = useState(initialData?.originDistrict || '');
  const [destinationCountry, setDestinationCountry] = useState<CountryCode | string>(initialData?.destinationCountry || 'TR');
  const [destinationCity, setDestinationCity] = useState<TurkishCity | string>(initialData?.destinationCity || '');
  const [destinationDistrict, setDestinationDistrict] = useState(initialData?.destinationDistrict || '');
  
  const initialLoadingDate = initialData?.loadingDate && isValid(parseISO(initialData.loadingDate)) ? parseISO(initialData.loadingDate) : undefined;
  const [loadingDate, setLoadingDate] = useState<Date | undefined>(initialLoadingDate);
  
  const [isContinuousLoad, setIsContinuousLoad] = useState(initialData?.isContinuousLoad || false);
  
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [availableOriginDistricts, setAvailableOriginDistricts] = useState<readonly string[]>([]);
  const [availableDestinationDistricts, setAvailableDestinationDistricts] = useState<readonly string[]>([]);
  
  // Populate form if editing user provides company details
  useEffect(() => {
    if (user && user.role === 'company' && !initialData) { // Only on new listing and if user is a company
      const companyUser = user as CommercialFreight; // Cast to access company specific fields - this is not ideal, user type is different
      // A better approach: user.companyProfile.companyName etc. if user object is structured that way
      // For now, we assume companyName and contact details might come from the user object if available
      setCompanyName(user.name || ''); // User.name is companyTitle for company users
      // setContactPerson(user.contactFullName || ''); // Need a way to get contactFullName
      // setMobilePhone(user.mobilePhone || ''); // Need a way to get mobilePhone
    }
  }, [user, initialData]);


  useEffect(() => {
    if (originCountry === 'TR' && TURKISH_CITIES.includes(originCity as TurkishCity)) {
      setAvailableOriginDistricts(DISTRICTS_BY_CITY_TR[originCity as TurkishCity] || []);
    } else {
      setAvailableOriginDistricts([]);
    }
    if (!initialData || originCity !== initialData.originCity) { // Only reset district if city changed or not initial load
        setOriginDistrict(''); 
    }
  }, [originCity, originCountry, initialData]);

  useEffect(() => {
    if (destinationCountry === 'TR' && TURKISH_CITIES.includes(destinationCity as TurkishCity)) {
      setAvailableDestinationDistricts(DISTRICTS_BY_CITY_TR[destinationCity as TurkishCity] || []);
    } else {
      setAvailableDestinationDistricts([]);
    }
    if (!initialData || destinationCity !== initialData.destinationCity) {
        setDestinationDistrict(''); 
    }
  }, [destinationCity, destinationCountry, initialData]);


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Hata", description: "İlan vermek için giriş yapmalısınız.", variant: "destructive" });
      return;
    }
    if (!companyName || !contactPerson || !mobilePhone || !cargoType || !vehicleNeeded || !loadingType || !cargoForm || cargoWeight === '' || !originCountry || !originCity || !destinationCountry || !destinationCity || !loadingDate || !description ) {
       toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu alanları doldurun.", variant: "destructive" });
       return;
    }

    setFormSubmitting(true);

    const determinedShipmentScope: ShipmentScope = (originCountry === 'TR' && destinationCountry === 'TR') ? 'Yurt İçi' : 'Yurt Dışı';

    const newCommercialFreightData: Omit<CommercialFreight, 'id' | 'postedAt' | 'userId' | 'postedBy'> = {
      freightType: 'Ticari',
      companyName,
      contactPerson,
      contactEmail,
      workPhone,
      mobilePhone,
      cargoType: cargoType as CargoType,
      vehicleNeeded: vehicleNeeded as VehicleNeeded,
      loadingType: loadingType as LoadingType,
      cargoForm: cargoForm as CargoForm,
      cargoWeight: Number(cargoWeight),
      cargoWeightUnit,
      description,
      originCountry,
      originCity,
      originDistrict: originCountry === 'TR' ? originDistrict : '', 
      destinationCountry,
      destinationCity,
      destinationDistrict: destinationCountry === 'TR' ? destinationDistrict : '', 
      loadingDate: format(loadingDate, "yyyy-MM-dd"),
      isContinuousLoad,
      shipmentScope: determinedShipmentScope,
      isActive: true, // Default to active for new listings
    };
    
    if (onSubmitSuccess) {
      await onSubmitSuccess(newCommercialFreightData); // Call the passed submit handler
    }
    
    // Reset form fields after successful submission handled by parent
    setCompanyName(''); setContactPerson(''); setContactEmail(''); setWorkPhone(''); setMobilePhone('');
    setCargoType(''); setVehicleNeeded(''); setLoadingType(''); setCargoForm(''); setCargoWeight(''); setCargoWeightUnit('Ton'); setDescription('');
    setOriginCountry('TR'); setOriginCity(''); setOriginDistrict('');
    setDestinationCountry('TR'); setDestinationCity(''); setDestinationDistrict('');
    setLoadingDate(undefined); setIsContinuousLoad(false);
    
    setFormSubmitting(false);
  };

  const renderCityInput = (country: CountryCode | string, city: string | TurkishCity, setCity: Function, type: 'origin' | 'destination') => {
    if (country === 'TR') {
      return (
        <Select value={city as TurkishCity} onValueChange={(value) => setCity(value as TurkishCity)}>
          <SelectTrigger id={`com-${type}CityTR`}><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
          <SelectContent>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return <Input id={`com-${type}CityOther`} placeholder="Şehir (Elle Giriş)" value={city as string} onChange={(e) => setCity(e.target.value)} />;
  };

  const renderDistrictInput = (country: CountryCode | string, city: string | TurkishCity, district: string, setDistrict: Function, availableDistricts: readonly string[], type: 'origin' | 'destination') => {
    if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity)) {
        const districtsForCity = DISTRICTS_BY_CITY_TR[city as TurkishCity] || [];
        if (districtsForCity.length > 0) {
             return (
                <Select value={district} onValueChange={(value) => setDistrict(value)}>
                <SelectTrigger id={`com-${type}DistrictTR`}><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                <SelectContent>{districtsForCity.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
            );
        }
        return <Input id={`com-${type}DistrictOtherTR`} placeholder="İlçe (Elle Giriş)" value={district} onChange={(e) => setDistrict(e.target.value)} />;
    }
    return null; 
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase /> Genel Bilgiler</CardTitle>
          <CardDescription>İlan veren firma ve yetkili kişi bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="com-companyName">Firma Adı (*)</Label>
              <Input id="com-companyName" placeholder="Nakliyat A.Ş." value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package /> Yüke Ait Bilgiler</CardTitle>
          <CardDescription>Taşınacak yükün özellikleri ve aranan araç tipi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="com-cargoType">Yük Cinsi (*)</Label>
              <Select value={cargoType} onValueChange={(value) => setCargoType(value as CargoType)}>
                <SelectTrigger id="com-cargoType"><SelectValue placeholder="Yük cinsi seçin..." /></SelectTrigger>
                <SelectContent>{CARGO_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-vehicleNeeded">Aranılan Araç (*)</Label>
              <Select value={vehicleNeeded} onValueChange={(value) => setVehicleNeeded(value as VehicleNeeded)}>
                <SelectTrigger id="com-vehicleNeeded"><SelectValue placeholder="Araç tipi seçin..." /></SelectTrigger>
                <SelectContent>{VEHICLES_NEEDED.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="com-loadingType">Yükün Yükleniş Şekli (*)</Label>
              <Select value={loadingType} onValueChange={(value) => setLoadingType(value as LoadingType)}>
                <SelectTrigger id="com-loadingType"><SelectValue placeholder="Yükleniş şekli..." /></SelectTrigger>
                <SelectContent>{LOADING_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-cargoForm">Yükün Biçimi (*)</Label>
              <Select value={cargoForm} onValueChange={(value) => setCargoForm(value as CargoForm)}>
                <SelectTrigger id="com-cargoForm"><SelectValue placeholder="Yük biçimi..." /></SelectTrigger>
                <SelectContent>{CARGO_FORMS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="com-cargoWeight">Yükün Miktarı/Tonajı (*)</Label>
              <div className="flex gap-2">
                <Input id="com-cargoWeight" type="number" placeholder="00" value={cargoWeight} onChange={(e) => setCargoWeight(parseFloat(e.target.value) || '')} required className="flex-grow" />
                <Select value={cargoWeightUnit} onValueChange={(value) => setCargoWeightUnit(value as WeightUnit)}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{WEIGHT_UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="com-description">Yükle İlgili Açıklama (*)</Label>
            <Textarea id="com-description" placeholder="Yükün cinsi, ağırlığı, hacmi, yükleme/boşaltma saatleri gibi bilgileri giriniz." value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin /> Yükleme ve Varış Bilgileri</CardTitle>
          <CardDescription>Yükün alınacağı ve teslim edileceği yerler ile tarih bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium text-md">Yükleneceği Yer (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="com-originCountry">Ülke</Label>
                <Select value={originCountry} onValueChange={(value) => { setOriginCountry(value); setOriginCity(''); setOriginDistrict(''); }}>
                  <SelectTrigger id="com-originCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="com-originCityTR">Şehir</Label>
                {renderCityInput(originCountry, originCity, setOriginCity, 'origin')}
              </div>
              {originCountry === 'TR' && (
                <div className="space-y-1.5">
                  <Label htmlFor="com-originDistrictTR">İlçe</Label>
                  {renderDistrictInput(originCountry, originCity, originDistrict, setOriginDistrict, availableOriginDistricts, 'origin')}
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium text-md">İstikamet (Varış Yeri) (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="com-destinationCountry">Ülke</Label>
                <Select value={destinationCountry} onValueChange={(value) => { setDestinationCountry(value); setDestinationCity(''); setDestinationDistrict(''); }}>
                  <SelectTrigger id="com-destinationCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="com-destinationCityTR">Şehir</Label>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
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
                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} // Disable past dates
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center space-x-2 pb-1.5">
              <Checkbox id="com-isContinuousLoad" checked={isContinuousLoad} onCheckedChange={(checked) => setIsContinuousLoad(Boolean(checked))} />
              <Label htmlFor="com-isContinuousLoad" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
                <Repeat size={16}/> Sürekli (Proje) Yük
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={formSubmitting}>
        {formSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send size={20} className="mr-2" />}
        {formSubmitting ? 'İlan Yayınlanıyor...' : 'Ticari İlanı Yayınla'}
      </Button>
    </form>
  );
}
