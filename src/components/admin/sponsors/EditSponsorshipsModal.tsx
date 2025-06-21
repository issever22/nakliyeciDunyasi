
"use client";

import { useState, useEffect, type FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { updateSponsorshipsForUser } from '@/services/authService';
import { COUNTRIES, TURKISH_CITIES } from '@/lib/locationData';
import type { CompanyUserProfile, SponsorshipLocation } from '@/types';
import { Loader2, Search, X } from 'lucide-react';

interface EditSponsorshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyUserProfile;
  onUpdate: () => void;
}

export default function EditSponsorshipsModal({ isOpen, onClose, company, onUpdate }: EditSponsorshipsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  
  useEffect(() => {
    if (company && isOpen) {
      const initialCountries = company.sponsorships?.filter(s => s.type === 'country').map(s => s.name) || [];
      const initialCities = company.sponsorships?.filter(s => s.type === 'city').map(s => s.name) || [];
      setSelectedCountries(initialCountries);
      setSelectedCities(initialCities);
      setCitySearchTerm('');
    }
  }, [company, isOpen]);
  
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
    if (selectedCountries.length === 0 && selectedCities.length === 0) {
        toast({ title: "Uyarı", description: "Firma en az bir ülke veya şehirde sponsor olmalıdır. Sponsorluğu tamamen kaldırmak için liste sayfasındaki sil butonunu kullanın.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    
    const newSponsorships: SponsorshipLocation[] = [
        ...selectedCountries.map(c => ({ type: 'country', name: c } as SponsorshipLocation)),
        ...selectedCities.map(c => ({ type: 'city', name: c } as SponsorshipLocation))
    ];

    try {
      const result = await updateSponsorshipsForUser(company.id, newSponsorships);
      if (result.success) {
        toast({ title: "Başarılı", description: result.message });
        onUpdate();
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
        toast({ title: "Hata", description: error.message || "Sponsorluklar güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>Sponsorlukları Düzenle: {company.name}</DialogTitle>
            <DialogDescription>
              Firmanın sponsor olduğu ülkeleri ve şehirleri güncelleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
            {/* Country Selection */}
            <div className="flex flex-col">
              <h3 className="font-semibold mb-3">Ülke Sponsorlukları</h3>
              <ScrollArea className="flex-grow border rounded-md">
                <div className="p-2 space-y-1">
                  {COUNTRIES.filter(c => c.code !== 'OTHER').map(country => (
                    <div key={country.code} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                      <Checkbox id={`edit-country-${country.code}`} checked={selectedCountries.includes(country.code)} onCheckedChange={() => handleCountryToggle(country.code)} />
                      <Label htmlFor={`edit-country-${country.code}`} className="font-normal cursor-pointer">{country.name}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* City Selection */}
            <div className="flex flex-col">
              <h3 className="font-semibold mb-3">Şehir Sponsorlukları (Türkiye)</h3>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Şehir ara..." 
                  value={citySearchTerm} 
                  onChange={(e) => setCitySearchTerm(e.target.value)}
                  className="pl-10"
                />
                {citySearchTerm && <X className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setCitySearchTerm('')}/>}
              </div>
              <ScrollArea className="flex-grow border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredCities.map(city => (
                    <div key={city} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                      <Checkbox id={`edit-city-${city}`} checked={selectedCities.includes(city)} onCheckedChange={() => handleCityToggle(city)} />
                      <Label htmlFor={`edit-city-${city}`} className="font-normal cursor-pointer">{city}</Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-4 border-t mt-auto">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>İptal</Button>
            </DialogClose>
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
