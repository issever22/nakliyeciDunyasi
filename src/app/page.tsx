
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import FreightCard from '@/components/freight/FreightCard';
import FreightFilters from '@/components/freight/FreightFilters'; 
import type { Freight, FreightFilterOptions } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  PlusCircle, 
  AlertTriangle, 
  Loader2, 
  SearchX, 
  Filter, 
  ListFilter, 
  CalendarClock, 
  Globe, 
  Repeat, 
  Home, 
  Truck, 
  PackagePlus, 
  SlidersHorizontal 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { getListings } from '@/services/listingsService';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');

  const fetchFreights = useCallback(async (startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null, appliedFilters: FreightFilterOptions) => {
    const isLoadMore = !!startAfterDoc;
    
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setFreights([]); 
      setFetchError(null);
      setLastVisibleDoc(null); 
      setHasMore(true); 
    }

    try {
      const result = await getListings({ 
        lastVisibleDoc: startAfterDoc, 
        pageSize: PAGE_SIZE,
        filters: appliedFilters 
      });

      if (result.error) {
        console.error("[HomePage - fetchFreights] Error from getListings service:", result.error.message);
        const errorMessage = result.error.indexCreationUrl 
          ? `Eksik bir Firestore dizini var. Lütfen tarayıcı konsolundaki bağlantıyı kullanarak dizini oluşturun.`
          : result.error.message;
        toast({
            title: "Veri Yükleme Hatası",
            description: errorMessage,
            variant: "destructive",
            duration: result.error.indexCreationUrl ? 20000 : 5000
        });
        if(result.error.indexCreationUrl) {
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
            console.error("!!! TARAYICI KONSOLU - EKSİK FIRESTORE INDEX !!!");
            console.error(`!!! Düzeltmek için, aşağıdaki bağlantıyı ziyaret ederek bileşik dizini oluşturun: ${result.error.indexCreationUrl}`);
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        }
        setFetchError(result.error.message);
        setFreights([]);
        setHasMore(false);
        return;
      }
      
      const newFreights = result.freights;
      
      setFreights(prev => isLoadMore ? [...prev, ...newFreights] : newFreights);
      setLastVisibleDoc(result.newLastVisibleDoc);
      setHasMore(!!result.newLastVisibleDoc && newFreights.length === PAGE_SIZE);

    } catch (error) { 
      console.error("[HomePage - fetchFreights] Unexpected error during fetch operation:", error);
      const errorMsg = "İlanlar yüklenirken beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
      setFetchError(errorMsg);
      toast({ title: "Beklenmedik Hata", description: errorMsg, variant: "destructive" });
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    }
  }, [toast]); 

  const handleAdvancedFilterChange = useCallback((newFilters: FreightFilterOptions) => {
    setCurrentFilters(newFilters);
    setActiveQuickFilter('advanced');
    setInitialLoadComplete(false);
    setShowAdvancedFilters(false);
  }, []);

  const handleQuickFilterClick = useCallback((filterName: string) => {
    let newFilters: FreightFilterOptions = { sortBy: 'newest' };

    switch (filterName) {
        case 'all':
            newFilters = { sortBy: 'newest' };
            break;
        case 'today_all':
            newFilters = { postedToday: true, sortBy: 'newest' };
            break;
        case 'today_domestic':
            newFilters = { postedToday: true, freightType: 'Yük', shipmentScope: 'Yurt İçi', sortBy: 'newest' };
            break;
        case 'today_international':
            newFilters = { postedToday: true, freightType: 'Yük', shipmentScope: 'Yurt Dışı', sortBy: 'newest' };
            break;
        case 'today_residential':
            newFilters = { postedToday: true, freightType: 'Evden Eve', sortBy: 'newest' };
            break;
        case 'continuous':
            newFilters = { isContinuousLoad: true, freightType: 'Yük', sortBy: 'newest' };
            break;
        case 'today_empty_vehicle':
            newFilters = { postedToday: true, freightType: 'Boş Araç', sortBy: 'newest' };
            break;
    }
    
    setActiveQuickFilter(filterName);
    setCurrentFilters(newFilters);
    setInitialLoadComplete(false); 
    setShowAdvancedFilters(false);
  }, []);

  useEffect(() => {
    fetchFreights(null, currentFilters);
  }, [currentFilters, fetchFreights]);

  const loadMoreFreights = useCallback(() => {
    if (hasMore && lastVisibleDoc && !isLoadingMore) {
        fetchFreights(lastVisibleDoc, currentFilters);
    }
  }, [hasMore, lastVisibleDoc, isLoadingMore, fetchFreights, currentFilters]);
  
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

  if (fetchError && !isLoading && !isLoadingMore && freights.length === 0) {
    return (
      <div className="text-center py-16 bg-destructive/10 border border-destructive rounded-lg shadow">
        <AlertTriangle className="mx-auto h-20 w-20 text-destructive mb-6" />
        <h2 className="text-2xl font-semibold mb-3 text-destructive-foreground">Hata</h2>
        <p className="text-destructive-foreground/80 max-w-md mx-auto">
          {fetchError}
        </p>
        <Button onClick={() => fetchFreights(null, currentFilters)} variant="destructive" className="mt-6">
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

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><ListFilter /> Hızlı Filtreler</h2>
        <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={activeQuickFilter === 'today_all' ? 'default' : 'outline'} onClick={() => handleQuickFilterClick('today_all')}>
              <CalendarClock size={16} className="mr-1.5"/>
              Bugün Yayınlananlar
            </Button>
            <Button size="sm" variant={activeQuickFilter === 'today_domestic' ? 'default' : 'outline'} onClick={() => handleQuickFilterClick('today_domestic')}>
              <Truck size={16} className="mr-1.5"/>
              Bugünkü Yurtiçi Yükler
            </Button>
            <Button size="sm" variant={activeQuickFilter === 'today_international' ? 'default' : 'outline'} onClick={() => handleQuickFilterClick('today_international')}>
              <Globe size={16} className="mr-1.5"/>
              Bugünkü Yurtdışı Yükler
            </Button>
            <Button size="sm" variant={activeQuickFilter === 'today_residential' ? 'default' : 'outline'} onClick={() => handleQuickFilterClick('today_residential')}>
              <Home size={16} className="mr-1.5"/>
              Bugünkü Evden Eve
            </Button>
            <Button size="sm" variant={activeQuickFilter === 'continuous' ? 'default' : 'outline'} onClick={() => handleQuickFilterClick('continuous')}>
              <Repeat size={16} className="mr-1.5"/>
              Sürekli Yükler
            </Button>
            <Button size="sm" variant={activeQuickFilter === 'today_empty_vehicle' ? 'default' : 'outline'} onClick={() => handleQuickFilterClick('today_empty_vehicle')}>
              <PackagePlus size={16} className="mr-1.5"/>
              Bugünkü Boş Araçlar
            </Button>
            <Button size="sm" variant={showAdvancedFilters || activeQuickFilter === 'advanced' ? 'default' : 'outline'} onClick={() => setShowAdvancedFilters(prev => !prev)}>
                <SlidersHorizontal size={16} className="mr-1.5"/>
                Gelişmiş Filtreleme
            </Button>
        </div>
      </div>

      {showAdvancedFilters && (
        <FreightFilters onFilterChange={handleAdvancedFilterChange} isLoading={isLoading || isLoadingMore} />
      )}


      <div className="pt-4">
        <h2 className="text-3xl font-bold text-primary mb-8 text-center sm:text-left">Güncel Nakliye İlanları</h2>
        {isLoading && !initialLoadComplete && !isLoadingMore ? renderSkeletons() :
          freights.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {freights.map((freight) => (
                  <FreightCard key={freight.id} freight={freight} />
                ))}
              </div>
              <div className="mt-10 text-center">
                {isLoadingMore ? (
                  <Button disabled size="lg" className="bg-primary/80">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Daha Fazla Yükleniyor...
                  </Button>
                ) : hasMore && lastVisibleDoc ? (
                  <Button onClick={loadMoreFreights} size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 hover:text-primary">
                    Daha Fazla İlan Yükle
                  </Button>
                ) : initialLoadComplete && !hasMore && freights.length > 0 && (
                  <p className="text-muted-foreground">Tüm ilanlar yüklendi.</p>
                )}
              </div>
            </>
          ) : (
             initialLoadComplete && freights.length === 0 && !isLoading && !isLoadingMore && !fetchError && (
                <div className="text-center py-16 bg-card border border-dashed rounded-lg shadow">
                <SearchX className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
                <h2 className="text-2xl font-semibold mb-3 text-foreground">İlan Bulunamadı</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Seçili filtrelere uygun aktif ilan bulunamadı veya bir sorun oluştu.
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
