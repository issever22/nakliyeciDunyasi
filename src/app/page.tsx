
"use client";

import { useState, useEffect, useMemo } from 'react';
import FreightCard from '@/components/freight/FreightCard';
import FreightFilters from '@/components/freight/FreightFilters';
import type { Freight, VehicleType } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import Image from 'next/image'; // Added import for next/image

// Mock data - replace with API call in a real app
const mockFreightData: Freight[] = [
  { id: '1', origin: 'İstanbul', destination: 'Ankara', vehicleType: 'Kamyon', details: 'Ev eşyası taşınacak, acil.', postedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), postedBy: 'Ahmet Yılmaz', userId: 'user1' },
  { id: '2', origin: 'İzmir', destination: 'Bursa', vehicleType: 'Tır', details: 'Paletli yük, 20 ton.', postedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), postedBy: 'Ayşe Demir', userId: 'user2' },
  { id: '3', origin: 'Adana', destination: 'Mersin', vehicleType: 'Kamyonet', details: 'Küçük paketler.', postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), postedBy: 'Taşıma A.Ş.', userId: 'user3' },
  { id: '4', origin: 'Ankara', destination: 'İstanbul', vehicleType: 'Panelvan', details: 'Kırılacak eşya, özenli taşıma.', postedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), postedBy: 'Can Nakliyat', userId: 'user1' },
  { id: '5', origin: 'İstanbul', destination: 'Antalya', vehicleType: 'Kamyon', details: 'Mobilya sevkiyatı.', postedAt: new Date().toISOString(), postedBy: 'Hızlı Kargo', userId: 'user2' },
];

export default function HomePage() {
  const [allFreights, setAllFreights] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{ origin?: string; destination?: string; vehicleType?: VehicleType; sortBy?: string }>({});

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAllFreights(mockFreightData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleFilter = (newFilters: { origin?: string; destination?: string; vehicleType?: VehicleType; sortBy?: string }) => {
    setFilters(newFilters);
  };

  // Memoized filtering and sorting logic
  const filteredFreights = useMemo(() => {
    let freights = [...allFreights];
    if (filters.origin) {
      freights = freights.filter(f => f.origin.toLowerCase().includes(filters.origin!.toLowerCase()));
    }
    if (filters.destination) {
      freights = freights.filter(f => f.destination.toLowerCase().includes(filters.destination!.toLowerCase()));
    }
    if (filters.vehicleType) {
      freights = freights.filter(f => f.vehicleType === filters.vehicleType);
    }
    if (filters.sortBy === 'oldest') {
      freights.sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime());
    } else { // Default to newest
      freights.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }
    return freights;
  }, [allFreights, filters]);


  return (
    <div className="space-y-10"> {/* Increased spacing */}
      <section className="relative h-[400px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl group">
        <Image
          src="https://placehold.co/1600x600.png"
          alt="Nakliye ve lojistik platformu arka planı"
          layout="fill"
          objectFit="cover"
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
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => ( // Increased skeleton count for better visual
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8"> {/* Adjusted gap */}
            {filteredFreights.map((freight) => (
              <FreightCard key={freight.id} freight={freight} />
            ))}
          </div>
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
