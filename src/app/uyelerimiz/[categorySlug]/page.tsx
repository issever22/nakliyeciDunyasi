
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CompanyUserProfile, CompanyCategory, CompanyCategoryDetail } from '@/types';
import { getCompanyProfilesByCategory, getActiveSponsorCompanyIds } from '@/services/authService';
import { COMPANY_CATEGORIES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Building, AlertTriangle, SearchX } from 'lucide-react';
import Link from 'next/link';
import CompanyCard from '@/components/company/CompanyCard';

export default function CompanyCategoryPage() {
  const params = useParams();
  const categorySlug = params.categorySlug as string;

  const [companies, setCompanies] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryDetails, setCategoryDetails] = useState<CompanyCategoryDetail | null>(null);
  const [sponsorIds, setSponsorIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (categorySlug) {
      const currentCategory = COMPANY_CATEGORIES.find(cat => cat.slug === categorySlug);
      if (currentCategory) {
        setCategoryDetails(currentCategory);
        document.title = `${currentCategory.label} Üyelerimiz - Nakliyeci Dünyası`;

        const fetchCompanies = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const [fetchedCompanies, activeSponsorIds] = await Promise.all([
                getCompanyProfilesByCategory(currentCategory.value as CompanyCategory),
                getActiveSponsorCompanyIds()
            ]);
            setCompanies(fetchedCompanies);
            setSponsorIds(activeSponsorIds);
          } catch (err) {
            console.error("Error fetching companies by category:", err);
            setError("Firmalar yüklenirken bir hata oluştu.");
          } finally {
            setIsLoading(false);
          }
        };
        fetchCompanies();
      } else {
        setError("Geçersiz kategori.");
        setIsLoading(false);
        document.title = "Geçersiz Kategori - Nakliyeci Dünyası";
      }
    }
  }, [categorySlug]);

  const sortedCompanies = [...companies].sort((a, b) => {
    const aIsSponsor = sponsorIds.has(a.id);
    const bIsSponsor = sponsorIds.has(b.id);
    if (aIsSponsor && !bIsSponsor) return -1;
    if (!aIsSponsor && bIsSponsor) return 1;
    return a.name.localeCompare(b.name, 'tr');
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="container mx-auto px-4 py-8 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Hata</h1>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-primary mb-1 flex items-center gap-2 justify-center md:justify-start">
          <Users size={30} /> {categoryDetails?.label} Üyelerimiz
        </h1>
        <p className="text-muted-foreground">{categoryDetails?.description || 'Bu kategorideki üye firmalarımız.'}</p>
      </div>

      {sortedCompanies.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed rounded-lg shadow">
            <SearchX className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Firma Bulunamadı</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
                Bu kategoride henüz kayıtlı ve aktif firma bulunmamaktadır.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} isSponsor={sponsorIds.has(company.id)}/>
          ))}
        </div>
      )}
    </div>
  );
}
