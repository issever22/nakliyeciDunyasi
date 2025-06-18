
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CompanyUserProfile, CompanyCategory, CompanyCategoryDetail } from '@/types';
import { getCompanyProfilesByCategory } from '@/services/authService';
import { COMPANY_CATEGORIES } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Building, AlertTriangle, SearchX } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

function CompanyCard({ company }: { company: CompanyUserProfile }) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <CardHeader className="items-center text-center p-4 border-b">
        <Avatar className="w-24 h-24 mb-3 border-2 border-muted">
          <AvatarImage src={company.logoUrl} alt={`${company.name} logo`} data-ai-hint="company logo" />
          <AvatarFallback className="text-3xl bg-primary/10 text-primary">
            {company.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg font-semibold text-primary">{company.name}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{company.category}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm flex-grow">
        {company.companyDescription && (
          <p className="text-muted-foreground line-clamp-2 text-xs mb-2">
            {company.companyDescription}
          </p>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin size={14} /> <span>{company.addressCity}{company.addressDistrict ? `, ${company.addressDistrict}` : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building size={14} /> <span>{company.companyType === 'local' ? 'Yerel Firma' : 'Yabancı Firma'}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button variant="outline" className="w-full" asChild>
          {/* Placeholder link, actual company profile page not implemented yet */}
          <Link href={`#`}>Detayları Gör (Yakında)</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


export default function CompanyCategoryPage() {
  const params = useParams();
  const categorySlug = params.categorySlug as string;

  const [companies, setCompanies] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryDetails, setCategoryDetails] = useState<CompanyCategoryDetail | null>(null);

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
            const fetchedCompanies = await getCompanyProfilesByCategory(currentCategory.value as CompanyCategory);
            setCompanies(fetchedCompanies);
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader className="items-center p-4 border-b">
                <Skeleton className="w-24 h-24 rounded-full mb-3" />
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
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
        <Button variant="outline" asChild className="mt-6">
          <Link href="/">Ana Sayfaya Dön</Link>
        </Button>
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

      {companies.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed rounded-lg shadow">
            <SearchX className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Firma Bulunamadı</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
                Bu kategoride henüz kayıtlı ve aktif firma bulunmamaktadır.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}

