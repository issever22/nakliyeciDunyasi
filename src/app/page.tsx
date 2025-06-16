
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
import { useToast } from '@/hooks/use-toast'; // toast import edildi

const PAGE_SIZE = 6;

export default function HomePage() {
  const [freights, setFreights] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<FreightFilterOptions>({ sortBy: 'newest' });
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast(); 


  const fetchFreights = useCallback(async (filters: FreightFilterOptions, reset: boolean = false) => {
    console.log('[HomePage - fetchFreights] Called. Reset:', reset, 'Filters:', JSON.stringify(filters));
    if (reset) {
      console.log('[HomePage - fetchFreights] Resetting: setIsLoading(true), clear freights, lastVisibleDoc, hasMore.');
      setIsLoading(true);
      setFreights([]);
      setLastVisibleDoc(null);
      setHasMore(true);
      setFetchError(null);
    } else {
      console.log('[HomePage - fetchFreights] Loading more: setIsLoadingMore(true).');
      setIsLoadingMore(true);
    }

    try {
      const { freights: newFreights, newLastVisibleDoc: nextDoc } = await getListings({
        lastVisibleDoc: reset ? null : lastVisibleDoc, 
        pageSize: PAGE_SIZE,
        filters: filters,
      });

      console.log('[HomePage - fetchFreights] getListings returned. New freights count:', newFreights.length, 'Next doc exists:', !!nextDoc);
      if (newFreights.length > 0) {
        console.log('[HomePage - fetchFreights] First new freight data (converted):', JSON.stringify(newFreights[0], null, 2));
      }


      setFreights(prev => {
        const updatedFreights = reset ? newFreights : [...prev, ...newFreights];
        console.log('[HomePage - fetchFreights] Updated freights state. Total count:', updatedFreights.length);
        return updatedFreights;
      });
      setLastVisibleDoc(nextDoc);
      setHasMore(newFreights.length === PAGE_SIZE);
      console.log('[HomePage - fetchFreights] Set hasMore to:', newFreights.length === PAGE_SIZE);

    } catch (error) {
      console.error("[HomePage - fetchFreights] Error fetching freights:", error);
      setFetchError("İlanlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      toast({ title: "Veri Yükleme Hatası", description: "İlanlar çekilirken bir sorun oluştu.", variant: "destructive" });
    } finally {
      console.log('[HomePage - fetchFreights] Finally block. setIsLoading(false), setIsLoadingMore(false).');
      setIsLoading(false);
      setIsLoadingMore(false);
      if (reset) {
        console.log('[HomePage - fetchFreights] Reset complete. setInitialLoadComplete(true).');
        setInitialLoadComplete(true);
      }
    }
  }, [
    setFreights, 
    setLastVisibleDoc, 
    setHasMore, 
    setFetchError, 
    setIsLoading, 
    setIsLoadingMore, 
    setInitialLoadComplete, 
    toast
    // `lastVisibleDoc` is intentionally omitted here as it's read from state within the function.
    // `PAGE_SIZE` is a constant defined outside, so it doesn't need to be in dependencies.
    // `getListings` is a stable server action import.
  ]);

  useEffect(() => {
    console.log('[HomePage - useEffect[currentFilters]] Filters changed. Calling fetchFreights with reset.');
    fetchFreights(currentFilters, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilters, fetchFreights]); 

  const handleFilterChange = (newFilters: FreightFilterOptions) => {
    console.log('[HomePage - handleFilterChange] New filters received:', JSON.stringify(newFilters));
    setCurrentFilters(newFilters); 
  };

  const loadMoreFreights = () => {
    console.log('[HomePage - loadMoreFreights] Called. HasMore:', hasMore, 'IsLoadingMore:', isLoadingMore);
    if (hasMore && !isLoadingMore) {
      fetchFreights(currentFilters, false); 
    }
  };
  
  useEffect(() => {
    console.log('[HomePage - useEffect[]] Component mounted/updated. Current state:');
    console.log({
      isLoading,
      initialLoadComplete,
      freightsCount: freights.length,
      hasMore,
      isLoadingMore,
      fetchError
    });
  }, [isLoading, initialLoadComplete, freights, hasMore, isLoadingMore, fetchError]);


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
  
  if (fetchError && !isLoading) { 
    return (
      <div className="text-center py-16 bg-destructive/10 border border-destructive rounded-lg shadow">
        <AlertTriangle className="mx-auto h-20 w-20 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold mb-3 text-destructive-foreground">Hata</h2>
        <p className="text-destructive-foreground/80 max-w-md mx-auto">
          {fetchError}
        </p>
        <Button onClick={() => fetchFreights(currentFilters, true)} variant="destructive" className="mt-6">
             Tekrar Dene
        </Button>
      </div>
    );
  }

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
        {isLoading && !initialLoadComplete && freights.length === 0 ? renderSkeletons() : 
          freights.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {freights.map((freight) => (
                  <FreightCard key={freight.id} freight={freight} />
                ))}
              </div>
              {isLoadingMore && (
                 <div className="mt-10 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground mt-2">Daha fazla ilan yükleniyor...</p>
                 </div>
              )}
              {!isLoadingMore && hasMore && (
                <div className="mt-10 text-center">
                  <Button onClick={loadMoreFreights} variant="outline" size="lg">
                    Daha Fazla Yükle
                  </Button>
                </div>
              )}
               {!hasMore && initialLoadComplete && freights.length > 0 && (
                   <p className="text-center mt-10 text-muted-foreground italic">Tüm ilanlar yüklendi.</p>
              )}
            </>
          ) : (
             initialLoadComplete && freights.length === 0 && !isLoading && !fetchError && ( 
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
          )
        }
      </div>
    </div>
  );
}
