
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addSponsorshipsToUser } from '@/services/sponsorsService';
import { getAllUserProfiles } from '@/services/authService';
import { COUNTRIES, TURKISH_CITIES } from '@/lib/locationData';
import type { CompanyUserProfile } from '@/types';
import { Loader2, PlusCircle, Award, CalendarIcon, Building, CheckSquare, Search, Globe, MapPin, X, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


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
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);

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
    
    setFormSubmitting(true);
    
    try {
      const result = await addSponsorshipsToUser(
        selectedCompanyId,
        selectedCountries,
        selectedCities,
      );

      if (result.success) {
        toast({ title: "Başarılı", description: result.message });
        router.push('/admin/users'); // Redirect to users page to see the updated profile
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
        <CardTitle className="text-2xl flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Yeni Sponsorluk Ekle</CardTitle>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/admin/users">İptal</Link>
          </Button>
          <Button type="submit" disabled={formSubmitting || optionsLoading} className="w-full sm:w-auto">
            {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CheckSquare size={18} className="mr-2" /> Sponsorlukları Kaydet
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sponsor Firma</CardTitle>
          <CardDescription>Sponsor olarak işaretlenecek firmayı seçin.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-1.5 max-w-md">
              <Label htmlFor="spCompany" className="font-medium">Sponsor Firma (*)</Label>
               <Popover open={companyPopoverOpen} onOpenChange={setCompanyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyPopoverOpen}
                    className="w-full justify-between font-normal"
                    disabled={optionsLoading}
                  >
                    {optionsLoading
                      ? "Firmalar Yükleniyor..."
                      : selectedCompanyId
                      ? companyUsers.find((company) => company.id === selectedCompanyId)?.name
                      : "Firma seçin..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Firma ara..." />
                    <CommandList>
                      <CommandEmpty>Firma bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        {companyUsers.map((company) => (
                          <CommandItem
                            key={company.id}
                            value={company.name}
                            onSelect={() => {
                              setSelectedCompanyId(company.id === selectedCompanyId ? '' : company.id);
                              setCompanyPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCompanyId === company.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {company.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
          <Link href="/admin/users">İptal</Link>
        </Button>
        <Button type="submit" disabled={formSubmitting || optionsLoading} className="w-full sm:w-auto">
          {formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckSquare size={18} className="mr-2"/> Sponsorlukları Kaydet
        </Button>
      </CardFooter>
    </form>
  );
}
