
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { CompanyUserProfile, CompanyFilterOptions } from '@/types';
import { getPaginatedCompanies, getActiveSponsorCompanyIds } from '@/services/authService';
import CompanyCard from '@/components/company/CompanyCard';
import CompanyFilters from '@/components/company/CompanyFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, SearchX, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const PAGE_SIZE = 12;

function CompaniesContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [companies, setCompanies] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [sponsorIds, setSponsorIds] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<CompanyFilterOptions>({
    searchTerm: initialQuery,
    category: '',
    city: '',
    country: '',
  });

  const fetchCompanies = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setError(null);
      setHasMore(true);
    }

    try {
      if (!isLoadMore) {
        const activeSponsorIds = await getActiveSponsorCompanyIds();
        setSponsorIds(activeSponsorIds);
      }

      const result = await getPaginatedCompanies({
        pageSize: PAGE_SIZE,
        lastVisibleDoc: isLoadMore ? lastVisibleDoc : null,
        filters,
      });

      if (result.error) throw new Error(result.error.message);
      
      const newCompanies = result.companies;
      setCompanies(prev => isLoadMore ? [...prev, ...newCompanies] : newCompanies);
      setLastVisibleDoc(result.newLastVisibleDoc);
      setHasMore(!!result.newLastVisibleDoc);

    } catch (err: any) {
      console.error("Error fetching companies:", err);
      setError("Firmalar yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, lastVisibleDoc]);

  useEffect(() => {
    setLastVisibleDoc(null);
    fetchCompanies(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (newFilters: CompanyFilterOptions) => {
    setFilters(newFilters);
  };

  const renderContent = () => {
    if (isLoading && companies.length === 0) {
      return (
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
            Aradığınız kriterlere uygun firma bulunamadı. Lütfen filtrelerinizi değiştirerek tekrar deneyin.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {companies.map((company) => (
          <CompanyCard key={company.id} company={company} isSponsor={sponsorIds.has(company.id)} />
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <Card className="overflow-hidden bg-primary text-primary-foreground shadow-lg">
        <div className="grid md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
              <Users size={48} /> Firmalar
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              Platformumuzdaki aktif nakliye ve lojistik firmalarını keşfedin. İhtiyacınıza en uygun partneri bulmak için arama ve filtreleme yapın.
            </p>
          </div>
          <div className="relative h-64 md:h-full hidden md:block">
            <Image
              src="https://placehold.co/800x400.png"
              alt="Firma arama illüstrasyonu"
              layout="fill"
              objectFit="cover"
              data-ai-hint="logistics map"
            />
          </div>
        </div>
      </Card>

      <CompanyFilters onFilterChange={handleFilterChange} initialSearchTerm={initialQuery} isLoading={isLoading || isLoadingMore}/>
      
      <div>
        {renderContent()}
        <div className="mt-10 text-center">
          {isLoadingMore ? (
            <Button disabled size="lg">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Yükleniyor...
            </Button>
          ) : hasMore ? (
            <Button onClick={() => fetchCompanies(true)} size="lg" variant="outline">
              Daha Fazla Firma Yükle
            </Button>
          ) : (
            companies.length > 0 && <p className="text-muted-foreground">Tüm firmalar yüklendi.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Yükleniyor...</div>}>
            <CompaniesContent />
        </Suspense>
    )
}
