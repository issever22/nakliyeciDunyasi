
"use client";

import { useState, useCallback } from 'react';
import CommercialFreightForm from '@/components/freight/FreightForm'; 
import ResidentialFreightForm from '@/components/freight/ResidentialFreightForm';
import EmptyVehicleForm from '@/components/freight/EmptyVehicleForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth'; // Keep useAuth to check if a company user is logged in
import { useRouter } from 'next/navigation';
import type { FreightCreationData, CommercialFreight, ResidentialFreight, EmptyVehicleListing } from '@/types'; 
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Home, PackagePlus, Loader2 } from 'lucide-react';
import { addListing } from '@/services/listingsService';
import { useToast } from "@/hooks/use-toast";

export default function NewFreightPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth(); // No longer using useRequireAuth
  const router = useRouter();
  const { toast } = useToast();
  const [selectedFreightType, setSelectedFreightType] = useState<'Yük' | 'Evden Eve' | 'Boş Araç'>('Yük');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = useCallback(async (newFreightData: FreightCreationData) => {
    setIsSubmitting(true);
    let userIdForListing: string | undefined = undefined;
    let finalPostedBy = newFreightData.companyName; // Default for guests
    let finalCompanyName = newFreightData.companyName;
    let finalContactPerson = newFreightData.contactPerson;
    let finalMobilePhone = newFreightData.mobilePhone;
    let finalContactEmail = newFreightData.contactEmail;


    if (isAuthenticated && user && user.role === 'company') {
        userIdForListing = user.id;
        finalPostedBy = user.name; // Company's display name (companyTitle)
        finalCompanyName = user.companyTitle; // From company profile
        finalContactPerson = newFreightData.contactPerson || user.contactFullName; // Use form or profile
        finalMobilePhone = newFreightData.mobilePhone || user.mobilePhone; // Use form or profile
        finalContactEmail = newFreightData.contactEmail || user.email; // Use form or profile
    } else {
        // For guests, ensure all required fields are from the form
        if (!newFreightData.companyName || !newFreightData.contactPerson || !newFreightData.mobilePhone) {
            toast({ title: "Eksik İletişim Bilgisi", description: "Lütfen firma/ad soyad, yetkili kişi ve cep telefonu alanlarını doldurun.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
    }

    try {
      const dataWithUserDetails = {
        ...newFreightData,
        postedBy: finalPostedBy, 
        companyName: finalCompanyName,
        contactPerson: finalContactPerson,
        mobilePhone: finalMobilePhone,
        contactEmail: finalContactEmail,
      };
      
      const newListingId = await addListing(userIdForListing, dataWithUserDetails); // Pass undefined userId for guests
      if (newListingId) {
        toast({
          title: "İlan Başarıyla Oluşturuldu!",
          description: `${dataWithUserDetails.originCity} - ${dataWithUserDetails.destinationCity} arası ilanınız yayında.`,
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

  if (authLoading && !isSubmitting) { // Show skeleton only during initial auth check, not form submission
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

  // No longer redirecting guests, they can access the page.

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary">Yeni İlan Oluştur</h1>
        <p className="text-muted-foreground mt-2">Lütfen ilan türünü seçin ve detayları girin.</p>
      </div>

      <Tabs value={selectedFreightType} onValueChange={(value) => setSelectedFreightType(value as 'Yük' | 'Evden Eve' | 'Boş Araç')} className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Yük" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner">
            <Truck size={18}/> Yük İlanı
          </TabsTrigger>
          <TabsTrigger value="Evden Eve" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner">
            <Home size={18}/> Evden Eve Nakliyat
          </TabsTrigger>
          <TabsTrigger value="Boş Araç" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-inner">
            <PackagePlus size={18}/> Boş Araç İlanı
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Yük">
          <CommercialFreightForm 
            onSubmitSuccess={handleFormSubmit as (data: Omit<CommercialFreight, 'id' | 'postedAt' | 'userId'>) => Promise<void>} 
          />
        </TabsContent>
        <TabsContent value="Evden Eve">
          <ResidentialFreightForm 
            onSubmitSuccess={handleFormSubmit as (data: Omit<ResidentialFreight, 'id' | 'postedAt' | 'userId'>) => Promise<void>} 
          />
        </TabsContent>
        <TabsContent value="Boş Araç">
          <EmptyVehicleForm 
            onSubmitSuccess={handleFormSubmit as (data: Omit<EmptyVehicleListing, 'id' | 'postedAt' | 'userId'>) => Promise<void>} 
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

    