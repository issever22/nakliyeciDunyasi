
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addSponsorshipsBatch } from '@/services/sponsorsService'; // New batch service
import { getAllUserProfiles } from '@/services/authService';
import { COUNTRIES, TURKISH_CITIES } from '@/lib/locationData';
import type { CompanyUserProfile } from '@/types';
import { Loader2, PlusCircle, Award, CalendarIcon, Building, CheckSquare, Search, Globe, MapPin, X } from 'lucide-react';
import Link from 'next/link';
import { format, isValid } from "date-fns";
import { tr } from 'date-fns/locale';

export default function AddSponsorPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const [companyUsers, setCompanyUsers] = useState<CompanyUserProfile[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  
  const [citySearchTerm, setCitySearchTerm] = useState('');

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  useEffect(() => {
    const fetchCompanies = async () => {
      setOptionsLoading(true);
      try {
        const companiesFromDb = await getAllUserProfiles();
        setCompanyUsers(companiesFromDb.filter(u => u.isActive));
      } catch (error) {
        console.error("Error fetching companies:", error);
        toast({ title: "Hata", description: "Firmalar yüklenirken bir sorun oluştu.", variant: "destructive" });
      }
      setOptionsLoading(false);
    };
    fetchCompanies();
  }, [toast]);
  
  const handleCountryToggle = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleCityToggle = (name: string) => {
    setSelectedCities(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };
  
  const filteredCities = useMemo(() => {
    return TURKISH_CITIES.filter(city => 
      city.toLowerCase().includes(citySearchTerm.toLowerCase())
    );
  }, [citySearchTerm]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCompanyId) {
        toast({ title: "Hata", description: "Lütfen sponsor olacak firmayı seçin.", variant: "destructive" });
        return;
    }
    if (selectedCountries.length === 0 && selectedCities.length === 0) {
        toast({ title: "Hata", description: "Lütfen en az bir ülke veya şehir seçin.", variant: "destructive" });
        return;
    }
    if (!startDate) {
        toast({ title: "Hata", description: "Başlangıç tarihi zorunludur.", variant: "destructive" });
        return;
    }
    if (startDate && endDate && startDate > endDate) {
        toast({ title: "Hata", description: "Bitiş tarihi başlangıç tarihinden önce olamaz.", variant: "destructive" });
        return;
    }
    setFormSubmitting(true);
    
    try {
      const result = await addSponsorshipsBatch(
        selectedCompanyId,
        selectedCountries,
        selectedCities,
        format(startDate, "yyyy-MM-dd"),
        endDate ? format(endDate, "yyyy-MM-dd") : undefined
      );

      if (result.success) {
        toast({ title: "Başarılı", description: result.message });
        router.push('/admin/sponsors');
      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
        toast({ title: "Hata", description: error.message || "Sponsorluklar eklenirken bir hata oluştu.", variant: "destructive" });
    } finally {
        setFormSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-2xl flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Yeni Sponsor Ekle</CardTitle>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/admin/sponsors">İptal</Link>
          </Button>
          <Button type="submit" disabled={formSubmitting || optionsLoading} className="w-full sm:w-auto">
            {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckSquare size={18} className="mr-2" /> Sponsorlukları Kaydet
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sponsor Firma ve Geçerlilik Tarihleri</CardTitle>
          <CardDescription>Sponsor olacak firmayı ve sponsorluğun geçerlilik aralığını seçin. Bu tarihler seçilen tüm lokasyonlar için geçerli olacaktır.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="spCompany" className="font-medium">Sponsor Firma (*)</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId} disabled={optionsLoading}>
                <SelectTrigger id="spCompany"><SelectValue placeholder={optionsLoading ? "Firmalar Yükleniyor..." : "Firma seçin..."} /></SelectTrigger>
                <SelectContent>
                  {companyUsers.length > 0 ? (
                    companyUsers.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Sponsor olabilecek aktif firma bulunamadı.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="spStartDate" className="font-medium">Başlangıç Tarihi (*)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={tr} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spEndDate" className="font-medium">Bitiş Tarihi (Opsiyonel)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={tr} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe size={20} /> Ülke Sponsorlukları</CardTitle>
            <CardDescription>Sponsor olunacak ülkeleri seçin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {COUNTRIES.filter(c => c.code !== 'OTHER').map(country => (
              <div key={country.code} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                <Checkbox id={`country-${country.code}`} checked={selectedCountries.includes(country.code)} onCheckedChange={() => handleCountryToggle(country.code)} />
                <Label htmlFor={`country-${country.code}`} className="font-normal cursor-pointer">{country.name}</Label>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin size={20} /> Şehir Sponsorlukları (Türkiye)</CardTitle>
            <CardDescription>Sponsor olunacak şehirleri seçin.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Şehir ara..." 
                value={citySearchTerm} 
                onChange={(e) => setCitySearchTerm(e.target.value)}
                className="pl-10"
              />
              {citySearchTerm && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setCitySearchTerm('')}/>}
            </div>
            <ScrollArea className="flex-grow border rounded-md h-72">
              <div className="p-2 space-y-1">
                {filteredCities.map(city => (
                  <div key={city} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                    <Checkbox id={`city-${city}`} checked={selectedCities.includes(city)} onCheckedChange={() => handleCityToggle(city)} />
                    <Label htmlFor={`city-${city}`} className="font-normal cursor-pointer">{city}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

       <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-0 pt-4">
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/admin/sponsors">İptal</Link>
        </Button>
        <Button type="submit" disabled={formSubmitting || optionsLoading} className="w-full sm:w-auto">
          {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckSquare size={18} className="mr-2"/> Sponsorlukları Kaydet
        </Button>
      </CardFooter>
    </form>
  );
}
