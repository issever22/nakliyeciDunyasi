
"use client";

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getListingById } from '@/services/listingsService';
import type { Freight, CommercialFreight, ResidentialFreight, EmptyVehicleListing } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MembershipCTA from '@/components/freight/MembershipCTA';
import { MapPin, Truck, CalendarDays, Info, User, Globe, Package as PackageIcon, Repeat, Layers, Weight, PackagePlus, Boxes, Home, Building, ArrowUpDown, ChevronsUpDown, Tag, AlertTriangle, Phone, Mail, MessageCircle } from 'lucide-react';
import { format, formatDistanceToNow, parseISO, isValid, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COUNTRIES } from '@/lib/locationData';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Helper to format phone number for WhatsApp link
const formatWhatsAppNumber = (phone: string) => {
  let cleaned = phone.replace(/\D/g, ''); // Remove all non-digit characters
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1); // Remove leading 0 if present
  }
  if (!cleaned.startsWith('90')) {
    cleaned = '90' + cleaned; // Add Turkey country code if missing
  }
  return cleaned;
};


function ListingDetailContent() {
    const { user, loading } = useAuth();
    const params = useParams();
    const listingId = params.id as string;
    
    const [listing, setListing] = useState<Freight | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isMember = useMemo(() => {
        // Not a member if user doesn't exist, is not a company, or has no membership status
        if (!user || user.role !== 'company' || !user.membershipStatus || user.membershipStatus === 'Yok') {
            return false;
        }
        
        const endDateIso = user.membershipEndDate;
        // If they have a status but no end date, they are not considered a paying member.
        if (!endDateIso) {
            return false;
        }

        const endDate = parseISO(endDateIso);
        if (!isValid(endDate)) {
            return false; // Invalid date format in DB
        }

        // is a member if the membership end date is today or in the future.
        const diff = differenceInDays(endDate, new Date());
        return diff >= 0;
    }, [user]);

    useEffect(() => {
        if (!listingId) {
            setError("İlan ID'si bulunamadı.");
            setIsLoading(false);
            return;
        }

        const fetchListing = async () => {
            setIsLoading(true);
            const fetchedListing = await getListingById(listingId);
            if (fetchedListing) {
                setListing(fetchedListing);
            } else {
                setError("İlan bulunamadı veya artık mevcut değil.");
            }
            setIsLoading(false);
        };

        fetchListing();
    }, [listingId]);

    if (loading || isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-8 w-1/2" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                        <Skeleton className="h-6 w-3/4" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!isMember) {
        return <MembershipCTA />;
    }
    
    if (error) {
        return (
             <div className="text-center py-16 bg-destructive/10 border border-destructive rounded-lg shadow">
                <AlertTriangle className="mx-auto h-20 w-20 text-destructive mb-6" />
                <h2 className="text-2xl font-semibold mb-3 text-destructive-foreground">Hata</h2>
                <p className="text-destructive-foreground/80 max-w-md mx-auto">{error}</p>
            </div>
        );
    }

    if (!listing) return null;


    const getCountryName = (code: string) => COUNTRIES.find(c => c.code === code)?.name || code;
    const originDisplay = `${getCountryName(listing.originCountry)}${listing.originCity ? `, ${listing.originCity}` : ''}${listing.originDistrict ? `, ${listing.originDistrict}` : ''}`;
    const destinationDisplay = `${getCountryName(listing.destinationCountry)}${listing.destinationCity ? `, ${listing.destinationCity}` : ''}${listing.destinationDistrict ? `, ${listing.destinationDistrict}` : ''}`;
    const FreightTypeIcon = listing.freightType === 'Evden Eve' ? Home : (listing.freightType === 'Boş Araç' ? PackagePlus : Truck);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary flex items-start gap-3">
                    <MapPin className="h-8 w-8 mt-1 shrink-0"/> 
                    <span>{originDisplay} &rarr; {destinationDisplay}</span>
                </h1>
                <p className="text-muted-foreground mt-2">İlan Detayları</p>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">İlan Bilgileri</CardTitle>
                        <Badge variant={listing.freightType === 'Evden Eve' ? "secondary" : (listing.freightType === 'Yük' ? "default" : "outline")} className="whitespace-nowrap flex-shrink-0 text-sm py-1 px-3 flex items-center gap-2">
                            <FreightTypeIcon size={16} /> {listing.freightType}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                     {listing.freightType === 'Yük' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                           {(listing as CommercialFreight).shipmentScope && <p><strong className="text-muted-foreground">Kapsam:</strong> {(listing as CommercialFreight).shipmentScope}</p>}
                           {(listing as CommercialFreight).isContinuousLoad && <p><strong className="text-muted-foreground">Süreklilik:</strong> <Badge variant="outline" className="ml-1 bg-green-100 text-green-700 border-green-300 text-xs py-0.5 px-1.5"><Repeat size={12} className="inline mr-1"/>Sürekli Yük</Badge></p>}
                           {(listing as CommercialFreight).cargoType && <p><strong className="text-muted-foreground">Yük Cinsi:</strong> {(listing as CommercialFreight).cargoType}</p>}
                           {(listing as CommercialFreight).vehicleNeeded && <p><strong className="text-muted-foreground">Araç:</strong> {(listing as CommercialFreight).vehicleNeeded}</p>}
                           {(listing as CommercialFreight).loadingType && <p><strong className="text-muted-foreground">Yükleniş:</strong> {(listing as CommercialFreight).loadingType}</p>}
                           {(listing as CommercialFreight).cargoForm && <p><strong className="text-muted-foreground">Biçim:</strong> {(listing as CommercialFreight).cargoForm}</p>}
                           {(listing as CommercialFreight).cargoWeight !== undefined && <p><strong className="text-muted-foreground">Tonaj:</strong> {(listing as CommercialFreight).cargoWeight} {(listing as CommercialFreight).cargoWeightUnit}</p>}
                        </div>
                      </>
                    )}
                    {listing.freightType === 'Evden Eve' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                           {(listing as ResidentialFreight).residentialTransportType && <p><strong className="text-muted-foreground">Taşıma Türü:</strong> {(listing as ResidentialFreight).residentialTransportType}</p>}
                           {(listing as ResidentialFreight).residentialPlaceType && <p><strong className="text-muted-foreground">Nakliye Yeri:</strong> {(listing as ResidentialFreight).residentialPlaceType}</p>}
                           {(listing as ResidentialFreight).residentialElevatorStatus && <p><strong className="text-muted-foreground">Asansör:</strong> {(listing as ResidentialFreight).residentialElevatorStatus}</p>}
                           {(listing as ResidentialFreight).residentialFloorLevel && <p><strong className="text-muted-foreground">Kat:</strong> {(listing as ResidentialFreight).residentialFloorLevel}</p>}
                        </div>
                    )}
                    {listing.freightType === 'Boş Araç' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            {(listing as EmptyVehicleListing).advertisedVehicleType && <p><strong className="text-muted-foreground">Araç Tipi:</strong> {(listing as EmptyVehicleListing).advertisedVehicleType}</p>}
                            {(listing as EmptyVehicleListing).serviceTypeForLoad && <p><strong className="text-muted-foreground">Hizmet Tipi:</strong> {(listing as EmptyVehicleListing).serviceTypeForLoad}</p>}
                            {(listing as EmptyVehicleListing).vehicleStatedCapacity !== undefined && <p><strong className="text-muted-foreground">Kapasite:</strong> {(listing as EmptyVehicleListing).vehicleStatedCapacity} {(listing as EmptyVehicleListing).vehicleStatedCapacityUnit}</p>}
                        </div>
                    )}
                    <div className="border-t pt-3">
                        <p><strong className="text-muted-foreground">Açıklama:</strong></p>
                        <p className="whitespace-pre-wrap">{listing.description}</p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader><CardTitle className="text-xl">İlan Sahibi İletişim Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <p><strong className="text-muted-foreground">Firma / Ad Soyad:</strong> {listing.companyName}</p>
                    <p><strong className="text-muted-foreground">Yetkili Kişi:</strong> {listing.contactPerson}</p>
                    {listing.mobilePhone && <p><strong className="text-muted-foreground">Cep Telefonu:</strong> <a href={`tel:${listing.mobilePhone}`} className="text-primary hover:underline">{listing.mobilePhone}</a></p>}
                    {listing.workPhone && <p><strong className="text-muted-foreground">İş Telefonu:</strong> <a href={`tel:${listing.workPhone}`} className="text-primary hover:underline">{listing.workPhone}</a></p>}
                    {listing.contactEmail && <p><strong className="text-muted-foreground">E-posta:</strong> <a href={`mailto:${listing.contactEmail}`} className="text-primary hover:underline">{listing.contactEmail}</a></p>}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                    {listing.mobilePhone && <Button asChild><a href={`https://wa.me/${formatWhatsAppNumber(listing.mobilePhone)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2"/> WhatsApp ile Mesaj Gönder</a></Button>}
                    {listing.mobilePhone && <Button asChild variant="outline"><a href={`tel:${listing.mobilePhone}`}><Phone className="mr-2"/> Ara (Mobil)</a></Button>}
                    {listing.contactEmail && <Button asChild variant="outline"><a href={`mailto:${listing.contactEmail}`}><Mail className="mr-2"/> E-posta Gönder</a></Button>}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function ListingDetailPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <ListingDetailContent />
        </Suspense>
    );
}
