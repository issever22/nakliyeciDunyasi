
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SHIPMENT_SCOPES, FREIGHT_TYPES } from '@/lib/constants'; // VEHICLES_NEEDED will come from DB
import type { VehicleNeeded as VehicleNeededName, ShipmentScope, FreightType, FreightFilterOptions, VehicleTypeSetting } from '@/types';
import { Filter, RotateCcw, MapPin, Truck as VehicleIcon, Globe, ListFilter, Loader2 } from 'lucide-react';
import { getAllVehicleTypes } from '@/services/vehicleTypesService';
import { useToast } from '@/hooks/use-toast';

interface FreightFiltersProps {
  onFilterChange: (filters: FreightFilterOptions) => void;
  isLoading?: boolean;
}

const ALL_OPTIONS_VALUE = "_ALL_"; 

export default function FreightFilters({ onFilterChange, isLoading: pageLoading }: FreightFiltersProps) {
  const { toast } = useToast();
  const [originCity, setOriginCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [vehicleNeeded, setVehicleNeeded] = useState<VehicleNeededName | ''>('');
  const [shipmentScope, setShipmentScope] = useState<ShipmentScope | ''>('');
  const [freightType, setFreightType] = useState<FreightType | ''>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<VehicleTypeSetting[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const vehicles = await getAllVehicleTypes();
        setVehicleTypeOptions(vehicles.filter(v => v.isActive));
      } catch (error) {
        console.error("Error fetching vehicle type options for filters:", error);
        toast({ title: "Hata", description: "Filtre seçenekleri yüklenemedi.", variant: "destructive" });
      }
      setOptionsLoading(false);
    };
    fetchOptions();
  }, [toast]);

  const handleSubmitFilters = () => {
    const filtersToApply: FreightFilterOptions = {};
    if (originCity.trim()) filtersToApply.originCity = originCity.trim();
    if (destinationCity.trim()) filtersToApply.destinationCity = destinationCity.trim();
    if (vehicleNeeded) filtersToApply.vehicleNeeded = vehicleNeeded;
    if (shipmentScope) filtersToApply.shipmentScope = shipmentScope;
    if (freightType) filtersToApply.freightType = freightType;
    filtersToApply.sortBy = sortBy;
    onFilterChange(filtersToApply);
  };

  const handleResetFilters = () => {
    setOriginCity('');
    setDestinationCity('');
    setVehicleNeeded('');
    setShipmentScope('');
    setFreightType('');
    setSortBy('newest');
    onFilterChange({ sortBy: 'newest' }); 
  };

  const disableCommercialFilters = freightType === 'Evden Eve';
  const isAnyLoading = pageLoading || optionsLoading;

  return (
    <div className="p-6 bg-card border rounded-lg shadow-lg space-y-6 mb-8">
      <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
        <Filter size={22}/> İlanları Filtrele
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="freightType">İlan Tipi</Label>
          <div className="relative mt-1">
            <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select
              value={freightType || ALL_OPTIONS_VALUE}
              onValueChange={(value) => setFreightType(value === ALL_OPTIONS_VALUE ? '' : value as FreightType)}
              disabled={isAnyLoading}
            >
              <SelectTrigger className="w-full pl-9">
                <SelectValue placeholder="Tüm İlan Tipleri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTIONS_VALUE}>Tüm İlan Tipleri</SelectItem>
                {FREIGHT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="originCity">Nereden (Şehir)</Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="originCity" 
              placeholder="Örn: İstanbul" 
              value={originCity} 
              onChange={(e) => setOriginCity(e.target.value)}
              className="pl-9"
              disabled={isAnyLoading}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="destinationCity">Nereye (Şehir)</Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="destinationCity" 
              placeholder="Örn: Ankara" 
              value={destinationCity} 
              onChange={(e) => setDestinationCity(e.target.value)}
              className="pl-9"
              disabled={isAnyLoading}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="shipmentScope">Gönderi Kapsamı (Ticari)</Label>
          <div className="relative mt-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select 
              value={shipmentScope || ALL_OPTIONS_VALUE} 
              onValueChange={(value) => setShipmentScope(value === ALL_OPTIONS_VALUE ? '' : value as ShipmentScope)}
              disabled={isAnyLoading || disableCommercialFilters}
            >
              <SelectTrigger className="w-full pl-9">
                <SelectValue placeholder="Tüm Kapsamlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTIONS_VALUE}>Tüm Kapsamlar</SelectItem>
                {SHIPMENT_SCOPES.map((scope) => (
                  <SelectItem key={scope} value={scope}>{scope}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="vehicleNeeded">Araç Tipi (Ticari)</Label>
          <div className="relative mt-1">
            <VehicleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Select 
              value={vehicleNeeded || ALL_OPTIONS_VALUE} 
              onValueChange={(value) => setVehicleNeeded(value === ALL_OPTIONS_VALUE ? '' : value as VehicleNeededName)}
              disabled={isAnyLoading || disableCommercialFilters}
            >
              <SelectTrigger className="w-full pl-9">
                <SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Tüm Araç Tipleri"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTIONS_VALUE}>Tüm Araç Tipleri</SelectItem>
                {vehicleTypeOptions.map((type) => (
                  <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="sortBy">Sırala</Label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'newest' | 'oldest')} disabled={isAnyLoading}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Sıralama Ölçütü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">En Yeni İlanlar</SelectItem>
              <SelectItem value="oldest">En Eski İlanlar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t mt-4">
        <Button onClick={handleSubmitFilters} className="w-full sm:w-auto bg-primary hover:bg-primary/90 flex-grow" disabled={isAnyLoading}>
          {isAnyLoading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Filter size={18} className="mr-2" /> }
          Filtrele
        </Button>
        <Button onClick={handleResetFilters} variant="outline" className="w-full sm:w-auto flex-grow" disabled={isAnyLoading}>
          <RotateCcw size={18} className="mr-2" /> Filtreleri Temizle
        </Button>
      </div>
    </div>
  );
}

// Helper Label component if not globally available
const Label = ({ htmlFor, children, className }: { htmlFor?: string, children: React.ReactNode, className?: string }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-muted-foreground ${className || ''}`}>
    {children}
  </label>
);

