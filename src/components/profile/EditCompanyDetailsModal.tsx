
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { CompanyUserProfile, CompanyUserType, WorkingMethodType, WorkingRouteType } from '@/types';
import { updateUserProfile } from '@/services/authService';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type TurkishCity, type CountryCode } from '@/lib/locationData';
import { COMPANY_TYPES, WORKING_METHODS, WORKING_ROUTES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';

const CLEAR_SELECTION_VALUE = "__CLEAR_SELECTION__";
const MAX_PREFERRED_LOCATIONS = 5;

interface EditCompanyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyUser: CompanyUserProfile;
  onProfileUpdate: (updatedProfile: CompanyUserProfile) => void;
}

export default function EditCompanyDetailsModal({ isOpen, onClose, companyUser, onProfileUpdate }: EditCompanyDetailsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [username, setUsername] = useState(companyUser.username);
  const [companyDescription, setCompanyDescription] = useState(companyUser.companyDescription || '');
  const [companyType, setCompanyType] = useState<CompanyUserType>(companyUser.companyType);
  
  const [addressCountry, setAddressCountry] = useState<CountryCode | string>(companyUser.addressCountry || 'TR');
  const [addressCity, setAddressCity] = useState<TurkishCity | string>(companyUser.addressCity);
  const [addressDistrict, setAddressDistrict] = useState(companyUser.addressDistrict || '');
  const [availableDistricts, setAvailableDistricts] = useState<readonly string[]>([]);
  const [fullAddress, setFullAddress] = useState(companyUser.fullAddress);

  const [workingMethods, setWorkingMethods] = useState<WorkingMethodType[]>(companyUser.workingMethods || []);
  const [workingRoutes, setWorkingRoutes] = useState<WorkingRouteType[]>(companyUser.workingRoutes || []);
  
  const [preferredCities, setPreferredCities] = useState<(TurkishCity | string)[]>(
    Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, i) => companyUser.preferredCities?.[i] || '')
  );
  const [preferredCountries, setPreferredCountries] = useState<(CountryCode | string)[]>(
     Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, i) => companyUser.preferredCountries?.[i] || '')
  );

  useEffect(() => {
    if (isOpen) {
      setUsername(companyUser.username);
      setCompanyDescription(companyUser.companyDescription || '');
      setCompanyType(companyUser.companyType);
      setAddressCountry(companyUser.addressCountry || 'TR');
      setAddressCity(companyUser.addressCity);
      setAddressDistrict(companyUser.addressDistrict || '');
      setFullAddress(companyUser.fullAddress);
      setWorkingMethods(companyUser.workingMethods || []);
      setWorkingRoutes(companyUser.workingRoutes || []);
      setPreferredCities(Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, i) => companyUser.preferredCities?.[i] || ''));
      setPreferredCountries(Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, i) => companyUser.preferredCountries?.[i] || ''));
    }
  }, [companyUser, isOpen]);

  useEffect(() => {
    if (addressCountry === 'TR' && TURKISH_CITIES.includes(addressCity as TurkishCity)) {
        setAvailableDistricts(DISTRICTS_BY_CITY_TR[addressCity as TurkishCity] || []);
    } else {
        setAvailableDistricts([]);
    }
    if (!availableDistricts.includes(addressDistrict)) {
      setAddressDistrict('');
    }
  }, [addressCity, addressCountry, availableDistricts, addressDistrict]);


  const handleMultiCheckboxChange = (
    value: string,
    currentValues: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(item => item !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  const handlePreferredLocationChange = (
    index: number,
    value: string,
    type: 'city' | 'country'
  ) => {
    const actualValue = value === CLEAR_SELECTION_VALUE ? '' : value;
    if (type === 'city') {
      const newCities = [...preferredCities];
      newCities[index] = actualValue as TurkishCity | string;
      setPreferredCities(newCities);
    } else {
      const newCountries = [...preferredCountries];
      newCountries[index] = actualValue as CountryCode | string;
      setPreferredCountries(newCountries);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!username || !addressCountry || !addressCity || !fullAddress || !companyType) {
        toast({title: "Hata", description: "Kullanıcı Adı, Adres Ülke/İl, Açık Adres ve Firma Türü zorunludur.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }

    const updateData: Partial<CompanyUserProfile> = {
      username,
      companyDescription: companyDescription || undefined,
      companyType,
      addressCountry,
      addressCity,
      addressDistrict: addressDistrict || undefined,
      fullAddress,
      workingMethods,
      workingRoutes,
      preferredCities: preferredCities.filter(c => c),
      preferredCountries: preferredCountries.filter(c => c),
    };

    try {
      const success = await updateUserProfile(companyUser.id, updateData);
      if (success) {
        toast({ title: "Başarılı", description: "Firma detayları güncellendi." });
        onProfileUpdate({ ...companyUser, ...updateData });
        onClose();
      } else {
        throw new Error("Firma detayları güncellenemedi.");
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Firma detayları güncellenirken bir sorun oluştu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Firma Detaylarını Düzenle</DialogTitle>
            <DialogDescription>
              Firmanızın operasyonel bilgilerini ve çalışma alanlarını güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-1.5">
                <Label htmlFor="edit-username">Kullanıcı Adı (Giriş için)</Label>
                <Input id="edit-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="edit-companyDescription">Firma Tanıtım Yazısı</Label>
                <Textarea id="edit-companyDescription" placeholder="Firmanız hakkında kısa bir tanıtım..." value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
                <Label className="font-medium">Firma Türü (*)</Label>
                <RadioGroup value={companyType} onValueChange={(value) => setCompanyType(value as CompanyUserType)} className="flex gap-4">
                    {COMPANY_TYPES.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={type.value} id={`edit-company-type-${type.value}`} />
                        <Label htmlFor={`edit-company-type-${type.value}`} className="font-normal">{type.label}</Label>
                    </div>
                    ))}
                </RadioGroup>
            </div>

            <h3 className="text-md font-semibold border-t pt-4">Adres Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-addressCountry">Adres Ülke (*)</Label>
                <Select value={addressCountry} onValueChange={(v) => { setAddressCountry(v); setAddressCity(''); setAddressDistrict(''); }} required>
                  <SelectTrigger id="edit-addressCountry"><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.filter(c => c.code !== 'OTHER').map(country => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                  <Label htmlFor="edit-addressCity">Adres İl (*)</Label>
                  <Select value={addressCity} onValueChange={(v) => setAddressCity(v as TurkishCity)} required disabled={addressCountry !== 'TR'}>
                  <SelectTrigger id="edit-addressCity"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                  <SelectContent>{TURKISH_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                  </Select>
                  {addressCountry !== 'TR' && <p className="text-xs text-muted-foreground">İl seçimi sadece Türkiye için geçerlidir.</p>}
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="edit-addressDistrict">Adres İlçe</Label>
                    <Select value={addressDistrict} onValueChange={setAddressDistrict} disabled={!availableDistricts.length}>
                    <SelectTrigger id="edit-addressDistrict"><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                    <SelectContent>{availableDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="edit-fullAddress">Açık Adres (*)</Label>
                    <Textarea id="edit-fullAddress" placeholder="Mahalle, cadde, sokak, no, daire..." value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} required />
                </div>
            </div>

            <h3 className="text-md font-semibold border-t pt-4">Çalışma Alanları</h3>
             <div>
                <Label className="font-medium text-sm mb-2 block">Çalışma Şekli</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                {WORKING_METHODS.map(method => (
                    <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`edit-working-method-${method.id}`}
                        checked={workingMethods.includes(method.id as WorkingMethodType)}
                        onCheckedChange={() => handleMultiCheckboxChange(method.id, workingMethods, setWorkingMethods as React.Dispatch<React.SetStateAction<string[]>>)}
                    />
                    <Label htmlFor={`edit-working-method-${method.id}`} className="font-normal text-sm">{method.label}</Label>
                    </div>
                ))}
                </div>
            </div>
            <div>
                <Label className="font-medium text-sm mb-2 block">Çalışma Yolu</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                {WORKING_ROUTES.map(route => (
                    <div key={route.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`edit-working-route-${route.id}`}
                        checked={workingRoutes.includes(route.id as WorkingRouteType)}
                        onCheckedChange={() => handleMultiCheckboxChange(route.id, workingRoutes, setWorkingRoutes as React.Dispatch<React.SetStateAction<string[]>>)}
                    />
                    <Label htmlFor={`edit-working-route-${route.id}`} className="font-normal text-sm">{route.label}</Label>
                    </div>
                ))}
                </div>
            </div>
            
            <h3 className="text-md font-semibold border-t pt-4">Uzmanlık Lokasyonları (En fazla {MAX_PREFERRED_LOCATIONS})</h3>
            <div>
                <Label className="font-medium text-sm mb-2 block">Tercih Edilen İller (Türkiye)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, index) => (
                <div key={`city-${index}`} className="space-y-1.5">
                    <Label htmlFor={`edit-preferred-city-${index}`} className="text-xs text-muted-foreground">Şehir {index + 1}</Label>
                    <Select value={preferredCities[index]} onValueChange={(val) => handlePreferredLocationChange(index, val, 'city')}>
                    <SelectTrigger id={`edit-preferred-city-${index}`}><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>
                        {TURKISH_CITIES.map(city => <SelectItem key={city} value={city} disabled={preferredCities.includes(city) && preferredCities[index] !== city}>{city}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
                ))}
                </div>
            </div>
            <div>
                <Label className="font-medium text-sm mb-2 block">Tercih Edilen Ülkeler</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, index) => (
                <div key={`country-${index}`} className="space-y-1.5">
                    <Label htmlFor={`edit-preferred-country-${index}`} className="text-xs text-muted-foreground">Ülke {index + 1}</Label>
                    <Select value={preferredCountries[index]} onValueChange={(val) => handlePreferredLocationChange(index, val, 'country')}>
                    <SelectTrigger id={`edit-preferred-country-${index}`}><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>
                        {COUNTRIES.map(country => <SelectItem key={country.code} value={country.code} disabled={preferredCountries.includes(country.code) && preferredCountries[index] !== country.code}>{country.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </div>
                ))}
                </div>
            </div>

          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>İptal</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
