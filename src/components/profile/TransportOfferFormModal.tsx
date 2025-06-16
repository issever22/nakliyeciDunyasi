
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type CountryCode, type TurkishCity } from '@/lib/locationData';
import type { TransportOffer, TransportOfferCreationData, TransportOfferUpdateData, VehicleTypeSetting } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Route, Truck, Edit, CalendarIcon, Loader2, FileText, DollarSign, Euro, CircleDollarSign } from 'lucide-react';
import { addTransportOffer, updateTransportOffer } from '@/services/transportOffersService';

interface TransportOfferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  companyName: string;
  initialData?: TransportOffer | null;
  vehicleTypeOptions: VehicleTypeSetting[];
  optionsLoading: boolean;
  onSubmitSuccess: () => void;
}

export default function TransportOfferFormModal({
  isOpen,
  onClose,
  userId,
  companyName,
  initialData,
  vehicleTypeOptions,
  optionsLoading,
  onSubmitSuccess
}: TransportOfferFormModalProps) {
  const { toast } = useToast();
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form State
  const [originCountry, setOriginCountry] = useState<CountryCode | string>('TR');
  const [originCity, setOriginCity] = useState<TurkishCity | string>('');
  const [originDistrict, setOriginDistrict] = useState('');
  const [destinationCountry, setDestinationCountry] = useState<CountryCode | string>('TR');
  const [destinationCity, setDestinationCity] = useState<TurkishCity | string>('');
  const [destinationDistrict, setDestinationDistrict] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [priceTRY, setPriceTRY] = useState<string>('');
  const [priceUSD, setPriceUSD] = useState<string>('');
  const [priceEUR, setPriceEUR] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [availableOriginDistricts, setAvailableOriginDistricts] = useState<readonly string[]>([]);
  const [availableDestinationDistricts, setAvailableDestinationDistricts] = useState<readonly string[]>([]);

  useEffect(() => {
    if (initialData) {
      setOriginCountry(initialData.originCountry);
      setOriginCity(initialData.originCity);
      setOriginDistrict(initialData.originDistrict || '');
      setDestinationCountry(initialData.destinationCountry);
      setDestinationCity(initialData.destinationCity);
      setDestinationDistrict(initialData.destinationDistrict || '');
      setVehicleType(initialData.vehicleType);
      setDistanceKm(initialData.distanceKm.toString());
      setPriceTRY(initialData.priceTRY?.toString() || '');
      setPriceUSD(initialData.priceUSD?.toString() || '');
      setPriceEUR(initialData.priceEUR?.toString() || '');
      setNotes(initialData.notes || '');
      setIsActive(initialData.isActive);
    } else {
      // Reset form for new offer
      setOriginCountry('TR');
      setOriginCity('');
      setOriginDistrict('');
      setDestinationCountry('TR');
      setDestinationCity('');
      setDestinationDistrict('');
      setVehicleType('');
      setDistanceKm('');
      setPriceTRY('');
      setPriceUSD('');
      setPriceEUR('');
      setNotes('');
      setIsActive(true);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    let newDistricts: readonly string[] = [];
    if (originCountry === 'TR' && TURKISH_CITIES.includes(originCity as TurkishCity)) {
      newDistricts = DISTRICTS_BY_CITY_TR[originCity as TurkishCity] || [];
    }
    setAvailableOriginDistricts(newDistricts);
    if (!newDistricts.includes(originDistrict)) setOriginDistrict('');
  }, [originCity, originCountry, originDistrict]);

  useEffect(() => {
    let newDistricts: readonly string[] = [];
    if (destinationCountry === 'TR' && TURKISH_CITIES.includes(destinationCity as TurkishCity)) {
      newDistricts = DISTRICTS_BY_CITY_TR[destinationCity as TurkishCity] || [];
    }
    setAvailableDestinationDistricts(newDistricts);
    if (!newDistricts.includes(destinationDistrict)) setDestinationDistrict('');
  }, [destinationCity, destinationCountry, destinationDistrict]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!originCity || !destinationCity || !vehicleType || !distanceKm ) {
      toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu (*) alanları doldurun.", variant: "destructive" });
      return;
    }
    if (!priceTRY && !priceUSD && !priceEUR) {
      toast({ title: "Eksik Fiyat", description: "Lütfen en az bir para biriminde fiyat belirtin.", variant: "destructive" });
      return;
    }

    setFormSubmitting(true);

    const offerPayload: TransportOfferCreationData = {
      originCountry,
      originCity,
      originDistrict: originCountry === 'TR' ? originDistrict || undefined : undefined,
      destinationCountry,
      destinationCity,
      destinationDistrict: destinationCountry === 'TR' ? destinationDistrict || undefined : undefined,
      vehicleType,
      distanceKm: parseFloat(distanceKm) || 0,
      priceTRY: priceTRY ? parseFloat(priceTRY) : undefined,
      priceUSD: priceUSD ? parseFloat(priceUSD) : undefined,
      priceEUR: priceEUR ? parseFloat(priceEUR) : undefined,
      notes: notes || undefined,
      isActive,
    };

    try {
      let success = false;
      if (initialData && initialData.id) {
        success = await updateTransportOffer(initialData.id, offerPayload as TransportOfferUpdateData);
        if (success) toast({ title: "Başarılı", description: "Fiyat teklifi güncellendi." });
      } else {
        const newOfferId = await addTransportOffer(userId, companyName, offerPayload);
        if (newOfferId) {
          success = true;
          toast({ title: "Başarılı", description: "Yeni fiyat teklifi eklendi." });
        }
      }

      if (success) {
        onSubmitSuccess();
      } else {
        throw new Error(`Fiyat teklifi ${initialData ? 'güncellenemedi' : 'eklenemedi'}.`);
      }
    } catch (error: any) {
      console.error("Error submitting transport offer:", error);
      toast({ title: "Hata", description: error.message || "Bir sorun oluştu.", variant: "destructive" });
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
          <SelectTrigger id={`offer-${type}CityTR`}><SelectValue placeholder="Şehir seçin..." /></SelectTrigger>
          <SelectContent>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    return <Input id={`offer-${type}CityOther`} placeholder="Şehir (Elle Giriş)" value={city as string} onChange={(e) => setCity(e.target.value)} />;
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
          <SelectTrigger id={`offer-${type}DistrictTR`}><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
          <SelectContent>{availableDistrictsForInput.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    if (country === 'TR' && city && TURKISH_CITIES.includes(city as TurkishCity) && availableDistrictsForInput.length === 0) {
        return <Input id={`offer-${type}DistrictOtherTR`} placeholder="İlçe (Elle Giriş)" value={district} onChange={(e) => setDistrict(e.target.value)} />;
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl">{initialData ? 'Fiyat Teklifini Düzenle' : 'Yeni Fiyat Teklifi Ekle'}</DialogTitle>
            <DialogDescription>
              {initialData ? 'Mevcut fiyat teklifinin detaylarını güncelleyin.' : 'Yeni bir nakliye fiyat teklifi için bilgileri girin.'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 grid gap-6">
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30"><CardTitle className="text-base flex items-center gap-2"><MapPin size={18}/> Aracın Bulunduğu Yer (*)</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offer-originCountry">Ülke</Label>
                  <Select value={originCountry} onValueChange={(v) => { setOriginCountry(v as CountryCode); setOriginCity(''); setOriginDistrict(''); }}>
                    <SelectTrigger id="offer-originCountry"><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="offer-originCityTR">Şehir (*)</Label>
                  {renderCityInput(originCountry, originCity, setOriginCity, 'origin')}
                </div>
                {originCountry === 'TR' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="offer-originDistrictTR">İlçe</Label>
                    {renderDistrictInput(originCountry, originCity, originDistrict, setOriginDistrict, availableOriginDistricts, 'origin')}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30"><CardTitle className="text-base flex items-center gap-2"><Route size={18}/> Aracın İstikameti (*)</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offer-destinationCountry">Ülke</Label>
                  <Select value={destinationCountry} onValueChange={(v) => { setDestinationCountry(v as CountryCode); setDestinationCity(''); setDestinationDistrict(''); }}>
                    <SelectTrigger id="offer-destinationCountry"><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="offer-destinationCityTR">Şehir (*)</Label>
                  {renderCityInput(destinationCountry, destinationCity, setDestinationCity, 'destination')}
                </div>
                {destinationCountry === 'TR' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="offer-destinationDistrictTR">İlçe</Label>
                    {renderDistrictInput(destinationCountry, destinationCity, destinationDistrict, setDestinationDistrict, availableDestinationDistricts, 'destination')}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30"><CardTitle className="text-base flex items-center gap-2"><Truck size={18}/> Araç ve Mesafe Bilgileri</CardTitle></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offer-vehicleType">Araç Tipi (*)</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType} required disabled={optionsLoading}>
                    <SelectTrigger id="offer-vehicleType"><SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Araç tipi seçin..."} /></SelectTrigger>
                    <SelectContent>
                      {vehicleTypeOptions.map(type => <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="offer-distanceKm">Mesafe (km) (*)</Label>
                  <Input id="offer-distanceKm" type="number" placeholder="Örn: 550" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} required />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30"><CardTitle className="text-base flex items-center gap-2"><CircleDollarSign size={18}/> Fiyat Bilgisi (* en az biri)</CardTitle></CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offer-priceTRY">TL (Türk Lirası)</Label>
                  <Input id="offer-priceTRY" type="number" placeholder="0.00" value={priceTRY} onChange={(e) => setPriceTRY(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="offer-priceUSD">USD (Dolar)</Label>
                  <Input id="offer-priceUSD" type="number" placeholder="0.00" value={priceUSD} onChange={(e) => setPriceUSD(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="offer-priceEUR">EUR (Euro)</Label>
                  <Input id="offer-priceEUR" type="number" placeholder="0.00" value={priceEUR} onChange={(e) => setPriceEUR(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-1.5">
              <Label htmlFor="offer-notes" className="flex items-center gap-1"><FileText size={16}/>Ek Notlar (Opsiyonel)</Label>
              <Textarea id="offer-notes" placeholder="Fiyat teklifiyle ilgili ek bilgiler, geçerlilik süresi vb." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}/>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="offer-isActive" checked={isActive} onCheckedChange={setIsActive} />
              <Label htmlFor="offer-isActive" className="font-medium cursor-pointer">Bu fiyat teklifi aktif mi?</Label>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 border-t sticky bottom-0 bg-background">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={formSubmitting || optionsLoading}>İptal</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={formSubmitting || optionsLoading}>
              {(formSubmitting || optionsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? 'Değişiklikleri Kaydet' : 'Fiyat Teklifi Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
