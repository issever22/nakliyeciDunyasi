
"use client";

import { useState, useEffect, useCallback } from 'react';
import FreightCard from '@/components/freight/FreightCard';
import FreightFilters from '@/components/freight/FreightFilters';
import type { Freight, FreightFilterOptions } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle, Loader2, SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { getListings } from '@/services/listingsService'; 
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const PAGE_SIZE = 6;

export default function HomePage() {
  const [freights, setFreights] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FreightFilterOptions>({ sortBy: 'newest' });
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchFreights = useCallback(async (filters: FreightFilterOptions, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
      setFreights([]);
      setLastVisibleDoc(null);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const { freights: newFreights, newLastVisibleDoc: nextDoc } = await getListings({
        lastVisibleDoc: reset ? null : lastVisibleDoc,
        pageSize: PAGE_SIZE,
        filters: filters,
      });

      setFreights(prev => reset ? newFreights : [...prev, ...newFreights]);
      setLastVisibleDoc(nextDoc);
      setHasMore(newFreights.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching freights:", error);
      // Optionally set an error state here to show in UI
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      if (reset) setInitialLoadComplete(true);
    }
  }, [lastVisibleDoc]); // Only lastVisibleDoc is a dependency for the callback itself

  useEffect(() => {
    // Initial fetch based on default filters
    fetchFreights(currentFilters, true);
  }, [currentFilters]); // Re-fetch when filters change

  const handleFilterChange = (newFilters: FreightFilterOptions) => {
    setCurrentFilters(newFilters); // This will trigger the useEffect above
  };

  const loadMoreFreights = () => {
    if (hasMore && !isLoadingMore) {
      fetchFreights(currentFilters, false); // Fetch next page with current filters
    }
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <Card key={i} className="w-full shadow-md animate-pulse">
          <CardHeader className="p-4"><Skeleton className="h-8 w-3/4 rounded" /></CardHeader>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </CardContent>
          <CardFooter className="p-4"><Skeleton className="h-10 w-full rounded-md" /></CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-10">
      <section className="relative h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl group">
        <Image
          src="https://placehold.co/1600x600.png"
          alt="Nakliye ve lojistik platformu arka planı"
          fill
          style={{objectFit:"cover"}}
          className="z-0 transition-transform duration-500 ease-in-out group-hover:scale-105"
          priority
          data-ai-hint="modern logistics"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-primary/30 mix-blend-multiply z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-6 md:p-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Türkiye'nin Nakliye Dünyası
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-neutral-100 mb-8 max-w-3xl drop-shadow-md">
            Yüklerinizi güvenle taşıtın, taşıma ihtiyaçlarınıza en uygun çözümleri burada bulun.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground py-3 px-10 text-lg rounded-full shadow-lg transition-transform hover:scale-105">
            <Link href="/yeni-ilan">
              <PlusCircle className="mr-2 h-6 w-6" /> Hemen İlan Ver
            </Link>
          </Button>
        </div>
      </section>

      <FreightFilters onFilterChange={handleFilterChange} isLoading={isLoading || isLoadingMore} />

      <div className="pt-4">
        <h2 className="text-3xl font-bold text-primary mb-8 text-center sm:text-left">Güncel Nakliye İlanları</h2>
        {isLoading && !initialLoadComplete ? renderSkeletons() : 
          freights.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {freights.map((freight) => (
                  <FreightCard key={freight.id} freight={freight} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-10 text-center">
                  <Button onClick={loadMoreFreights} disabled={isLoadingMore} variant="outline" size="lg">
                    {isLoadingMore && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Daha Fazla Yükle
                  </Button>
                </div>
              )}
               {!hasMore && freights.length >= PAGE_SIZE && (
                   <p className="text-center mt-10 text-muted-foreground italic">Tüm ilanlar yüklendi.</p>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-card border border-dashed rounded-lg shadow">
              <SearchX className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
              <h2 className="text-2xl font-semibold mb-3 text-foreground">İlan Bulunamadı</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Aradığınız kriterlere uygun aktif ilan bulunamadı. Filtrelerinizi değiştirmeyi veya daha sonra tekrar kontrol etmeyi deneyebilirsiniz.
              </p>
              <Button asChild variant="default" className="mt-6 bg-primary hover:bg-primary/90">
                  <Link href="/yeni-ilan">
                      <PlusCircle className="mr-2 h-5 w-5"/> İlk İlanı Sen Ver
                  </Link>
              </Button>
            </div>
          )
        }
      </div>
    </div>
  );
}
