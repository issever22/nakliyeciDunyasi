
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
import { 
  RESIDENTIAL_TRANSPORT_TYPES,
  RESIDENTIAL_PLACE_TYPES,
  RESIDENTIAL_ELEVATOR_STATUSES,
  RESIDENTIAL_FLOOR_LEVELS
} from '@/lib/constants';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type CountryCode, type TurkishCity } from '@/lib/locationData';
import type { ResidentialFreight, ResidentialTransportType, ResidentialPlaceType, ResidentialElevatorStatus, ResidentialFloorLevel } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import { Send, Briefcase, User, Mail, Phone, Smartphone, Package, Truck, Layers, Scale, FileText, MapPin, CalendarIcon, Home, Building, ArrowUpDown, ChevronsUpDown, Loader2 } from 'lucide-react';

interface ResidentialFreightFormProps {
  onSubmitSuccess?: (newFreightData: Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId' | 'postedBy'>) => void;
  initialData?: Partial<ResidentialFreight>; // For editing
}

export default function ResidentialFreightForm({ onSubmitSuccess, initialData }: ResidentialFreightFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Genel Bilgiler
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [workPhone, setWorkPhone] = useState(initialData?.workPhone || '');
  const [mobilePhone, setMobilePhone] = useState(initialData?.mobilePhone || '');

  // Taşımaya Ait Bilgiler
  const [residentialTransportType, setResidentialTransportType] = useState<ResidentialTransportType | ''>(initialData?.residentialTransportType || '');
  const [residentialPlaceType, setResidentialPlaceType] = useState<ResidentialPlaceType | ''>(initialData?.residentialPlaceType || '');
  const [residentialElevatorStatus, setResidentialElevatorStatus] = useState<ResidentialElevatorStatus | ''>(initialData?.residentialElevatorStatus || '');
  const [residentialFloorLevel, setResidentialFloorLevel] = useState<ResidentialFloorLevel | ''>(initialData?.residentialFloorLevel || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // Konum Bilgileri
  const [originCountry, setOriginCountry] = useState<CountryCode | string>(initialData?.originCountry || 'TR');
  const [originCity, setOriginCity] = useState<TurkishCity | string>(initialData?.originCity || '');
  const [originDistrict, setOriginDistrict] = useState(initialData?.originDistrict || '');
  const [destinationCountry, setDestinationCountry] = useState<CountryCode | string>(initialData?.destinationCountry ||'TR');
  const [destinationCity, setDestinationCity] = useState<TurkishCity | string>(initialData?.destinationCity || '');
  const [destinationDistrict, setDestinationDistrict] = useState(initialData?.destinationDistrict || '');
  
  const initialLoadingDate = initialData?.loadingDate && isValid(parseISO(initialData.loadingDate)) ? parseISO(initialData.loadingDate) : undefined;
  const [loadingDate, setLoadingDate] = useState<Date | undefined>(initialLoadingDate);
  
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [availableOriginDistricts, setAvailableOriginDistricts] = useState<readonly string[]>([]);
  const [availableDestinationDistricts, setAvailableDestinationDistricts] = useState<readonly string[]>([]);

  useEffect(() => {
    if (user && user.role === 'company' && !initialData) { 
      const companyUser = user as ResidentialFreight; 
      setCompanyName(user.name || '');
    }
  }, [user, initialData]);

  useEffect(() => {
    if (originCountry === 'TR' && TURKISH_CITIES.includes(originCity as TurkishCity)) {
      setAvailableOriginDistricts(DISTRICTS_BY_CITY_TR[originCity as TurkishCity] || []);
    } else {
      setAvailableOriginDistricts([]);
    }
     if (!initialData || originCity !== initialData.originCity) {
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
    if (!companyName || !contactPerson || !mobilePhone || !residentialTransportType || !residentialPlaceType || !residentialElevatorStatus || !residentialFloorLevel || !originCountry || !originCity || !destinationCountry || !destinationCity || !loadingDate || !description ) {
       toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu alanları doldurun.", variant: "destructive" });
       return;
    }

    setFormSubmitting(true);

    const newResidentialFreightData: Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId' | 'postedBy'> = {
      freightType: 'Evden Eve',
      companyName,
      contactPerson,
      contactEmail,
      workPhone,
      mobilePhone,
      residentialTransportType: residentialTransportType as ResidentialTransportType,
      residentialPlaceType: residentialPlaceType as ResidentialPlaceType,
      residentialElevatorStatus: residentialElevatorStatus as ResidentialElevatorStatus,
      residentialFloorLevel: residentialFloorLevel as ResidentialFloorLevel,
      description,
      originCountry,
      originCity,
      originDistrict: originCountry === 'TR' ? originDistrict : '',
      destinationCountry,
      destinationCity,
      destinationDistrict: destinationCountry === 'TR' ? destinationDistrict : '',
      loadingDate: format(loadingDate, "yyyy-MM-dd"),
      isActive: true,
    };

    if(onSubmitSuccess){
      await onSubmitSuccess(newResidentialFreightData);
    }
    
    setCompanyName(''); setContactPerson(''); setContactEmail(''); setWorkPhone(''); setMobilePhone('');
    setResidentialTransportType(''); setResidentialPlaceType(''); setResidentialElevatorStatus(''); setResidentialFloorLevel(''); setDescription('');
    setOriginCountry('TR'); setOriginCity(''); setOriginDistrict('');
    setDestinationCountry('TR'); setDestinationCity(''); setDestinationDistrict('');
    setLoadingDate(undefined);
    
    setFormSubmitting(false);
  };

  const renderCityInput = (country: CountryCode | string, city: string | TurkishCity, setCity: Function, type: 'origin' | 'destination') => {
    if (country === 'TR') {
      return (
        <Select value={city as TurkishCity} onValueChange={(value) => setCity(value as TurkishCity)}>
          <SelectTrigger id={`${type}CityTR`}><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
          <SelectContent>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return <Input id={`${type}CityOther`} placeholder="Şehir (Elle Giriş)" value={city as string} onChange={(e) => setCity(e.target.value)} />;
  };

  const renderDistrictInput = (country: CountryCode | string, city: string | TurkishCity, district: string, setDistrict: Function, availableDistricts: readonly string[], type: 'origin' | 'destination') => {
     if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity)) {
        const districtsForCity = DISTRICTS_BY_CITY_TR[city as TurkishCity] || [];
        if (districtsForCity.length > 0) {
             return (
                <Select value={district} onValueChange={(value) => setDistrict(value)}>
                <SelectTrigger id={`${type}DistrictTR`}><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                <SelectContent>{districtsForCity.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
            );
        }
        return <Input id={`${type}DistrictOtherTR`} placeholder="İlçe (Elle Giriş)" value={district} onChange={(e) => setDistrict(e.target.value)} />;
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase /> Genel Bilgiler</CardTitle>
          <CardDescription>Taşıma yapacak firma ve yetkili kişi bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-companyName">Firma Adı (*)</Label>
              <Input id="res-companyName" placeholder="Nakliyat A.Ş." value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-contactPerson">Yetkili Kişi (*)</Label>
              <Input id="res-contactPerson" placeholder="Ahmet Yılmaz" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-contactEmail">E-Posta</Label>
              <Input id="res-contactEmail" type="email" placeholder="info@firma.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-workPhone">İş Telefonu</Label>
              <Input id="res-workPhone" placeholder="0212 XXX XX XX" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-mobilePhone">Cep Telefonu (*)</Label>
              <Input id="res-mobilePhone" placeholder="0532 XXX XX XX" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Home /> Taşımaya Ait Bilgiler</CardTitle>
          <CardDescription>Evden eve nakliyatın detayları.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-residentialTransportType">Taşımacılık Türü (*)</Label>
              <Select value={residentialTransportType} onValueChange={(value) => setResidentialTransportType(value as ResidentialTransportType)}>
                <SelectTrigger id="res-residentialTransportType"><SelectValue placeholder="Taşımacılık türü seçin..." /></SelectTrigger>
                <SelectContent>{RESIDENTIAL_TRANSPORT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-residentialPlaceType">Nakliyesi Yapılacak Yer (*)</Label>
              <Select value={residentialPlaceType} onValueChange={(value) => setResidentialPlaceType(value as ResidentialPlaceType)}>
                <SelectTrigger id="res-residentialPlaceType"><SelectValue placeholder="Yer seçin..." /></SelectTrigger>
                <SelectContent>{RESIDENTIAL_PLACE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-residentialElevatorStatus">Asansör Durumu (*)</Label>
              <Select value={residentialElevatorStatus} onValueChange={(value) => setResidentialElevatorStatus(value as ResidentialElevatorStatus)}>
                <SelectTrigger id="res-residentialElevatorStatus"><SelectValue placeholder="Asansör durumu seçin..." /></SelectTrigger>
                <SelectContent>{RESIDENTIAL_ELEVATOR_STATUSES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-residentialFloorLevel">Eşyanın Bulunduğu Kat (*)</Label>
              <Select value={residentialFloorLevel} onValueChange={(value) => setResidentialFloorLevel(value as ResidentialFloorLevel)}>
                <SelectTrigger id="res-residentialFloorLevel"><SelectValue placeholder="Kat seçin..." /></SelectTrigger>
                <SelectContent>{RESIDENTIAL_FLOOR_LEVELS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="res-description">Taşınma ile İlgili Açıklama (*)</Label>
            <Textarea id="res-description" placeholder="Eşya miktarı, özel eşyalar, paketleme ihtiyacı gibi bilgileri giriniz." value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin /> Konum Bilgileri</CardTitle>
          <CardDescription>Eşyanın alınacağı ve teslim edileceği yerler ile tarih bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium text-md">Yükleneceği Yer (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="res-originCountry">Ülke</Label>
                <Select value={originCountry} onValueChange={(value) => { setOriginCountry(value); setOriginCity(''); setOriginDistrict(''); }}>
                  <SelectTrigger id="res-originCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-originCityTR">Şehir</Label>
                {renderCityInput(originCountry, originCity, setOriginCity, 'origin')}
              </div>
              {originCountry === 'TR' && (
                <div className="space-y-1.5">
                  <Label htmlFor="res-originDistrictTR">İlçe</Label>
                  {renderDistrictInput(originCountry, originCity, originDistrict, setOriginDistrict, availableOriginDistricts, 'origin')}
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-muted/20">
              <h4 className="font-medium text-md">İstikamet (Varış Yeri) (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="res-destinationCountry">Ülke</Label>
                <Select value={destinationCountry} onValueChange={(value) => { setDestinationCountry(value); setDestinationCity(''); setDestinationDistrict(''); }}>
                  <SelectTrigger id="res-destinationCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-destinationCityTR">Şehir</Label>
                {renderCityInput(destinationCountry, destinationCity, setDestinationCity, 'destination')}
              </div>
              {destinationCountry === 'TR' && (
                 <div className="space-y-1.5">
                  <Label htmlFor="res-destinationDistrictTR">İlçe</Label>
                  {renderDistrictInput(destinationCountry, destinationCity, destinationDistrict, setDestinationDistrict, availableDestinationDistricts, 'destination')}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="res-loadingDate">Yükleme Tarihi (*)</Label>
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
        </CardContent>
      </Card>
      
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={formSubmitting}>
        {formSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send size={20} className="mr-2" />}
        {formSubmitting ? 'İlan Yayınlanıyor...' :  'Evden Eve İlanı Yayınla'}
      </Button>
    </form>
  );
}
