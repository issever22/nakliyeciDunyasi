
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPANY_CATEGORIES } from '@/lib/constants';
import { TURKISH_CITIES } from '@/lib/locationData';
import type { CompanyFilterOptions } from '@/types';
import { Filter, RotateCcw, Search, List, MapPin } from 'lucide-react';

interface CompanyFiltersProps {
  onFilterChange: (filters: CompanyFilterOptions) => void;
  initialSearchTerm?: string;
  isLoading?: boolean;
}

const ALL_OPTIONS_VALUE = "_ALL_"; 

export default function CompanyFilters({ onFilterChange, initialSearchTerm = '', isLoading = false }: CompanyFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');

  const handleApplyFilters = () => {
    onFilterChange({
      searchTerm,
      category,
      city,
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategory('');
    setCity('');
    onFilterChange({
      searchTerm: '',
      category: '',
      city: '',
    });
  };

  useEffect(() => {
    const handleEnterPress = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && document.activeElement?.id === 'company-search-input') {
            handleApplyFilters();
        }
    };
    window.addEventListener('keydown', handleEnterPress);
    return () => {
        window.removeEventListener('keydown', handleEnterPress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, category, city]);

  return (
    <div className="p-4 bg-card border rounded-lg shadow-md mb-8">
      <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3">
        <div className="flex-grow w-full sm:w-auto">
          <Label htmlFor="company-search-input">Firma Adı</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="company-search-input" 
              placeholder="Firma adıyla ara..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="company-category-filter">Kategori</Label>
           <div className="relative mt-1">
            <List className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
             <Select
              value={category || ALL_OPTIONS_VALUE}
              onValueChange={(value) => setCategory(value === ALL_OPTIONS_VALUE ? '' : value)}
              disabled={isLoading}
            >
              <SelectTrigger id="company-category-filter" className="w-full pl-9 h-9">
                <SelectValue placeholder="Tüm Kategoriler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_OPTIONS_VALUE}>Tüm Kategoriler</SelectItem>
                {COMPANY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
           </div>
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="company-city-filter">Şehir</Label>
          <div className="relative mt-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Select
                value={city || ALL_OPTIONS_VALUE}
                onValueChange={(value) => setCity(value === ALL_OPTIONS_VALUE ? '' : value)}
                disabled={isLoading}
            >
                <SelectTrigger id="company-city-filter" className="w-full pl-9 h-9">
                    <SelectValue placeholder="Tüm Şehirler" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ALL_OPTIONS_VALUE}>Tüm Şehirler</SelectItem>
                    {TURKISH_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleApplyFilters} size="sm" className="h-9" disabled={isLoading}>
                <Filter size={16} className="mr-2" />
                Filtrele
            </Button>
            <Button onClick={handleResetFilters} size="sm" variant="outline" className="h-9" disabled={isLoading}>
                <RotateCcw size={16} />
            </Button>
        </div>
      </div>
    </div>
  );
}

const Label = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className="block text-xs font-medium text-muted-foreground">
    {children}
  </label>
);
