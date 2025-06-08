
"use client";

import { useState } from 'react';
import CommercialFreightForm from '@/components/freight/FreightForm'; // Renamed for clarity
import ResidentialFreightForm from '@/components/freight/ResidentialFreightForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { Freight, CommercialFreight, ResidentialFreight } from '@/types'; // Import all types
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Home } from 'lucide-react';

export default function NewFreightPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const [selectedFreightType, setSelectedFreightType] = useState<'Ticari' | 'Evden Eve'>('Ticari');

  const handleSuccessfulSubmit = (newFreight: Freight) => { // Freight can be Commercial or Residential
    console.log("New freight posted:", newFreight);
    // Optionally, redirect after successful submission
    // router.push('/'); 
  };

  if (loading) {
     return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-12 w-full md:w-2/3" /> 
        <div className="p-6 bg-card border rounded-lg shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          </div>
          <div className="space-y-2"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-24 w-full" /></div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <p>İlan vermek için giriş yapmalısınız. Yönlendiriliyorsunuz...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">Yeni İlan Oluştur</h1>
        <p className="text-muted-foreground mt-2">Lütfen ilan türünü seçin ve detayları girin.</p>
      </div>

      <Tabs value={selectedFreightType} onValueChange={(value) => setSelectedFreightType(value as 'Ticari' | 'Evden Eve')} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Ticari" className="flex items-center gap-2">
            <Truck size={18}/> Ticari Yük İlanı
          </TabsTrigger>
          <TabsTrigger value="Evden Eve" className="flex items-center gap-2">
            <Home size={18}/> Evden Eve Nakliyat İlanı
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Ticari">
          <CommercialFreightForm onSubmitSuccess={handleSuccessfulSubmit as (newFreight: CommercialFreight) => void} />
        </TabsContent>
        <TabsContent value="Evden Eve">
          <ResidentialFreightForm onSubmitSuccess={handleSuccessfulSubmit as (newFreight: ResidentialFreight) => void} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
