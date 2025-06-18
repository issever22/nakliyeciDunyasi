
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
import { COMPANY_TYPES, WORKING_METHODS, WORKING_ROUTES, COMPANY_CATEGORIES } from '@/lib/constants';
import type { CompanyUserType, WorkingMethodType, WorkingRouteType, CompanyRegisterData, CompanyCategory } from '@/types';
import { UploadCloud, User, Building, Lock, Mail, Phone, Smartphone, Globe, Info, MapPin, CheckSquare, Briefcase, Link as LinkIcon, Loader2, List } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CLEAR_SELECTION_VALUE = "__CLEAR_SELECTION__";

export default function CompanyRegisterForm() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyTitle, setCompanyTitle] = useState(''); // This will be 'name' in RegisterData
  const [category, setCategory] = useState<CompanyCategory | ''>('');
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
  }, [addressCity]);

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
    if (!companyType) {
      toast({ title: "Hata", description: "Lütfen Firma Türü seçin.", variant: "destructive" });
      return;
    }
    if (!category) {
      toast({ title: "Hata", description: "Lütfen Firma Kategorisi seçin.", variant: "destructive" });
      return;
    }
    if (!username || !companyTitle || !contactFullName || !mobilePhone || !email || !addressCity || !fullAddress || !password) {
       toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu alanları (*) doldurun.", variant: "destructive" });
       return;
    }

    setIsLoading(true);
    try {
      const registrationData: CompanyRegisterData = {
        role: 'company',
        email,
        password, 
        name: companyTitle, // Company Title goes into 'name' field for BaseRegisterData
        username,
        category: category as CompanyCategory,
        logoUrl: logoUrl || undefined,
        contactFullName,
        workPhone: workPhone || undefined,
        mobilePhone,
        fax: fax || undefined,
        website: website || undefined,
        companyDescription: companyDescription || undefined,
        companyType: companyType as CompanyUserType,
        addressCity,
        addressDistrict: addressDistrict || undefined,
        fullAddress,
        workingMethods: workingMethods as WorkingMethodType[],
        workingRoutes: workingRoutes as WorkingRouteType[],
        preferredCities: preferredCities.filter(c => c !== ''),
        preferredCountries: preferredCountries.filter(c => c !== ''),
      };

      const userProfile = await register(registrationData);
      if (userProfile) {
        toast({
          title: "Firma Kaydı Başarılı",
          description: `Firma hesabınız oluşturuldu: ${userProfile.name}! Onay sonrası aktif olacaktır. Ana sayfaya yönlendiriliyorsunuz...`,
        });
        router.push('/');
      } else {
        // This case should ideally be handled by errors thrown from the register function
        toast({
          title: "Kayıt Başarısız",
          description: "Lütfen bilgilerinizi kontrol edin ve tekrar deneyin.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Company registration form error:", error);
      let description = "Kayıt sırasında bir hata oluştu.";
      if (error.code) { // Firebase error codes
        switch (error.code) {
          case 'auth/email-already-in-use':
            description = "Bu e-posta adresi zaten kayıtlı.";
            break;
          case 'auth/weak-password':
            description = "Şifre yeterince güçlü değil. En az 6 karakter olmalıdır.";
            break;
          case 'auth/invalid-email':
            description = "Geçersiz e-posta formatı.";
            break;
          default:
             description = error.message || "Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        }
      } else if (error.message) {
        description = error.message;
      }
      toast({
        title: "Kayıt Hatası",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Building size={22}/> Firma Temel Bilgileri</CardTitle>
          <CardDescription>Firma ve yetkili iletişim bilgilerinizi girin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-logoUrl">Logo URL'si (Opsiyonel)</Label>
            <div className="relative">
              <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-logoUrl" placeholder="https://ornek.com/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="pl-10"/>
            </div>
            <p className="text-xs text-muted-foreground">Şimdilik logo için bir resim URL'si girin. Dosya yükleme özelliği eklenecektir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-username">Kullanıcı Adı (*)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="company-username" value={username} onChange={(e) => setUsername(e.target.value)} required className="pl-10" autoComplete="username"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-companyTitle">Firma Ünvanı (*)</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="company-companyTitle" value={companyTitle} onChange={(e) => setCompanyTitle(e.target.value)} required className="pl-10"/>
            </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-password">Şifre (*)</Label>
               <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="company-password" type="password" placeholder="•••••••• (En az 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10" autoComplete="new-password"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-confirmPassword">Şifre Tekrar (*)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="company-confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pl-10" autoComplete="new-password"/>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-contactFullName">Yetkili Adı Soyadı (*)</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input id="company-contactFullName" value={contactFullName} onChange={(e) => setContactFullName(e.target.value)} required className="pl-10" autoComplete="name"/>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-workPhone">İş Telefonu</Label>
               <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="company-workPhone" placeholder="0212XXXXXXX" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} className="pl-10" autoComplete="tel-national"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-mobilePhone">Cep Telefonu (*)</Label>
               <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="company-mobilePhone" placeholder="05XXXXXXXXX" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} required className="pl-10" autoComplete="tel"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-fax">Fax</Label>
              <Input id="company-fax" placeholder="0212XXXXXXX" value={fax} onChange={(e) => setFax(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-email">E-Posta (*)</Label>
               <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="company-email" type="email" placeholder="info@firma.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" autoComplete="email"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Web Sitesi</Label>
               <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="company-website" placeholder="www.firma.com" value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-10" autoComplete="url"/>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-companyDescription">Firma Tanıtım Yazısı (Opsiyonel)</Label>
            <Textarea id="company-companyDescription" placeholder="Firmanız hakkında kısa bir tanıtım..." value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Info size={22}/> Firma Detayları</CardTitle>
          <CardDescription>Firmanızın türü, kategorisi ve adres bilgilerini belirtin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="font-medium">Firma Türü (*)</Label>
              <RadioGroup value={companyType} onValueChange={(value) => setCompanyType(value as CompanyUserType)} className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {COMPANY_TYPES.map(type => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={`company-type-${type.value}`} />
                    <Label htmlFor={`company-type-${type.value}`} className="font-normal cursor-pointer">{type.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-category" className="font-medium">Firma Kategorisi (*)</Label>
               <div className="relative">
                <List className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Select value={category} onValueChange={(value) => setCategory(value as CompanyCategory)} required>
                  <SelectTrigger id="company-category" className="pl-10"><SelectValue placeholder="Kategori seçin..." /></SelectTrigger>
                  <SelectContent>
                    {COMPANY_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
             <h3 className="font-medium text-md flex items-center gap-2"><MapPin size={18}/> Adres Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-addressCity">Adres İl (*)</Label>
                <Select value={addressCity} onValueChange={handleAddressCityChange} required>
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
              <Textarea id="company-fullAddress" placeholder="Mahalle, cadde, sokak, no, daire..." value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Briefcase size={22}/> Çalışma Alanları</CardTitle>
          <CardDescription>Firmanızın çalışma şekli ve uzmanlaştığı taşıma yolları.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-medium text-md">Çalışma Şekli (Birden fazla seçilebilir)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 mt-3">
              {WORKING_METHODS.map(method => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`working-method-${method.id}`} 
                    checked={workingMethods.includes(method.id as WorkingMethodType)} 
                    onCheckedChange={() => handleMultiCheckboxChange(method.id, workingMethods, setWorkingMethods as React.Dispatch<React.SetStateAction<string[]>>)}
                  />
                  <Label htmlFor={`working-method-${method.id}`} className="font-normal cursor-pointer">{method.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t pt-6">
            <Label className="font-medium text-md">Çalışma Yolu (Birden fazla seçilebilir)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 mt-3">
              {WORKING_ROUTES.map(route => (
                <div key={route.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`working-route-${route.id}`} 
                    checked={workingRoutes.includes(route.id as WorkingRouteType)}
                    onCheckedChange={() => handleMultiCheckboxChange(route.id, workingRoutes, setWorkingRoutes as React.Dispatch<React.SetStateAction<string[]>>)}
                  />
                  <Label htmlFor={`working-route-${route.id}`} className="font-normal cursor-pointer">{route.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Globe size={22}/> Uzmanlık Lokasyonları</CardTitle>
          <CardDescription>En sık çalıştığınız il ve ülkeleri belirtin (Opsiyonel, en fazla 5 adet).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="font-medium text-md mb-3 block">En İyi Çalıştığı İller (Türkiye)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, index) => (
              <div key={`city-${index}`} className="space-y-1.5">
                <Label htmlFor={`preferred-city-${index}`} className="text-xs text-muted-foreground">Şehir {index + 1}</Label>
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
           <div className="border-t pt-6">
            <Label className="font-medium text-md mb-3 block">En İyi Çalıştığı Ülkeler</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, index) => (
              <div key={`country-${index}`} className="space-y-1.5">
                <Label htmlFor={`preferred-country-${index}`} className="text-xs text-muted-foreground">Ülke {index + 1}</Label>
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

      <div className="flex items-start space-x-3 p-4 border rounded-md bg-muted/30 shadow-sm">
         <Checkbox id="company-agreement" checked={agreement} onCheckedChange={(checked) => setAgreement(Boolean(checked))} className="mt-1 flex-shrink-0"/>
        <Label htmlFor="company-agreement" className="font-normal leading-relaxed text-sm cursor-pointer">
          <Link href="/uyelik-sozlesmesi" target="_blank" className="text-primary hover:underline">Üyelik Sözleşmesini</Link> okudum, anladım ve tüm koşullarıyla kabul ediyorum. (*)
        </Label>
      </div>

      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3 font-semibold flex items-center gap-2" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Firma Kaydı Yapılıyor...' : <><CheckSquare size={20}/> Firma Olarak Kayıt Ol</>}
      </Button>
    </form>
  );
}
