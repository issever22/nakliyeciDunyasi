
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type TurkishCity, type CountryCode } from '@/lib/locationData';
import { COMPANY_TYPES, WORKING_METHODS, WORKING_ROUTES } from '@/lib/constants';
import type { CompanyUserProfile, CompanyUserType, WorkingMethodType, WorkingRouteType } from '@/types';
import { UploadCloud, User, Building, Lock, Mail, Phone, Smartphone, Globe, Link as LinkIconLucide, Info, MapPin, CheckSquare, Briefcase } from 'lucide-react';
import Link from 'next/link';

const CLEAR_SELECTION_VALUE = "__CLEAR_SELECTION__";

export default function CompanyRegisterForm() {
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [logoUrl, setLogoUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyTitle, setCompanyTitle] = useState('');
  const [contactFullName, setContactFullName] = useState('');
  const [workPhone, setWorkPhone] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [fax, setFax] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyType, setCompanyType] = useState<CompanyUserType | ''>('');
  const [addressCity, setAddressCity] = useState<TurkishCity | string>('');
  const [addressDistrict, setAddressDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<readonly string[]>([]);
  const [fullAddress, setFullAddress] = useState('');
  const [workingMethods, setWorkingMethods] = useState<WorkingMethodType[]>([]);
  const [workingRoutes, setWorkingRoutes] = useState<WorkingRouteType[]>([]);
  
  const MAX_PREFERRED_LOCATIONS = 5;
  const [preferredCities, setPreferredCities] = useState<(TurkishCity | string)[]>(Array(MAX_PREFERRED_LOCATIONS).fill(''));
  const [preferredCountries, setPreferredCountries] = useState<(CountryCode | string)[]>(Array(MAX_PREFERRED_LOCATIONS).fill(''));
  
  const [agreement, setAgreement] = useState(false);

  useEffect(() => {
    if (TURKISH_CITIES.includes(addressCity as TurkishCity)) {
      setAvailableDistricts(DISTRICTS_BY_CITY_TR[addressCity as TurkishCity] || []);
    } else {
      setAvailableDistricts([]);
    }
    setAddressDistrict('');
  }, [addressCity]); // Initial setup for districts on addressCity change

  const handleAddressCityChange = (city: TurkishCity | string) => {
    setAddressCity(city);
    if (TURKISH_CITIES.includes(city as TurkishCity)) {
      setAvailableDistricts(DISTRICTS_BY_CITY_TR[city as TurkishCity] || []);
    } else {
      setAvailableDistricts([]);
    }
    setAddressDistrict('');
  };

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


  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Hata", description: "Şifreler eşleşmiyor.", variant: "destructive" });
      return;
    }
    if (!agreement) {
      toast({ title: "Hata", description: "Lütfen üyelik sözleşmesini onaylayın.", variant: "destructive" });
      return;
    }
    // Add more validations as needed

    setIsLoading(true);
    try {
      const registrationData: Omit<CompanyUserProfile, 'id' | 'role' | 'name'> & { role: 'company', password?: string } = {
        role: 'company',
        username,
        password, 
        logoUrl: logoUrl || undefined,
        companyTitle, // This will be used as 'name' in UserProfile by authService
        contactFullName,
        workPhone: workPhone || undefined,
        mobilePhone,
        fax: fax || undefined,
        email,
        website: website || undefined,
        companyDescription: companyDescription || undefined,
        companyType: companyType as CompanyUserType, // Assuming validation ensures it's set
        addressCity,
        addressDistrict: addressDistrict || undefined,
        fullAddress,
        workingMethods: workingMethods as WorkingMethodType[],
        workingRoutes: workingRoutes as WorkingRouteType[],
        preferredCities: preferredCities.filter(c => c !== ''),
        preferredCountries: preferredCountries.filter(c => c !== ''),
      };

      const user = await register(registrationData);
      if (user) {
        toast({
          title: "Firma Kaydı Başarılı",
          description: `Firma hesabınız oluşturuldu: ${user.name}!`,
        });
      } else {
        toast({
          title: "Kayıt Başarısız",
          description: "Lütfen bilgilerinizi kontrol edin ve tekrar deneyin.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Company registration error:", error);
      toast({
        title: "Hata",
        description: "Kayıt sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Temel Bilgiler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building size={20}/> Firma Temel Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-logoUrl">Logo URL'si (Opsiyonel)</Label>
            <div className="relative"> <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="company-logoUrl" placeholder="https://ornek.com/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="pl-10"/>
            </div>
            <p className="text-xs text-muted-foreground">Şimdilik logo için bir resim URL'si girin. Dosya yükleme özelliği eklenecektir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-username">Kullanıcı Adı (*)</Label>
              <div className="relative"> <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-username" value={username} onChange={(e) => setUsername(e.target.value)} required className="pl-10"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-companyTitle">Firma Ünvanı (*)</Label>
              <div className="relative"> <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-companyTitle" value={companyTitle} onChange={(e) => setCompanyTitle(e.target.value)} required className="pl-10"/>
            </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-password">Şifre (*)</Label>
               <div className="relative"> <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10"/>
            </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-confirmPassword">Şifre Tekrar (*)</Label>
              <div className="relative"> <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pl-10"/>
            </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-contactFullName">Yetkili Adı Soyadı (*)</Label>
            <div className="relative"> <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="company-contactFullName" value={contactFullName} onChange={(e) => setContactFullName(e.target.value)} required className="pl-10"/>
          </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-workPhone">İş Telefonu</Label>
               <div className="relative"> <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-workPhone" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} className="pl-10"/>
            </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-mobilePhone">Cep Telefonu (*)</Label>
               <div className="relative"> <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-mobilePhone" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} required className="pl-10"/>
            </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-fax">Fax</Label>
              <Input id="company-fax" value={fax} onChange={(e) => setFax(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-email">E-Posta (*)</Label>
               <div className="relative"> <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10"/>
            </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Web Sitesi</Label>
               <div className="relative"> <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-website" value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-10"/>
            </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-companyDescription">Firma Tanıtım Yazısı</Label>
            <Textarea id="company-companyDescription" value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Firma Türü ve Adres Bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle  className="flex items-center gap-2"><Info size={20}/> Firma Detayları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Firma Türü (*)</Label>
            <RadioGroup value={companyType} onValueChange={(value) => setCompanyType(value as CompanyUserType)} className="flex gap-4">
              {COMPANY_TYPES.map(type => (
                <div key={type.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={type.value} id={`company-type-${type.value}`} />
                  <Label htmlFor={`company-type-${type.value}`}>{type.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <CardTitle className="text-lg pt-2 flex items-center gap-2"><MapPin size={18}/> Adres Bilgileri</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-addressCity">Adres İl (*)</Label>
              <Select value={addressCity} onValueChange={handleAddressCityChange}>
                <SelectTrigger id="company-addressCity"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                <SelectContent>{TURKISH_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-addressDistrict">Adres İlçe</Label>
              <Select value={addressDistrict} onValueChange={setAddressDistrict} disabled={!availableDistricts.length}>
                <SelectTrigger id="company-addressDistrict"><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                <SelectContent>{availableDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-fullAddress">Açık Adres (*)</Label>
            <Textarea id="company-fullAddress" value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} required />
          </div>
        </CardContent>
      </Card>

      {/* Çalışma Şekli ve Yolu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase size={20}/> Çalışma Alanları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold">Çalışma Şekli (Birden fazla seçilebilir)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mt-2">
              {WORKING_METHODS.map(method => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`working-method-${method.id}`} 
                    checked={workingMethods.includes(method.id as WorkingMethodType)} 
                    onCheckedChange={() => handleMultiCheckboxChange(method.id, workingMethods, setWorkingMethods as React.Dispatch<React.SetStateAction<string[]>>)}
                  />
                  <Label htmlFor={`working-method-${method.id}`} className="font-normal">{method.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label className="font-semibold">Çalışma Yolu (Birden fazla seçilebilir)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2">
              {WORKING_ROUTES.map(route => (
                <div key={route.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`working-route-${route.id}`} 
                    checked={workingRoutes.includes(route.id as WorkingRouteType)}
                    onCheckedChange={() => handleMultiCheckboxChange(route.id, workingRoutes, setWorkingRoutes as React.Dispatch<React.SetStateAction<string[]>>)}
                  />
                  <Label htmlFor={`working-route-${route.id}`} className="font-normal">{route.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* En İyi Çalıştığı İller ve Ülkeler */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe size={20}/> Uzmanlık Alanları</CardTitle>
          <CardDescription>En sık çalıştığınız lokasyonları belirtin (Opsiyonel, en fazla 5 adet).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-semibold mb-2 block">En İyi Çalıştığı İller (Türkiye)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, index) => (
              <div key={`city-${index}`} className="space-y-1">
                <Label htmlFor={`preferred-city-${index}`} className="text-xs">Şehir {index + 1}</Label>
                <Select value={preferredCities[index]} onValueChange={(val) => handlePreferredLocationChange(index, val, 'city')}>
                  <SelectTrigger id={`preferred-city-${index}`}><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>
                    {TURKISH_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            </div>
          </div>
           <div>
            <Label className="font-semibold mb-2 block">En İyi Çalıştığı Ülkeler</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, index) => (
              <div key={`country-${index}`} className="space-y-1">
                <Label htmlFor={`preferred-country-${index}`} className="text-xs">Ülke {index + 1}</Label>
                <Select value={preferredCountries[index]} onValueChange={(val) => handlePreferredLocationChange(index, val, 'country')}>
                  <SelectTrigger id={`preferred-country-${index}`}><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>
                    {COUNTRIES.map(country => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sözleşme Onayı */}
      <div className="space-y-2 flex items-start space-x-2 pt-4">
         <Checkbox id="company-agreement" checked={agreement} onCheckedChange={(checked) => setAgreement(Boolean(checked))} className="mt-1"/>
        <Label htmlFor="company-agreement" className="font-normal leading-snug">
          <Link href="/uyelik-sozlesmesi" target="_blank" className="text-primary hover:underline">Üyelik Sözleşmesini</Link> Okudum ve Onaylıyorum. (*)
        </Label>
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isLoading}>
        {isLoading ? 'Firma Kaydı Yapılıyor...' : 'Firma Olarak Kayıt Ol'}
      </Button>
    </form>
  );
}

    