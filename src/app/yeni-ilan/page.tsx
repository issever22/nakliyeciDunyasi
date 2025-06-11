
"use client";

import { useState } from 'react';
import CommercialFreightForm from '@/components/freight/FreightForm'; 
import ResidentialFreightForm from '@/components/freight/ResidentialFreightForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { Freight, CommercialFreight, ResidentialFreight } from '@/types'; 
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Home, Loader2 } from 'lucide-react';
import { addListing } from '@/services/listingsService'; // Firestore service
import { useToast } from "@/hooks/use-toast";


export default function NewFreightPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedFreightType, setSelectedFreightType] = useState<'Ticari' | 'Evden Eve'>('Ticari');

  const handleSuccessfulSubmit = async (newFreightData: Omit<Freight, 'id' | 'postedAt' | 'userId' | 'postedBy'>) => {
    if (!user) {
        toast({ title: "Hata", description: "İlan vermek için giriş yapmalısınız.", variant: "destructive" });
        return;
    }

    const freightToSave: Omit<Freight, 'id' | 'postedAt'> = {
        ...newFreightData,
        userId: user.id,
        postedBy: newFreightData.companyName || user.name, // postedBy'ı companyName olarak ayarla, yoksa user.name
    };
    
    const newListingId = await addListing(freightToSave);

    if (newListingId) {
      toast({
        title: "İlan Başarıyla Oluşturuldu!",
        description: `${newFreightData.originCity} - ${newFreightData.destinationCity} arası ilanınız yayında.`,
      });
      // Formu temizlemek veya kullanıcıyı başka bir sayfaya yönlendirmek için
      // form bileşenlerinin kendi içlerinde reset mekanizmaları olmalı veya burada state'leri sıfırlamalıyız.
      // Şimdilik ana sayfaya yönlendirelim.
      router.push('/'); 
    } else {
      toast({ title: "Hata", description: "İlan oluşturulurken bir sorun oluştu.", variant: "destructive" });
    }
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
    // useRequireAuth zaten yönlendirme yapacak, ama bir fallback mesajı iyi olabilir.
    return <div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Giriş sayfasına yönlendiriliyorsunuz...</p>
    </div>;
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
          {/* onSubmitSuccess şimdi Omit<CommercialFreight, 'id' | 'postedAt' | 'userId' | 'postedBy'> bekliyor */}
          <CommercialFreightForm onSubmitSuccess={handleSuccessfulSubmit as (data: Omit<CommercialFreight, 'id' | 'postedAt' | 'userId' | 'postedBy'>) => void} />
        </TabsContent>
        <TabsContent value="Evden Eve">
          {/* onSubmitSuccess şimdi Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId' | 'postedBy'> bekliyor */}
          <ResidentialFreightForm onSubmitSuccess={handleSuccessfulSubmit as (data: Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId' | 'postedBy'>) => void} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
