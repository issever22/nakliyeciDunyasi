
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
  RESIDENTIAL_PLACE_TYPES,
  RESIDENTIAL_ELEVATOR_STATUSES,
  RESIDENTIAL_FLOOR_LEVELS
} from '@/lib/constants';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type CountryCode, type TurkishCity } from '@/lib/locationData';
import type { ResidentialFreight, ResidentialTransportType, ResidentialPlaceType, ResidentialElevatorStatus, ResidentialFloorLevel, TransportTypeSetting } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import { Send, Briefcase, User, Mail, Phone, Smartphone, MapPin, CalendarIcon, Home, Loader2 } from 'lucide-react';
import { getAllTransportTypes } from '@/services/transportTypesService';

interface ResidentialFreightFormProps {
  onSubmitSuccess: (newFreightData: Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId'>) => Promise<void>;
  initialData?: Partial<ResidentialFreight>;
}

export default function ResidentialFreightForm({ onSubmitSuccess, initialData }: ResidentialFreightFormProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [contactPerson, setContactPerson] = useState(initialData?.contactPerson || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [workPhone, setWorkPhone] = useState(initialData?.workPhone || '');
  const [mobilePhone, setMobilePhone] = useState(initialData?.mobilePhone || '');

  const [residentialTransportType, setResidentialTransportType] = useState<ResidentialTransportType | ''>(initialData?.residentialTransportType || '');
  const [residentialPlaceType, setResidentialPlaceType] = useState<ResidentialPlaceType | ''>(initialData?.residentialPlaceType || '');
  const [residentialElevatorStatus, setResidentialElevatorStatus] = useState<ResidentialElevatorStatus | ''>(initialData?.residentialElevatorStatus || '');
  const [residentialFloorLevel, setResidentialFloorLevel] = useState<ResidentialFloorLevel | ''>(initialData?.residentialFloorLevel || '');
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
  
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [availableTransportTypes, setAvailableTransportTypes] = useState<TransportTypeSetting[]>([]);

  const [availableOriginDistricts, setAvailableOriginDistricts] = useState<readonly string[]>([]);
  const [availableDestinationDistricts, setAvailableDestinationDistricts] = useState<readonly string[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const transportTypesFromDb = await getAllTransportTypes();
        setAvailableTransportTypes(
          transportTypesFromDb.filter(
            (type) => (type.applicableTo === 'Evden Eve' || type.applicableTo === 'Her İkisi de') && type.isActive
          )
        );
      } catch (error) {
        console.error("Error fetching transport types for residential form:", error);
        toast({ title: "Hata", description: "Taşımacılık türleri yüklenemedi.", variant: "destructive" });
      }
      setOptionsLoading(false);
    };
    fetchOptions();
  }, [toast]);

  useEffect(() => {
     if (isAuthenticated && user && !initialData) { 
      setCompanyName(user.name || '');
      if (user.role === 'company') {
        const companyUser = user as import('@/types').CompanyUserProfile;
        setContactPerson(companyUser.contactFullName || '');
        setMobilePhone(companyUser.mobilePhone || '');
        setContactEmail(companyUser.email || '');
      } else {
        setContactPerson(user.name || '');
        setContactEmail(user.email || '');
      }
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
    if (!isAuthenticated || !user) {
      toast({ title: "Giriş Gerekli", description: "İlan vermek için lütfen giriş yapın.", variant: "destructive" });
      return;
    }
    if (!companyName || !contactPerson || !mobilePhone || !residentialTransportType || !residentialPlaceType || !residentialElevatorStatus || !residentialFloorLevel || !originCity || !destinationCity || !loadingDate || !description ) {
       toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu (*) alanları doldurun.", variant: "destructive" });
       return;
    }

    setFormSubmitting(true);

    const newFreightData: Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId'> = {
      postedBy: user.name,
      freightType: 'Evden Eve',
      companyName,
      contactPerson,
      contactEmail: contactEmail || undefined,
      workPhone: workPhone || undefined,
      mobilePhone,
      residentialTransportType: residentialTransportType as ResidentialTransportType,
      residentialPlaceType: residentialPlaceType as ResidentialPlaceType,
      residentialElevatorStatus: residentialElevatorStatus as ResidentialElevatorStatus,
      residentialFloorLevel: residentialFloorLevel as ResidentialFloorLevel,
      description,
      originCountry,
      originCity,
      originDistrict: originCountry === 'TR' ? originDistrict || undefined : undefined,
      destinationCountry,
      destinationCity,
      destinationDistrict: destinationCountry === 'TR' ? destinationDistrict || undefined : undefined,
      loadingDate: format(loadingDate, "yyyy-MM-dd"),
      isActive: true,
    };
    
    try {
      await onSubmitSuccess(newFreightData);
    } catch (error) {
      console.error("Error in onSubmitSuccess for residential freight:", error);
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
          <SelectTrigger id={`res-${type}CityTR`}><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
          <SelectContent>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return <Input id={`res-${type}CityOther`} placeholder="Şehir (Elle Giriş)" value={city as string} onChange={(e) => setCity(e.target.value)} />;
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
          <SelectTrigger id={`res-${type}DistrictTR`}><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
          <SelectContent>{availableDistrictsForInput.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity) && availableDistrictsForInput.length === 0) {
      return <Input id={`res-${type}DistrictOtherTR`} placeholder="İlçe (Elle Giriş)" value={district} onChange={(e) => setDistrict(e.target.value)} />;
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
          <CardDescription>Taşıma yapacak firma/kişi ve yetkili iletişim bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-companyName">Firma Adı / Ad Soyad (*)</Label>
              <Input id="res-companyName" placeholder="Evden Eve Nakliyat Ltd. veya Ad Soyad" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-contactPerson">Yetkili Kişi (*)</Label>
              <Input id="res-contactPerson" placeholder="Ayşe Demir" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-contactEmail">E-Posta</Label>
              <Input id="res-contactEmail" type="email" placeholder="iletisim@firma.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-workPhone">İş Telefonu</Label>
              <Input id="res-workPhone" placeholder="0216 XXX XX XX" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-mobilePhone">Cep Telefonu (*)</Label>
              <Input id="res-mobilePhone" placeholder="0555 XXX XX XX" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Home size={20}/> Taşıma Detayları</CardTitle>
          <CardDescription>Evden eve nakliyatın özellikleri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-residentialTransportType">Taşımacılık Türü (*)</Label>
              <Select value={residentialTransportType} onValueChange={(value) => setResidentialTransportType(value as ResidentialTransportType)} required disabled={optionsLoading}>
                <SelectTrigger id="res-residentialTransportType"><SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Taşımacılık türü seçin..."} /></SelectTrigger>
                <SelectContent>
                  {availableTransportTypes.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-residentialPlaceType">Nakliyesi Yapılacak Yer (*)</Label>
              <Select value={residentialPlaceType} onValueChange={(value) => setResidentialPlaceType(value as ResidentialPlaceType)} required>
                <SelectTrigger id="res-residentialPlaceType"><SelectValue placeholder="Yer tipi seçin..." /></SelectTrigger>
                <SelectContent>{RESIDENTIAL_PLACE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-residentialElevatorStatus">Asansör Durumu (*)</Label>
              <Select value={residentialElevatorStatus} onValueChange={(value) => setResidentialElevatorStatus(value as ResidentialElevatorStatus)} required>
                <SelectTrigger id="res-residentialElevatorStatus"><SelectValue placeholder="Asansör durumu seçin..." /></SelectTrigger>
                <SelectContent>{RESIDENTIAL_ELEVATOR_STATUSES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-residentialFloorLevel">Eşyanın Bulunduğu Kat (*)</Label>
              <Select value={residentialFloorLevel} onValueChange={(value) => setResidentialFloorLevel(value as ResidentialFloorLevel)} required>
                <SelectTrigger id="res-residentialFloorLevel"><SelectValue placeholder="Kat seçin..." /></SelectTrigger>
                <SelectContent>{RESIDENTIAL_FLOOR_LEVELS.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><MapPin size={20}/> Güzergah ve Tarih</CardTitle>
          <CardDescription>Eşyanın alınacağı, teslim edileceği yerler ve taşıma tarihi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 p-4 border rounded-md bg-muted/10">
              <h4 className="font-medium">Yükleneceği Yer (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="res-originCountry">Ülke</Label>
                <Select value={originCountry} onValueChange={(value) => { setOriginCountry(value); setOriginCity(''); setOriginDistrict(''); }}>
                  <SelectTrigger id="res-originCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-originCityTR">Şehir (*)</Label>
                {renderCityInput(originCountry, originCity, setOriginCity, 'origin')}
              </div>
              {originCountry === 'TR' && (
                <div className="space-y-1.5">
                  <Label htmlFor="res-originDistrictTR">İlçe</Label>
                  {renderDistrictInput(originCountry, originCity, originDistrict, setOriginDistrict, availableOriginDistricts, 'origin')}
                </div>
              )}
            </div>

            <div className="space-y-3 p-4 border rounded-md bg-muted/10">
              <h4 className="font-medium">İstikamet (Varış Yeri) (*)</h4>
              <div className="space-y-1.5">
                <Label htmlFor="res-destinationCountry">Ülke</Label>
                <Select value={destinationCountry} onValueChange={(value) => { setDestinationCountry(value); setDestinationCity(''); setDestinationDistrict(''); }}>
                  <SelectTrigger id="res-destinationCountry"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-destinationCityTR">Şehir (*)</Label>
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
          
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="res-loadingDate">Taşıma Tarihi (*)</Label>
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
                <Label htmlFor="res-description">Taşınma ile İlgili Ek Bilgiler (*)</Label>
                <Textarea id="res-description" placeholder="Eşya miktarı (örn: 2+1 ev), özel eşyalar, paketleme ihtiyacı, sigorta talebi gibi detayları giriniz." value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
            </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3 font-semibold flex items-center justify-center gap-2" disabled={formSubmitting || !isAuthenticated || optionsLoading}>
        {formSubmitting || optionsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send size={20} />}
        {formSubmitting ? 'İlan Yayınlanıyor...' : (optionsLoading ? 'Seçenekler Yükleniyor...' : 'Evden Eve İlanı Yayınla')}
      </Button>
      {!isAuthenticated && <p className="text-sm text-destructive text-center mt-2">İlan yayınlamak için giriş yapmalısınız.</p>}
    </form>
  );
}

