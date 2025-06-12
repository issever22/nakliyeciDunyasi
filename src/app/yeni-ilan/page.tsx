
"use client";

import { useState, useCallback } from 'react';
import CommercialFreightForm from '@/components/freight/FreightForm'; 
import ResidentialFreightForm from '@/components/freight/ResidentialFreightForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireAuth } from '@/hooks/useAuth'; // Ensures user is logged in
import { useRouter } from 'next/navigation';
import type { CommercialFreight, ResidentialFreight, FreightCreationData } from '@/types'; 
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Home, Loader2, AlertTriangle } from 'lucide-react';
import { addListing } from '@/services/listingsService';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewFreightPage() {
  const { user, loading: authLoading, isAuthenticated } = useRequireAuth(); // useRequireAuth handles redirection
  const router = useRouter();
  const { toast } = useToast();
  const [selectedFreightType, setSelectedFreightType] = useState<'Ticari' | 'Evden Eve'>('Ticari');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = useCallback(async (newFreightData: FreightCreationData) => {
    if (!user || !isAuthenticated) {
        toast({ title: "Giriş Gerekli", description: "İlan oluşturmak için giriş yapmalısınız.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    setIsSubmitting(true);
    try {
      const newListingId = await addListing(user.id, newFreightData);
      if (newListingId) {
        toast({
          title: "İlan Başarıyla Oluşturuldu!",
          description: `${newFreightData.originCity} - ${newFreightData.destinationCity} arası ilanınız yayında.`,
          className: "bg-green-500 text-white",
        });
        router.push('/'); 
      } else {
        throw new Error("İlan ID'si alınamadı.");
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      toast({ title: "Hata", description: "İlan oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, isAuthenticated, router, toast]);

  if (authLoading) {
     return (
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <Skeleton className="h-10 w-1/3 mx-auto mb-4" />
        <Skeleton className="h-12 w-full md:w-2/3 mx-auto" /> 
        <div className="p-6 bg-card border rounded-lg shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          </div>
          <div className="space-y-2"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-10 w-full" /></div>
          <div className="space-y-2"><Skeleton className="h-6 w-1/4" /><Skeleton className="h-24 w-full" /></div>
          <Skeleton className="h-12 w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !authLoading) {
    // This should ideally not be seen as useRequireAuth redirects, but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Erişim Reddedildi</h2>
        <p className="text-muted-foreground mb-6">İlan oluşturmak için lütfen giriş yapınız.</p>
        <Button asChild>
          <Link href="/auth/giris">Giriş Yap</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary">Yeni İlan Oluştur</h1>
        <p className="text-muted-foreground mt-2">Lütfen ilan türünü seçin ve detayları girin.</p>
      </div>

      <Tabs value={selectedFreightType} onValueChange={(value) => setSelectedFreightType(value as 'Ticari' | 'Evden Eve')} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Ticari" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner">
            <Truck size={18}/> Ticari Yük
          </TabsTrigger>
          <TabsTrigger value="Evden Eve" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner">
            <Home size={18}/> Evden Eve Nakliyat
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Ticari">
          <CommercialFreightForm 
            onSubmitSuccess={handleFormSubmit as (data: Omit<CommercialFreight, 'id' | 'postedAt' | 'userId'>) => Promise<void>} 
          />
        </TabsContent>
        <TabsContent value="Evden Eve">
          <ResidentialFreightForm 
            onSubmitSuccess={handleFormSubmit as (data: Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId'>) => Promise<void>} 
          />
        </TabsContent>
      </Tabs>
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}
