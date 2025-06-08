
"use client";

import { useState, useEffect, useMemo } from 'react';
import FreightCard from '@/components/freight/FreightCard';
import FreightFilters from '@/components/freight/FreightFilters';
import type { Freight, VehicleNeeded, ShipmentScope } from '@/types'; // Updated VehicleType to VehicleNeeded
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';

// Mock data - replace with API call in a real app
const mockFreightData: Freight[] = [
  { 
    id: '1', 
    userId: 'user1',
    companyName: 'Yılmaz Nakliyat',
    contactPerson: 'Ahmet Yılmaz',
    contactEmail: 'ahmet@yilmaznakliyat.com',
    mobilePhone: '05321234567',
    cargoType: 'Gıda',
    vehicleNeeded: 'Kamyon',
    loadingType: 'Komple',
    cargoForm: 'Paletli',
    cargoWeight: 10,
    cargoWeightUnit: 'Ton',
    description: 'Ev eşyası taşınacak, acil.',
    originCountry: 'TR',
    originCity: 'İstanbul',
    originDistrict: 'Esenyurt',
    destinationCountry: 'TR',
    destinationCity: 'Ankara',
    destinationDistrict: 'Çankaya',
    loadingDate: new Date(Date.now() - 1000 * 60 * 30).toISOString().split('T')[0],
    isContinuousLoad: false,
    postedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    shipmentScope: 'Yurt İçi',
    postedBy: 'Yılmaz Nakliyat'
  },
  { 
    id: '2', 
    userId: 'user2',
    companyName: 'Demir Lojistik',
    contactPerson: 'Ayşe Demir',
    contactEmail: 'ayse@demirlojistik.com',
    mobilePhone: '05559876543',
    cargoType: 'Sanayi Üretimi',
    vehicleNeeded: '13.60 Kapalı Tır',
    loadingType: 'Komple',
    cargoForm: 'Kolili',
    cargoWeight: 20,
    cargoWeightUnit: 'Ton',
    description: 'Paletli yük, 20 ton.',
    originCountry: 'TR',
    originCity: 'İzmir',
    originDistrict: 'Bornova',
    destinationCountry: 'TR',
    destinationCity: 'Bursa',
    destinationDistrict: 'Osmangazi',
    loadingDate: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString().split('T')[0],
    isContinuousLoad: false,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    shipmentScope: 'Yurt İçi',
    postedBy: 'Demir Lojistik'
  },
  { 
    id: '3', 
    userId: 'user3',
    companyName: 'Taşıma A.Ş.',
    contactPerson: 'Mehmet Can',
    contactEmail: 'mcan@tasima.com.tr',
    mobilePhone: '05423332211',
    cargoType: 'Hafif Tonajlı Yük',
    vehicleNeeded: 'Kamyonet',
    loadingType: 'Parsiyel',
    cargoForm: 'Diğer',
    cargoWeight: 500,
    cargoWeightUnit: 'Kg',
    description: 'Küçük paketler.',
    originCountry: 'TR',
    originCity: 'Adana',
    originDistrict: 'Seyhan',
    destinationCountry: 'TR',
    destinationCity: 'Mersin',
    destinationDistrict: 'Akdeniz',
    loadingDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0],
    isContinuousLoad: true,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    shipmentScope: 'Yurt İçi',
    postedBy: 'Taşıma A.Ş.'
  },
   { 
    id: '6', 
    userId: 'user4',
    companyName: 'Global Lojistik GmbH',
    contactPerson: 'Hans Müller',
    contactEmail: 'hans@globallog.de',
    mobilePhone: '+491701234567',
    cargoType: 'Sanayi Üretimi',
    vehicleNeeded: 'Mega Araç',
    loadingType: 'Komple',
    cargoForm: 'Paletli',
    cargoWeight: 24,
    cargoWeightUnit: 'Ton',
    description: 'Komple ithalat yükü, ADR gerektirmez.',
    originCountry: 'DE',
    originCity: 'Hamburg', // No district for non-TR example
    destinationCountry: 'TR',
    destinationCity: 'İstanbul',
    destinationDistrict: 'Tuzla',
    loadingDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().split('T')[0],
    isContinuousLoad: false,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    shipmentScope: 'Yurt Dışı',
    postedBy: 'Global Lojistik GmbH'
  },
  { 
    id: '7', 
    userId: 'user5',
    companyName: 'Proje Taşımacılık A.Ş.',
    contactPerson: 'Leyla Veli',
    contactEmail: 'leyla@projetasima.com',
    mobilePhone: '05339998877',
    cargoType: 'İnşaat Malzemeleri',
    vehicleNeeded: 'Proje Yükü', // using the new type
    loadingType: 'Tonajlı',
    cargoForm: 'Diğer',
    cargoWeight: 150,
    cargoWeightUnit: 'Ton',
    description: 'Ağır sanayi ekipmanı, uzun vadeli proje.',
    originCountry: 'TR',
    originCity: 'İstanbul',
    originDistrict: 'Pendik',
    destinationCountry: 'AZ', // Azerbaijan
    destinationCity: 'Bakü',
    loadingDate: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString().split('T')[0],
    isContinuousLoad: true,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    shipmentScope: 'Yurt Dışı',
    postedBy: 'Proje Taşımacılık A.Ş.'
  },
];

export default function HomePage() {
  const [allFreights, setAllFreights] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Updated filters to reflect new data structure. Old origin/destination are now city-based.
  const [filters, setFilters] = useState<{ originCity?: string; destinationCity?: string; vehicleNeeded?: VehicleNeeded; shipmentScope?: ShipmentScope; sortBy?: string }>({});

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAllFreights(mockFreightData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleFilter = (newFilters: { originCity?: string; destinationCity?: string; vehicleNeeded?: VehicleNeeded; shipmentScope?: ShipmentScope; sortBy?: string }) => {
    setFilters(newFilters);
  };

  // Memoized filtering and sorting logic
  const filteredFreights = useMemo(() => {
    let freights = [...allFreights];
    if (filters.originCity) {
      // Ensure originCity is treated as string for includes
      freights = freights.filter(f => String(f.originCity).toLowerCase().includes(filters.originCity!.toLowerCase()));
    }
    if (filters.destinationCity) {
      // Ensure destinationCity is treated as string for includes
      freights = freights.filter(f => String(f.destinationCity).toLowerCase().includes(filters.destinationCity!.toLowerCase()));
    }
    if (filters.vehicleNeeded) {
      freights = freights.filter(f => f.vehicleNeeded === filters.vehicleNeeded);
    }
    if (filters.shipmentScope) {
      freights = freights.filter(f => f.shipmentScope === filters.shipmentScope);
    }
    if (filters.sortBy === 'oldest') {
      freights.sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime());
    } else { // Default to newest
      freights.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }
    return freights;
  }, [allFreights, filters]);


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
        {isLoading ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
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
