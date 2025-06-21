
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CompanyUserProfile } from '@/types';
import { searchCompanyProfilesByName } from '@/services/authService';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, SearchX } from 'lucide-react';
import CompanyCard from '@/components/company/CompanyCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function CompanySearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [companies, setCompanies] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      const fetchCompanies = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedCompanies = await searchCompanyProfilesByName(query);
          setCompanies(fetchedCompanies);
        } catch (err) {
          console.error("Error searching for companies:", err);
          setError("Firmalar aranırken bir hata oluştu.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCompanies();
    } else {
      setCompanies([]);
      setIsLoading(false);
    }
  }, [query]);

  const renderContent = () => {
    if (isLoading) {
      return (
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

    if (companies.length === 0) {
      return (
        <div className="text-center py-16 bg-card border border-dashed rounded-lg shadow">
          <SearchX className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-semibold mb-3 text-foreground">Sonuç Bulunamadı</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Aradığınız kritere uygun firma bulunamadı. Lütfen farklı bir arama terimi deneyin.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-1">
          Arama Sonuçları
        </h1>
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">"{query}"</span> için bulunan sonuçlar listeleniyor.
        </p>
      </div>
      {renderContent()}
    </div>
  );
}

export default function CompanySearchPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Yükleniyor...</div>}>
            <CompanySearchContent />
        </Suspense>
    )
}
