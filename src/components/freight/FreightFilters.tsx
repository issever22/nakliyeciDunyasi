
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VEHICLES_NEEDED, SHIPMENT_SCOPES } from '@/lib/constants'; // Updated to VEHICLES_NEEDED
import type { VehicleNeeded, ShipmentScope } from '@/types'; // Updated to VehicleNeeded
import { Filter, RotateCcw, MapPin, Truck as VehicleIcon, Globe } from 'lucide-react';

interface FreightFiltersProps {
  // Updated filter props to reflect new data structure
  onFilter: (filters: { originCity?: string; destinationCity?: string; vehicleNeeded?: VehicleNeeded; shipmentScope?: ShipmentScope; sortBy?: string }) => void;
}

const ALL_VEHICLES_SENTINEL = "_ALL_VEHICLES_";
const ALL_SHIPMENT_SCOPES_SENTINEL = "_ALL_SCOPES_";

export default function FreightFilters({ onFilter }: FreightFiltersProps) {
  const [originCity, setOriginCity] = useState(''); // Was origin
  const [destinationCity, setDestinationCity] = useState(''); // Was destination
  const [vehicleNeeded, setVehicleNeeded] = useState<VehicleNeeded | ''>(''); // Was vehicleType
  const [shipmentScope, setShipmentScope] = useState<ShipmentScope | ''>('');
  const [sortBy, setSortBy] = useState('newest');

  const handleFilter = () => {
    onFilter({ 
      originCity: originCity || undefined, 
      destinationCity: destinationCity || undefined, 
      vehicleNeeded: vehicleNeeded || undefined, 
      shipmentScope: shipmentScope || undefined,
      sortBy 
    });
  };

  const handleReset = () => {
    setOriginCity('');
    setDestinationCity('');
    setVehicleNeeded('');
    setShipmentScope('');
    setSortBy('newest');
    onFilter({}); // Reset with empty filters, which now matches the updated types
  };

  return (
    <div className="p-6 bg-card border rounded-lg shadow-md space-y-6 mb-8">
      <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
        <Filter size={24}/> İlanları Filtrele
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label htmlFor="originCity" className="block text-sm font-medium text-muted-foreground mb-1">Nereden (Şehir)</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              id="originCity" 
              placeholder="Örn: İstanbul" 
              value={originCity} 
              onChange={(e) => setOriginCity(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="destinationCity" className="block text-sm font-medium text-muted-foreground mb-1">Nereye (Şehir)</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              id="destinationCity" 
              placeholder="Örn: Ankara" 
              value={destinationCity} 
              onChange={(e) => setDestinationCity(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="shipmentScope" className="block text-sm font-medium text-muted-foreground mb-1">Gönderi Kapsamı</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Select 
              value={shipmentScope === '' ? ALL_SHIPMENT_SCOPES_SENTINEL : shipmentScope} 
              onValueChange={(selectedValue) => {
                if (selectedValue === ALL_SHIPMENT_SCOPES_SENTINEL) {
                  setShipmentScope('');
                } else {
                  setShipmentScope(selectedValue as ShipmentScope);
                }
              }}
            >
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Tüm Kapsamlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SHIPMENT_SCOPES_SENTINEL}>Tüm Kapsamlar</SelectItem>
                {SHIPMENT_SCOPES.map((scope) => (
                  <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label htmlFor="vehicleNeeded" className="block text-sm font-medium text-muted-foreground mb-1">Araç Tipi</label>
          <div className="relative">
            <VehicleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Select 
              value={vehicleNeeded === '' ? ALL_VEHICLES_SENTINEL : vehicleNeeded} 
              onValueChange={(selectedValue) => {
                if (selectedValue === ALL_VEHICLES_SENTINEL) {
                  setVehicleNeeded('');
                } else {
                  setVehicleNeeded(selectedValue as VehicleNeeded);
                }
              }}
            >
              <SelectTrigger className="w-full pl-10">
                <SelectValue placeholder="Tüm Araç Tipleri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VEHICLES_SENTINEL}>Tüm Araç Tipleri</SelectItem>
                {VEHICLES_NEEDED.map((type) => (
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
