
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { CompanyUserProfile } from '@/types';
import { getSponsoredCompanies } from '@/services/authService';
import CompanyCard from '@/components/company/CompanyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AlertTriangle, Award, Star, SearchX, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { COUNTRIES } from '@/lib/locationData';

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSponsors = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedSponsors = await getSponsoredCompanies();
        // Sponsors should be active
        setSponsors(fetchedSponsors.filter(s => s.isActive));
      } catch (err) {
        console.error("Error fetching sponsors:", err);
        setError("Sponsor firmalar yüklenirken bir hata oluştu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSponsors();
  }, []);
  
  const getCountryName = useMemo(() => {
    const countryMap = new Map(COUNTRIES.map(c => [c.code, c.name]));
    return (code: string) => countryMap.get(code) || code;
  }, []);

  const filteredSponsors = useMemo(() => {
    if (!searchTerm.trim()) {
        return sponsors;
    }
    const lowerCaseSearch = searchTerm.toLowerCase();

    return sponsors.filter(sponsor => {
        // Check company name
        if (sponsor.name.toLowerCase().includes(lowerCaseSearch)) {
            return true;
        }

        // Check sponsored countries
        const sponsoredCountries = sponsor.sponsorships?.filter(s => s.type === 'country').map(s => getCountryName(s.name).toLowerCase()) || [];
        if (sponsoredCountries.some(name => name.includes(lowerCaseSearch))) {
            return true;
        }

        // Check sponsored cities
        const sponsoredCities = sponsor.sponsorships?.filter(s => s.type === 'city').map(s => s.name.toLowerCase()) || [];
        if (sponsoredCities.some(name => name.includes(lowerCaseSearch))) {
            return true;
        }

        return false;
    });
  }, [sponsors, searchTerm, getCountryName]);

  const { countrySponsors, citySponsors } = useMemo(() => {
    const countrySponsors: CompanyUserProfile[] = [];
    const citySponsors: CompanyUserProfile[] = [];
    
    filteredSponsors.forEach(sponsor => {
      const hasCountrySponsorship = sponsor.sponsorships?.some(s => s.type === 'country');
      if (hasCountrySponsorship) {
        countrySponsors.push(sponsor);
      } else {
        citySponsors.push(sponsor);
      }
    });

    const sortByName = (a: CompanyUserProfile, b: CompanyUserProfile) => a.name.localeCompare(b.name, 'tr');
    countrySponsors.sort(sortByName);
    citySponsors.sort(sortByName);

    return { countrySponsors, citySponsors };
  }, [filteredSponsors]);

  const renderSponsorList = (sponsorList: CompanyUserProfile[], title: string) => {
    if (sponsorList.length === 0) return null;
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sponsorList.map(sponsor => (
                    <CompanyCard key={sponsor.id} company={sponsor} isSponsor={true} />
                ))}
            </div>
        </div>
    )
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-12">
            <Skeleton className="h-8 w-1/3 mx-auto mb-8"/>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                <CardHeader className="items-center p-4 border-b">
                    <Skeleton className="w-24 h-24 rounded-full mb-3" />
                    <Skeleton className="h-6 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <Skeleton className="h-10 w-full" />
                </CardFooter>
                </Card>
            ))}
            </div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="text-center py-16 bg-card border border-destructive rounded-lg shadow">
          <AlertTriangle className="mx-auto h-20 w-20 text-destructive mb-6" />
          <h2 className="text-2xl font-semibold mb-3 text-destructive-foreground">Hata</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
        </div>
      );
    }
  
    if (sponsors.length === 0) {
      return (
        <div className="text-center py-16 bg-card border border-dashed rounded-lg shadow">
          <SearchX className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-3 text-foreground">Sponsor Bulunamadı</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Platformumuza henüz destek veren bir sponsorumuz bulunmamaktadır.
          </p>
        </div>
      );
    }

    if (filteredSponsors.length === 0) {
        return (
            <div className="text-center py-16 bg-card border border-dashed rounded-lg shadow">
              <SearchX className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
              <h2 className="text-2xl font-semibold mb-3 text-foreground">Sonuç Bulunamadı</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                "{searchTerm}" aramasına uygun sponsor bulunamadı.
              </p>
            </div>
        );
    }

    return (
        <div className="space-y-16">
            {renderSponsorList(countrySponsors, "Ülke Sponsorlarımız")}
            {renderSponsorList(citySponsors, "Şehir Sponsorlarımız")}
        </div>
    );
  };

  return (
    <div className="space-y-12">
        <Card className="overflow-hidden bg-primary text-primary-foreground shadow-lg">
            <div className="grid md:grid-cols-2 items-center">
                <div className="p-8 md:p-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
                        <Award size={48} /> Sponsorlarımız
                    </h1>
                    <p className="text-xl md:text-2xl text-primary-foreground/90">
                        Platformumuzun büyümesine ve gelişmesine katkıda bulunan değerli sponsorlarımıza teşekkür ederiz.
                    </p>
                </div>
                <div className="relative h-64 md:h-full hidden md:block">
                    <Image
                        src="https://issever.co/wp-content/uploads/2025/06/n-kamyon.svg"
                        alt="Sponsorluk illüstrasyonu"
                        layout="fill"
                        objectFit="cover"
                        data-ai-hint="partnership deal"
                    />
                </div>
            </div>
        </Card>

        <section className="container mx-auto px-4">
             <Card className="mb-12 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Search /> Sponsor Filtrele</CardTitle>
                    <CardDescription>Firma adı, sponsor olunan ülke veya şehire göre arama yapın.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Firma adı, ülke veya şehir..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 text-base pl-10"
                        />
                    </div>
                </CardContent>
            </Card>
            {renderContent()}
        </section>

        <section className="bg-muted/30 py-16">
            <div className="container mx-auto px-4 text-center">
                 <h2 className="text-3xl font-bold text-primary mb-4">Sponsor Olmak İster misiniz?</h2>
                 <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                     Markanızı binlerce nakliyeci ve yük sahibine ulaştırın. Sponsorluk fırsatları ve avantajları hakkında bilgi almak için bizimle iletişime geçin.
                 </p>
                 <Button asChild size="lg">
                     <Link href="/iletisim">İletişime Geçin</Link>
                 </Button>
            </div>
        </section>
    </div>
  );
}
