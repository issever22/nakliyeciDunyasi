
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import FreightCard from '@/components/freight/FreightCard';
import FreightFilters from '@/components/freight/FreightFilters';
import type { Freight, CommercialFreight, FreightFilterOptions, VehicleNeeded, ShipmentScope, FreightType } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { getListings } from '@/services/listingsService'; 
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { parseISO } from 'date-fns';


export default function HomePage() {
  const [allFreights, setAllFreights] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 6; 

  const [filters, setFilters] = useState<FreightFilterOptions>({});

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const { freights: newFreights, newLastVisible } = await getListings(null, pageSize, filters);
      setAllFreights(newFreights);
      setLastVisible(newLastVisible);
      setHasMore(newFreights.length === pageSize);
      setIsLoading(false);
    };
    fetchInitialData();
  }, [filters, pageSize]); // Depend on filters and pageSize

  const loadMoreFreights = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const { freights: newFreights, newLastVisible } = await getListings(lastVisible, pageSize, filters);
    setAllFreights(prevFreights => [...prevFreights, ...newFreights]);
    setLastVisible(newLastVisible);
    setHasMore(newFreights.length === pageSize);
    setIsLoadingMore(false);
  };

  const handleFilter = (newFilters: FreightFilterOptions) => {
    setFilters(newFilters);
    // Reset pagination for new filter
    setLastVisible(null); 
    setAllFreights([]); // Clear current freights to reflect new filter results
    setHasMore(true); // Assume there might be more data with new filters
  };

  const filteredFreights = useMemo(() => {
    // Client-side filtering logic based on 'filters' is removed
    // as Firestore query now handles primary filtering (origin, destination, type, etc.).
    // Sorting is still done client-side after fetching.
    let freightsToDisplay = [...allFreights];
    
    if (filters.sortBy === 'oldest') {
      freightsToDisplay.sort((a, b) => parseISO(a.postedAt).getTime() - parseISO(b.postedAt).getTime());
    } else { 
      // Default to newest or if sortBy is 'newest'
      freightsToDisplay.sort((a, b) => parseISO(b.postedAt).getTime() - parseISO(a.postedAt).getTime());
    }
    return freightsToDisplay;
  }, [allFreights, filters.sortBy]);


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
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 shadow-md">
            Türkiye'nin Nakliye Dünyası
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-neutral-100 mb-8 max-w-3xl shadow-sm">
            Yüklerinizi güvenle taşıtın, taşıma ihtiyaçlarınıza en uygun çözümleri burada bulun.
          </p>
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground py-3 px-10 text-lg rounded-full shadow-lg transition-transform hover:scale-105">
            <Link href="/yeni-ilan">
              <PlusCircle className="mr-2 h-6 w-6" /> Hemen İlan Ver
            </Link>
          </Button>
        </div>
      </section>

      <FreightFilters onFilter={handleFilter} />

      <div className="pt-4">
        <h2 className="text-3xl font-bold text-primary mb-8 text-center sm:text-left">Güncel Nakliye İlanları</h2>
        {isLoading && allFreights.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="w-full shadow-md">
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
        ) : filteredFreights.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {filteredFreights.map((freight) => (
                <FreightCard key={freight.id} freight={freight} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 text-center">
                <Button onClick={loadMoreFreights} disabled={isLoadingMore} variant="outline">
                  {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Daha Fazla Yükle
                </Button>
              </div>
            )}
             {!hasMore && filteredFreights.length > pageSize && (
                 <p className="text-center mt-10 text-muted-foreground">Gösterilecek başka ilan bulunmuyor.</p>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-card border border-dashed rounded-lg">
            <AlertTriangle className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold mb-3">Aradığınız Kriterlere Uygun İlan Bulunamadı</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Filtrelerinizi değiştirmeyi veya daha sonra tekrar kontrol etmeyi deneyebilirsiniz. Belki de ilk ilanı siz vermek istersiniz?
            </p>
            <Button asChild variant="outline" className="mt-6">
                <Link href="/yeni-ilan">
                    <PlusCircle className="mr-2 h-5 w-5"/> İlan Oluştur
                </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
