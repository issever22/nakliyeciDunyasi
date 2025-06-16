
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Truck, Route, MapPin, CalendarDays, Loader2, AlertTriangle, Tag } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import type { TransportOffer, VehicleTypeSetting } from '@/types';
import { getTransportOffersByUserId, deleteTransportOffer } from '@/services/transportOffersService';
import { getAllVehicleTypes } from '@/services/vehicleTypesService';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import TransportOfferFormModal from './TransportOfferFormModal'; // New Modal

interface MyTransportOffersTabProps {
  userId: string;
  companyName: string;
}

export default function MyTransportOffersTab({ userId, companyName }: MyTransportOffersTabProps) {
  const { toast } = useToast();
  const [userOffers, setUserOffers] = useState<TransportOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<TransportOffer | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState<VehicleTypeSetting[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  const fetchVehicleOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      const vehicles = await getAllVehicleTypes();
      setVehicleTypeOptions(vehicles.filter(v => v.isActive));
    } catch (error) {
      console.error("Error fetching vehicle type options for offers tab:", error);
      toast({ title: "Hata", description: "Araç tipleri yüklenemedi.", variant: "destructive" });
    }
    setOptionsLoading(false);
  }, [toast]);

  const fetchUserOffers = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const result = await getTransportOffersByUserId(userId);
      if (result.error) {
        console.error("[MyTransportOffersTab] Error from getTransportOffersByUserId service:", result.error.message);
        setFetchError(result.error.message);
        setUserOffers([]);
        if (result.error.indexCreationUrl) {
          console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          console.warn("!!! EKSİK FIRESTORE INDEX (Nakliye Fiyat Tekliflerim) !!!");
          console.warn("!!! Düzeltmek için, aşağıdaki bağlantıyı ziyaret ederek bileşik dizini oluşturun:");
          console.warn(`!!! ${result.error.indexCreationUrl}`);
          console.warn("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          toast({
            title: "Firestore Index Hatası (Fiyat Tekliflerim)",
            description: `Eksik bir Firestore dizini var. Lütfen tarayıcı konsolundaki bağlantıyı kullanarak dizini oluşturun. URL: ${result.error.indexCreationUrl}`,
            variant: "destructive",
            duration: 20000
          });
        } else {
          toast({ title: "Veri Yükleme Hatası", description: result.error.message, variant: "destructive" });
        }
      } else {
        setUserOffers(result.offers);
      }
    } catch (error) {
      console.error("Failed to fetch user transport offers (unexpected):", error);
      const errorMsg = "Fiyat teklifleriniz yüklenirken beklenmedik bir sorun oluştu.";
      setFetchError(errorMsg);
      toast({ title: "Beklenmedik Hata", description: errorMsg, variant: "destructive" });
    }
    setIsLoading(false);
  }, [userId, toast]);

  useEffect(() => {
    fetchUserOffers();
    fetchVehicleOptions();
  }, [fetchUserOffers, fetchVehicleOptions]);

  const handleAddNewOffer = () => {
    setEditingOffer(null);
    setIsModalOpen(true);
  };

  const handleEditOffer = (offer: TransportOffer) => {
    setEditingOffer(offer);
    setIsModalOpen(true);
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const success = await deleteTransportOffer(offerId);
      if (success) {
        toast({ title: "Başarılı", description: "Nakliye fiyat teklifi silindi.", variant: "destructive" });
        fetchUserOffers();
      } else {
        throw new Error("Fiyat teklifi silinemedi.");
      }
    } catch (error: any) {
      console.error("Error deleting transport offer:", error);
      toast({ title: "Hata", description: error.message || "Fiyat teklifi silinirken bir sorun oluştu.", variant: "destructive" });
    }
  };

  const handleFormSuccess = () => {
    fetchUserOffers();
    setIsModalOpen(false);
  };
  
  const isLoadingCombined = isLoading || optionsLoading;

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2"><Tag size={20} /> Nakliye Fiyat Tekliflerim</CardTitle>
          <CardDescription>Mevcut fiyat tekliflerinizi yönetin veya yeni teklifler oluşturun.</CardDescription>
        </div>
        <Button onClick={handleAddNewOffer} disabled={optionsLoading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Fiyat Teklifi Ekle
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingCombined && !fetchError ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>
        ) : fetchError ? (
          <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-destructive-foreground mb-2">Fiyat Teklifleri Yüklenemedi</h3>
            <p className="text-sm text-destructive-foreground/80 px-4">{fetchError}</p>
            <p className="text-xs text-destructive-foreground/70 mt-1 px-4">Eksik bir Firestore dizini olabilir. Lütfen tarayıcı konsolunu kontrol edin.</p>
            <Button onClick={fetchUserOffers} variant="destructive" className="mt-4">Tekrar Dene</Button>
          </div>
        ) : userOffers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Henüz yayınlanmış bir fiyat teklifiniz bulunmamaktadır.</p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Güzergah</TableHead>
                  <TableHead className="w-[150px]">Araç Tipi</TableHead>
                  <TableHead className="w-[100px]">Mesafe</TableHead>
                  <TableHead className="w-[100px]">Fiyat (TL)</TableHead>
                  <TableHead className="w-[100px] text-center">Aktif</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userOffers.map((offer) => (
                  <TableRow key={offer.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm">
                        <div className="flex items-center gap-1"><MapPin size={14} className="text-muted-foreground"/> {offer.originCity} ({offer.originCountry})</div>
                        <div className="flex items-center gap-1"><Route size={14} className="text-muted-foreground"/> &rarr; {offer.destinationCity} ({offer.destinationCountry})</div>
                    </TableCell>
                    <TableCell><Badge variant="outline"><Truck size={14} className="mr-1.5"/>{offer.vehicleType}</Badge></TableCell>
                    <TableCell>{offer.distanceKm} km</TableCell>
                    <TableCell>{offer.priceTRY ? `${offer.priceTRY.toLocaleString('tr-TR')} TL` : '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={offer.isActive ? "default" : "outline"} className={offer.isActive ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}>
                        {offer.isActive ? 'Evet' : 'Hayır'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleEditOffer(offer)} title="Düzenle" className="hover:bg-accent">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Sil" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu fiyat teklifini ({offer.originCity} &rarr; {offer.destinationCity}, {offer.vehicleType}) silmek üzeresiniz. Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOffer(offer.id)} className="bg-destructive hover:bg-destructive/90">
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {isModalOpen && (
        <TransportOfferFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userId={userId}
          companyName={companyName}
          initialData={editingOffer}
          vehicleTypeOptions={vehicleTypeOptions}
          optionsLoading={optionsLoading}
          onSubmitSuccess={handleFormSuccess}
        />
      )}
    </Card>
  );
}
