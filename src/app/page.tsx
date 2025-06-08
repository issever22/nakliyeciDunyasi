"use client";

import { useState, useEffect, useMemo } from 'react';
import FreightCard from '@/components/freight/FreightCard';
import FreightFilters from '@/components/freight/FreightFilters';
import type { Freight, VehicleType } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'; // Added import

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
  const [filteredFreights, setFilteredFreights] = useState<Freight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<{ origin?: string; destination?: string; vehicleType?: VehicleType; sortBy?: string }>({});

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAllFreights(mockFreightData);
      setFilteredFreights(mockFreightData); // Initially show all
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleFilter = (newFilters: { origin?: string; destination?: string; vehicleType?: VehicleType; sortBy?: string }) => {
    setFilters(newFilters);
  };

  // Memoized filtering and sorting logic
  const processedFreights = useMemo(() => {
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

  useEffect(() => {
    setFilteredFreights(processedFreights);
  }, [processedFreights]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-primary/10 rounded-lg">
        <div>
          <h1 className="text-3xl font-bold text-primary">Güncel Nakliye İlanları</h1>
          <p className="text-muted-foreground">İhtiyacınıza uygun yükleri bulun veya kendi ilanınızı verin.</p>
        </div>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href="/yeni-ilan">
            <PlusCircle className="mr-2 h-5 w-5" /> Yeni İlan Oluştur
          </Link>
        </Button>
      </div>

      <FreightFilters onFilter={handleFilter} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="w-full">
              <CardHeader className="p-4"><Skeleton className="h-8 w-3/4" /></CardHeader>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter className="p-4"><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredFreights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFreights.map((freight) => (
            <FreightCard key={freight.id} freight={freight} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Uygun İlan Bulunamadı</h2>
          <p className="text-muted-foreground">Filtre kriterlerinizi değiştirmeyi veya daha sonra tekrar kontrol etmeyi deneyin.</p>
        </div>
      )}
    </div>
  );
}
