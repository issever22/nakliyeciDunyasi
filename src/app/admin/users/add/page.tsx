"use client";

import { useState, type FormEvent, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCompanyUser as createCompanyUserServerAction } from '@/services/authService';
import { COMPANY_CATEGORIES, COMPANY_TYPES, WORKING_METHODS, WORKING_ROUTES } from '@/lib/constants';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR, type TurkishCity, type CountryCode } from '@/lib/locationData';
import type { CompanyCategory, CompanyRegisterData, CompanyUserType, WorkingMethodType, WorkingRouteType } from '@/types';
import { Loader2, PlusCircle, Building, CheckSquare, UploadCloud, User, Lock, Mail, Phone, Smartphone, Globe, Info, MapPin, Briefcase, Link as LinkIcon, List } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';


const CLEAR_SELECTION_VALUE = "__CLEAR_SELECTION__";
const MAX_PREFERRED_LOCATIONS = 5;

function AddCompanyForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<readonly string[]>([]);

  const [formData, setFormData] = useState<Partial<CompanyRegisterData>>({
    role: 'company',
    name: searchParams.get('companyName') || '',
    email: searchParams.get('email') || '',
    password: '',
    isActive: true,
    category: 'Nakliyeci',
    username: '',
    companyTitle: searchParams.get('companyName') || '',
    contactFullName: searchParams.get('name') || '',
    mobilePhone: searchParams.get('phone') || '',
    companyType: 'local',
    addressCountry: 'TR',
    addressCity: '',
    fullAddress: '',
    workingMethods: [],
    workingRoutes: [],
    preferredCities: Array(MAX_PREFERRED_LOCATIONS).fill(''),
    preferredCountries: Array(MAX_PREFERRED_LOCATIONS).fill(''),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'companyTitle') {
        setFormData(prev => ({ ...prev, companyTitle: value, name: value }));
    } else {
        setFormData(prev => ({ ...prev, [id]: value }));
    }
  };
  
  const handleSelectChange = (id: keyof CompanyRegisterData, value: string) => {
     setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, companyType: value as CompanyUserType }));
  };

  const handleMultiCheckboxChange = (
    value: string, 
    key: 'workingMethods' | 'workingRoutes'
  ) => {
    const currentValues = formData[key] || [];
    const newValues = currentValues.includes(value as never)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value as never];
    setFormData(prev => ({ ...prev, [key]: newValues }));
  };

  const handlePreferredLocationChange = (
    index: number, 
    value: string, 
    type: 'city' | 'country'
  ) => {
    const actualValue = value === CLEAR_SELECTION_VALUE ? '' : value;
    const key = type === 'city' ? 'preferredCities' : 'preferredCountries';
    const newLocations = [...(formData[key] || Array(MAX_PREFERRED_LOCATIONS).fill(''))];
    newLocations[index] = actualValue;
    setFormData(prev => ({...prev, [key]: newLocations}));
  };

  useEffect(() => {
    if (formData.addressCountry === 'TR') {
        const city = formData.addressCity;
        if (city && TURKISH_CITIES.includes(city as TurkishCity)) {
        setAvailableDistricts(DISTRICTS_BY_CITY_TR[city as TurkishCity] || []);
        } else {
        setAvailableDistricts([]);
        }
    } else {
        setAvailableDistricts([]);
        setFormData(prev => ({...prev, addressCity: ''}));
    }

    if (!availableDistricts.includes(formData.addressDistrict || '')) {
      setFormData(prev => ({ ...prev, addressDistrict: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.addressCity, formData.addressCountry]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormSubmitting(true);

    const requiredFields: (keyof CompanyRegisterData)[] = [
        'name', 'username', 'email', 'password', 'category', 'contactFullName', 'mobilePhone', 'companyType', 'addressCountry', 'addressCity', 'fullAddress'
    ];

    for (const field of requiredFields) {
        if (!formData[field]) {
            toast({ title: "Eksik Bilgi", description: `Lütfen zorunlu alanları (*) doldurun. Eksik alan: ${field}`, variant: "destructive" });
            setFormSubmitting(false);
            return;
        }
    }
    if (formData.password && formData.password.length < 6) {
        toast({ title: "Hata", description: "Şifre en az 6 karakter olmalıdır.", variant: "destructive" });
        setFormSubmitting(false);
        return;
    }

    try {
        const payload: CompanyRegisterData = {
            ...formData,
            name: formData.companyTitle || formData.name!,
            role: 'company',
            email: formData.email!,
            password: formData.password!,
            username: formData.username!,
            category: formData.category!,
            contactFullName: formData.contactFullName!,
            mobilePhone: formData.mobilePhone!,
            companyType: formData.companyType!,
            addressCountry: formData.addressCountry!,
            addressCity: formData.addressCity!,
            fullAddress: formData.fullAddress!,
            preferredCities: formData.preferredCities?.filter(c => c) || [],
            preferredCountries: formData.preferredCountries?.filter(c => c) || [],
        };
        const result = await createCompanyUserServerAction(payload);
        if (result.profile) {
            toast({ title: "Başarılı", description: `Firma "${result.profile.name}" başarıyla oluşturuldu.` });
            router.push('/admin/users');
        } else {
            toast({ title: "Hata", description: result.error || "Firma oluşturulurken bir hata oluştu.", variant: "destructive" });
        }
    } catch (error: any) {
        toast({ title: "Beklenmedik Hata", description: error.message || "Bir sorun oluştu.", variant: "destructive" });
    } finally {
        setFormSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-2xl flex items-center gap-2"><Building className="h-6 w-6 text-primary" /> Yeni Firma Ekle</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/admin/users">İptal</Link>
                </Button>
                <Button type="submit" disabled={formSubmitting} className="w-full sm:w-auto">
                    {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckSquare size={18} className="mr-2"/> Firmayı Kaydet
                </Button>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Giriş ve Temel Bilgiler</CardTitle>
                <CardDescription>Firmanın sisteme giriş yapacağı bilgiler ve temel profil detayları.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="logoUrl">Logo URL'si</Label>
                    <Input id="logoUrl" value={formData.logoUrl || ''} onChange={handleInputChange} placeholder="https://.../logo.png" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="companyTitle">Firma Adı (*)</Label>
                        <Input id="companyTitle" value={formData.companyTitle || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="username">Kullanıcı Adı (*)</Label>
                        <Input id="username" value={formData.username || ''} onChange={handleInputChange} required />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="email">E-posta Adresi (*)</Label>
                        <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="password">Şifre (*)</Label>
                        <Input id="password" type="password" value={formData.password || ''} onChange={handleInputChange} required placeholder="En az 6 karakter" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>İletişim ve Kategori</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="contactFullName">Yetkili Adı Soyadı (*)</Label>
                        <Input id="contactFullName" value={formData.contactFullName || ''} onChange={handleInputChange} required />
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="category">Firma Kategorisi (*)</Label>
                        <Select 
                            value={formData.category} 
                            onValueChange={(value) => handleSelectChange('category', value as CompanyCategory)}
                        >
                            <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {COMPANY_CATEGORIES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="mobilePhone">Cep Telefonu (*)</Label>
                        <Input id="mobilePhone" value={formData.mobilePhone || ''} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="workPhone">İş Telefonu</Label>
                        <Input id="workPhone" value={formData.workPhone || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="fax">Fax</Label>
                        <Input id="fax" value={formData.fax || ''} onChange={handleInputChange} />
                    </div>
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="website">Web Sitesi</Label>
                    <Input id="website" value={formData.website || ''} onChange={handleInputChange} />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Adres ve Firma Detayları</CardTitle>
            </CardHeader>
             <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="font-medium">Firma Türü (*)</Label>
                        <RadioGroup value={formData.companyType} onValueChange={handleRadioChange} className="flex gap-4">
                            {COMPANY_TYPES.map(type => (
                            <div key={type.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={type.value} id={`type-${type.value}`} />
                                <Label htmlFor={`type-${type.value}`} className="font-normal">{type.label}</Label>
                            </div>
                            ))}
                        </RadioGroup>
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="companyDescription">Firma Tanıtım Yazısı</Label>
                        <Textarea id="companyDescription" value={formData.companyDescription || ''} onChange={handleInputChange} rows={2} />
                    </div>
                </div>
                <div className="border-t pt-6 space-y-4">
                    <h3 className="font-medium text-md flex items-center gap-2"><MapPin size={18}/> Adres Bilgileri</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="addressCountry">Adres Ülke (*)</Label>
                            <Select value={formData.addressCountry} onValueChange={(v) => handleSelectChange('addressCountry', v)} required>
                                <SelectTrigger id="addressCountry"><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                                <SelectContent>{COUNTRIES.filter(c=>c.code !== 'OTHER').map(country => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="addressCity">Adres İl (*)</Label>
                            <Select value={formData.addressCity} onValueChange={(v) => handleSelectChange('addressCity', v)} required disabled={formData.addressCountry !== 'TR'}>
                                <SelectTrigger id="addressCity"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                                <SelectContent>{TURKISH_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="addressDistrict">Adres İlçe</Label>
                            <Select value={formData.addressDistrict} onValueChange={(v) => handleSelectChange('addressDistrict', v)} disabled={!availableDistricts.length}>
                                <SelectTrigger id="addressDistrict"><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                                <SelectContent>{availableDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullAddress">Açık Adres (*)</Label>
                            <Textarea id="fullAddress" placeholder="Mahalle, cadde, sokak, no, daire..." value={formData.fullAddress || ''} onChange={handleInputChange} required />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
             <CardHeader>
                <CardTitle>Çalışma Alanları ve Tercihler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                    <Label className="font-medium text-sm mb-2 block">Çalışma Şekli</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {WORKING_METHODS.map(method => (
                        <div key={method.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`wm-${method.id}`}
                            checked={formData.workingMethods?.includes(method.id as WorkingMethodType)}
                            onCheckedChange={() => handleMultiCheckboxChange(method.id, 'workingMethods')}
                        />
                        <Label htmlFor={`wm-${method.id}`} className="font-normal text-sm">{method.label}</Label>
                        </div>
                    ))}
                    </div>
                </div>
                 <div>
                    <Label className="font-medium text-sm mb-2 block">Çalışma Yolu</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {WORKING_ROUTES.map(route => (
                        <div key={route.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`wr-${route.id}`}
                            checked={formData.workingRoutes?.includes(route.id as WorkingRouteType)}
                            onCheckedChange={() => handleMultiCheckboxChange(route.id, 'workingRoutes')}
                        />
                        <Label htmlFor={`wr-${route.id}`} className="font-normal text-sm">{route.label}</Label>
                        </div>
                    ))}
                    </div>
                </div>
                 <div className="border-t pt-6">
                    <Label className="font-medium text-md mb-3 block">Tercih Edilen İller (En fazla {MAX_PREFERRED_LOCATIONS})</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(formData.preferredCities || []).map((city, index) => (
                    <div key={`city-${index}`} className="space-y-1.5">
                        <Select value={city} onValueChange={(val) => handlePreferredLocationChange(index, val, 'city')}>
                        <SelectTrigger><SelectValue placeholder={`Şehir ${index + 1}`} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>
                            {TURKISH_CITIES.map(c => <SelectItem key={c} value={c} disabled={formData.preferredCities?.includes(c) && city !== c}>{c}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                    ))}
                    </div>
                </div>
                <div className="border-t pt-6">
                    <Label className="font-medium text-md mb-3 block">Tercih Edilen Ülkeler (En fazla {MAX_PREFERRED_LOCATIONS})</Label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     {(formData.preferredCountries || []).map((country, index) => (
                        <div key={`country-${index}`} className="space-y-1.5">
                            <Select value={country} onValueChange={(val) => handlePreferredLocationChange(index, val, 'country')}>
                            <SelectTrigger><SelectValue placeholder={`Ülke ${index + 1}`} /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>
                                {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code} disabled={formData.preferredCountries?.includes(c.code) && country !== c.code}>{c.name}</SelectItem>)}
                            </SelectContent>
                            </Select>
                        </div>
                     ))}
                    </div>
                </div>
            </CardContent>
        </Card>


        <div className="flex items-center space-x-2 pt-2">
            <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData(prev => ({...prev, isActive: checked}))} />
            <Label htmlFor="isActive" className="font-medium cursor-pointer">Firma Onay Durumu (Aktif/Pasif)</Label>
        </div>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-0 pt-4">
            <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/admin/users">İptal</Link>
            </Button>
            <Button type="submit" disabled={formSubmitting} className="w-full sm:w-auto">
                {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                 <CheckSquare size={18} className="mr-2"/> Firmayı Kaydet
            </Button>
        </CardFooter>
    </form>
  );
}

export default function AddCompanyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AddCompanyForm />
    </Suspense>
  )
}
