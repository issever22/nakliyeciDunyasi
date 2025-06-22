
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
  SlidersHorizontal,
  FilePlus2,
  Gavel,
  Network,
  BadgePercent,
  ShieldCheck,
  MousePointerClick,
  Users,
  MessageSquareText,
  Star,
  Info
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { getListings } from '@/services/listingsService';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import HeroSlider from '@/components/hero/HeroSlider';

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

  const handleApplyAdvancedFilters = useCallback((newFilters: FreightFilterOptions) => {
    setCurrentFilters(newFilters);
    setActiveQuickFilter('advanced');
    setInitialLoadComplete(false);
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
  }, []);

  const handleToggleAdvancedFilters = useCallback(() => {
    if(!showAdvancedFilters) {
        // Reset to 'all' when opening advanced filters for a clean slate
        handleQuickFilterClick('all'); 
    } else {
        // Reset to 'all' when closing advanced filters
        handleQuickFilterClick('all');
    }
    setShowAdvancedFilters(prev => !prev);
  }, [showAdvancedFilters, handleQuickFilterClick]);


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
    <div className="space-y-16">
      <HeroSlider />

      <section className="pt-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <h2 className="text-3xl font-bold text-primary text-center sm:text-left">Güncel Nakliye İlanları</h2>
          <Button size="sm" variant={showAdvancedFilters || activeQuickFilter === 'advanced' ? 'default' : 'outline'} onClick={handleToggleAdvancedFilters}>
            <SlidersHorizontal size={16} className="mr-1.5"/>
            {showAdvancedFilters ? 'Filtreyi Kapat' : 'Gelişmiş Filtreleme'}
          </Button>
        </div>

        {showAdvancedFilters ? (
            <FreightFilters onFilterChange={handleApplyAdvancedFilters} isLoading={isLoading || isLoadingMore} />
        ) : (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                <Button size="sm" variant={activeQuickFilter === 'all' ? 'default' : 'outline'} onClick={() => handleQuickFilterClick('all')}>
                <Globe size={16} className="mr-1.5"/>
                Tümü
                </Button>
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
            </div>
        )}
        
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
      </section>

      <section>
        <div className="bg-primary/5 rounded-xl p-8 border border-primary/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="flex flex-col items-center">
              <Users className="h-10 w-10 text-primary mb-3" />
              <h4 className="text-lg font-semibold text-muted-foreground">Firmalarımız</h4>
              <p className="text-4xl font-bold text-primary mt-1">1,300+</p>
            </div>
            
            <div className="flex flex-col items-center">
              <Truck className="h-10 w-10 text-primary mb-3" />
              <h4 className="text-lg font-semibold text-muted-foreground">Tamamlanan Nakliye</h4>
              <p className="text-4xl font-bold text-primary mt-1">12,340</p>
            </div>

            <div className="flex flex-col items-center">
              <MessageSquareText className="h-10 w-10 text-primary mb-3" />
              <h4 className="text-lg font-semibold text-muted-foreground">Müşteri Yorumu</h4>
              <p className="text-4xl font-bold text-primary mt-1">1,560</p>
            </div>
            
            <div className="flex flex-col items-center">
              <Star className="h-10 w-10 text-primary mb-3" />
              <h4 className="text-lg font-semibold text-muted-foreground">Memnuniyet</h4>
              <p className="text-4xl font-bold text-primary mt-1">98%</p>
            </div>

          </div>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-3xl font-bold text-center mb-2">Nasıl Çalışır?</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">Platformumuzu kullanarak nakliye sürecini sadece üç basit adımda tamamlayın.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-3">
                <FilePlus2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>1. İlan Oluşturun</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">İhtiyacınıza uygun ilan tipini seçin, yükünüzün ve güzergahınızın detaylarını saniyeler içinde girin.</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-3">
                 <Gavel className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>2. Teklifleri Değerlendirin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Güvenilir nakliyecilerden gelen fiyat tekliflerini karşılaştırın, firmanın profilini ve puanını inceleyin.</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-3">
                 <Truck className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>3. Taşımanızı Gerçekleştirin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">En uygun teklifi seçerek nakliyecinizle anlaşın ve yükünüzün güvenle taşınmasını izleyin.</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-10">
            <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/5 hover:text-primary">
                <Link href="/nasil-calisir">
                    <Info className="mr-2 h-5 w-5" />
                    Detayları Gör
                </Link>
            </Button>
        </div>
      </section>
      
      <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                  <h2 className="text-3xl font-bold mb-4">Neden Nakliyeci Dünyası?</h2>
                  <p className="text-muted-foreground mb-8">
                      Geniş nakliyeci ağımız, rekabetçi fiyatlarımız ve kullanıcı dostu platformumuz ile lojistik ihtiyaçlarınız için en doğru adresiz. Güvenilir ve hızlı çözümlerle işinizi kolaylaştırıyoruz.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex gap-4">
                          <div className="bg-accent/10 text-accent p-3 rounded-full h-fit"><Network size={24} /></div>
                          <div>
                              <h3 className="font-semibold mb-1">Geniş Ağ</h3>
                              <p className="text-sm text-muted-foreground">Türkiye'nin dört bir yanından binlerce güvenilir nakliyeciye anında ulaşın.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                           <div className="bg-accent/10 text-accent p-3 rounded-full h-fit"><BadgePercent size={24} /></div>
                          <div>
                              <h3 className="font-semibold mb-1">Rekabetçi Fiyatlar</h3>
                              <p className="text-sm text-muted-foreground">Birden fazla teklif alarak bütçenize en uygun fiyatı bulun.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                           <div className="bg-accent/10 text-accent p-3 rounded-full h-fit"><ShieldCheck size={24} /></div>
                          <div>
                              <h3 className="font-semibold mb-1">Güvenli Platform</h3>
                              <p className="text-sm text-muted-foreground">Onaylanmış firma profilleri ve kullanıcı yorumları ile güvenle çalışın.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                           <div className="bg-accent/10 text-accent p-3 rounded-full h-fit"><MousePointerClick size={24} /></div>
                          <div>
                              <h3 className="font-semibold mb-1">Kolay Kullanım</h3>
                              <p className="text-sm text-muted-foreground">Basit arayüzümüzle ilan vermek ve teklifleri yönetmek çok kolay.</p>
                          </div>
                      </div>
                  </div>
              </div>
               <div className="hidden lg:block">
                  <Image 
                      src="https://issever.co/wp-content/uploads/2025/06/nakliye-kamyon-1.svg"
                      alt="Lojistik operasyonlarını gösteren bir görsel"
                      width={600}
                      height={500}
                      data-ai-hint="logistics operation"
                  />
              </div>
          </div>
      </section>

      <section className="bg-primary/5 border-t border-b border-primary/10">
          <div className="container mx-auto px-4 py-16 text-center">
              <h2 className="text-3xl font-bold text-primary mb-4">Aramıza Katılın ve Kazanmaya Başlayın!</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                  İster yük sahibi olun ister nakliyeci, platformumuzda sizin için bir yer var. Hemen kayıt olun, fırsatları kaçırmayın.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg py-3 px-8">
                      <Link href="/yeni-ilan">
                          <FilePlus2 className="mr-2 h-5 w-5" /> Ücretsiz İlan Ver
                      </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg py-3 px-8 border-primary text-primary hover:bg-primary/10 hover:text-primary">
                       <Link href="/auth/kayit">
                          <Truck className="mr-2 h-5 w-5" /> Nakliyeci Olarak Kaydol
                      </Link>
                  </Button>
              </div>
          </div>
      </section>

      <section className="py-16">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-center mb-2">Nakliyeci Dünyası Yanıtlıyor</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">Sıkça sorulan sorularla aklınızdaki tüm soru işaretlerini giderin.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="p-4 sm:p-6 bg-muted/30 rounded-lg">
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>İlan vermek ücretli mi?</AccordionTrigger>
                        <AccordionContent>
                        Hayır, platformumuzda temel yük ve evden eve nakliyat ilanı vermek tamamen ücretsizdir. İlanınızı oluşturarak dakikalar içinde binlerce nakliyeciden teklif almaya başlayabilirsiniz.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger>Fiyat tekliflerini nasıl alırım?</AccordionTrigger>
                        <AccordionContent>
                        İlanınız yayınlandıktan sonra, ilanınızla ilgilenen nakliye firmaları size doğrudan platform üzerinden veya belirttiğiniz iletişim kanalları aracılığıyla fiyat tekliflerini iletecektir.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger>Güvenilir nakliyeciyi nasıl seçerim?</AccordionTrigger>
                        <AccordionContent>
                        Teklif veren firmaların profillerini inceleyebilirsiniz. Profillerinde daha önceki müşteri yorumları, puanları ve firma hakkında detaylı bilgiler bulunur. Bu bilgiler doğru seçimi yapmanıza yardımcı olur.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-4">
                        <AccordionTrigger>Ödemeyi nasıl yapıyorum?</AccordionTrigger>
                        <AccordionContent>
                        Ödeme süreci tamamen siz ve anlaştığınız nakliye firması arasındadır. Platformumuz ödeme işlemlerine aracılık etmez. Ödeme koşullarını firma ile doğrudan görüşmeniz gerekmektedir.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-5" className="border-b-0">
                        <AccordionTrigger>Taşıma sürecinde eşyalarım sigortalı mı?</AccordionTrigger>
                        <AccordionContent>
                        Sigorta konusu, hizmet aldığınız nakliye firmasının politikalarına bağlıdır. Anlaşma yapmadan önce nakliye firmasına sigorta seçeneklerini ve kapsamını mutlaka sormanızı öneririz.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
            <div className="hidden lg:flex justify-center">
                 <Image 
                      src="https://issever.co/wp-content/uploads/2025/06/nakliyeci-hakkimizda.svg"
                      alt="Sıkça sorulan sorular için yardımcı karakter"
                      width={450}
                      height={450}
                      className="rounded-xl"
                      data-ai-hint="support team"
                  />
            </div>
        </div>
      </section>

    </div>
  );
}
