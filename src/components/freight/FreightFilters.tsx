"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VEHICLE_TYPES } from '@/lib/constants';
import type { VehicleType } from '@/types';
import { Filter, RotateCcw, MapPin, Truck as VehicleIcon } from 'lucide-react';

interface FreightFiltersProps {
  onFilter: (filters: { origin?: string; destination?: string; vehicleType?: VehicleType; sortBy?: string }) => void;
}

export default function FreightFilters({ onFilter }: FreightFiltersProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [sortBy, setSortBy] = useState('newest');

  const handleFilter = () => {
    onFilter({ 
      origin: origin || undefined, 
      destination: destination || undefined, 
      vehicleType: vehicleType || undefined, 
      sortBy 
    });
  };

  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setVehicleType('');
    setSortBy('newest');
    onFilter({}); // Reset all filters
  };

  return (
    <div className="p-6 bg-card border rounded-lg shadow-md space-y-6 mb-8">
      <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
        <Filter size={24}/> İlanları Filtrele
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-muted-foreground mb-1">Nereden</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              id="origin" 
              placeholder="Örn: İstanbul" 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-muted-foreground mb-1">Nereye</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              id="destination" 
              placeholder="Örn: Ankara" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="vehicleType" className="block text-sm font-medium text-muted-foreground mb-1">Araç Tipi</label>
          <div className="relative">
            <VehicleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Select value={vehicleType} onValueChange={(value) => setVehicleType(value as VehicleType | '')}>
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Tüm Araç Tipleri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm Araç Tipleri</SelectItem>
                {VEHICLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-muted-foreground mb-1">Sırala</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sıralama Ölçütü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">En Yeni İlanlar</SelectItem>
              <SelectItem value="oldest">En Eski İlanlar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button onClick={handleFilter} className="w-full sm:w-auto bg-primary hover:bg-primary/90 flex-grow">
          <Filter size={18} className="mr-2" /> Filtrele
        </Button>
        <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto flex-grow">
          <RotateCcw size={18} className="mr-2" /> Filtreleri Temizle
        </Button>
      </div>
    </div>
  );
}
