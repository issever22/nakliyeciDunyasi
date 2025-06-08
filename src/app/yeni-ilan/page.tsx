"use client";

import FreightForm from '@/components/freight/FreightForm';
import { useRequireAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { Freight } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewFreightPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();

  const handleSuccessfulSubmit = (newFreight: Freight) => {
    // Optionally, redirect to the main page or a "my listings" page
    // For now, the form itself shows a toast and resets.
    // If you want to redirect:
    // router.push('/'); 
    console.log("New freight posted, potentially redirecting or updating UI.", newFreight);
  };

  if (loading) {
     return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
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
    // This should ideally not be reached if useRequireAuth works correctly,
    // but as a fallback or if loading finishes and user is still null.
    return <p>İlan vermek için giriş yapmalısınız. Yönlendiriliyorsunuz...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">Yeni Nakliye İlanı Oluştur</h1>
        <p className="text-muted-foreground mt-2">Taşınacak yükünüz için detayları girin.</p>
      </div>
      <FreightForm onSubmitSuccess={handleSuccessfulSubmit} />
    </div>
  );
}
