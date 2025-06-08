
"use client";

import { useState, useEffect, useMemo } from 'react';
import FreightCard from '@/components/freight/FreightCard';
import FreightFilters from '@/components/freight/FreightFilters';
import type { Freight, VehicleNeeded, ShipmentScope, FreightType } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'; // Ensure Card components are imported
import Image from 'next/image';

const mockFreightData: Freight[] = [
  { 
    id: '1', 
    userId: 'user1',
    freightType: 'Ticari',
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
    freightType: 'Ticari',
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
    id: 'ev1', 
    userId: 'userEv1',
    freightType: 'Evden Eve',
    companyName: 'Aslan Ev Taşıma',
    contactPerson: 'Veli Aslan',
    contactEmail: 'veli@aslannakliyat.com',
    mobilePhone: '05331112233',
    residentialTransportType: 'Şehirlerarası Taşımacılık',
    residentialPlaceType: 'Ev',
    residentialElevatorStatus: 'Yükleme Adresinde Var',
    residentialFloorLevel: '3’ncü Kat',
    description: '3+1 Ev eşyası, beyaz eşyalar ve mobilyalar. Paketleme dahil.',
    originCountry: 'TR',
    originCity: 'İstanbul',
    originDistrict: 'Kadıköy',
    destinationCountry: 'TR',
    destinationCity: 'İzmir',
    destinationDistrict: 'Alsancak',
    loadingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0], // 5 days from now
    postedAt: new Date().toISOString(),
    postedBy: 'Aslan Ev Taşıma'
  },
];

export default function HomePage() {
  const [allFreights, setAllFreights] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{ 
    originCity?: string; 
    destinationCity?: string; 
    vehicleNeeded?: VehicleNeeded; 
    shipmentScope?: ShipmentScope; 
    freightType?: FreightType;
    sortBy?: string 
  }>({});

  useEffect(() => {
    setTimeout(() => {
      setAllFreights(mockFreightData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const filteredFreights = useMemo(() => {
    let freights = [...allFreights];
    if (filters.originCity) {
      freights = freights.filter(f => String(f.originCity).toLowerCase().includes(filters.originCity!.toLowerCase()));
    }
    if (filters.destinationCity) {
      freights = freights.filter(f => String(f.destinationCity).toLowerCase().includes(filters.destinationCity!.toLowerCase()));
    }
    if (filters.freightType) {
      freights = freights.filter(f => f.freightType === filters.freightType);
    }
    // Commercial specific filters only apply if freightType is Ticari or no freightType filter is active
    if (!filters.freightType || filters.freightType === 'Ticari') {
        if (filters.vehicleNeeded) {
        freights = freights.filter(f => f.freightType === 'Ticari' && f.vehicleNeeded === filters.vehicleNeeded);
        }
        if (filters.shipmentScope) {
        freights = freights.filter(f => f.freightType === 'Ticari' && f.shipmentScope === filters.shipmentScope);
        }
    } else if (filters.freightType === 'Evden Eve') {
        // If filtering for 'Evden Eve', exclude listings that don't match if vehicle/scope filters are also present
        // This part might need more specific filters for Evden Eve later
        if(filters.vehicleNeeded || filters.shipmentScope) {
            freights = freights.filter(f => f.freightType === 'Evden Eve');
        }
    }


    if (filters.sortBy === 'oldest') {
      freights.sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime());
    } else { 
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
