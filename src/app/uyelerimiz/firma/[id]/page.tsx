
"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { CompanyUserProfile, Freight } from '@/types';
import { getUserProfile } from '@/services/authService';
import { getListingsByUserId } from '@/services/listingsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FreightCard from '@/components/freight/FreightCard';
import {
  Mail, Phone, Smartphone, Globe, MapPin, Building, Info, Star,
  Briefcase, Route as RouteIcon, ListChecks, AlertTriangle, MessageCircle, Truck, FileText
} from 'lucide-react';
import { WORKING_METHODS, WORKING_ROUTES } from '@/lib/constants';
import { COUNTRIES } from '@/lib/locationData';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';


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


function CompanyProfileContent() {
    const params = useParams();
    const router = useRouter();
    const companyId = params.id as string;

    const [company, setCompany] = useState<CompanyUserProfile | null>(null);
    const [listings, setListings] = useState<Freight[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isSponsor = company?.sponsorships && company.sponsorships.length > 0;
    
    const getCountryName = useCallback((code: string) => COUNTRIES.find(c => c.code === code)?.name || code, []);

    const sponsoredCountries = useMemo(() => company?.sponsorships?.filter(s => s.type === 'country').map(s => getCountryName(s.name)) || [], [company, getCountryName]);
    const sponsoredCities = useMemo(() => company?.sponsorships?.filter(s => s.type === 'city').map(s => s.name) || [], [company]);


    useEffect(() => {
        if (!companyId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [companyProfile, listingsResult] = await Promise.all([
                    getUserProfile(companyId),
                    getListingsByUserId(companyId, { onlyActive: true, freightType: 'Boş Araç' })
                ]);

                if (!companyProfile || !companyProfile.isActive) {
                    throw new Error('Firma bulunamadı veya aktif değil.');
                }
                
                setCompany(companyProfile);

                if (listingsResult.error) {
                    console.warn("Firma ilanları yüklenirken hata:", listingsResult.error.message);
                    setListings([]);
                } else {
                    setListings(listingsResult.listings);
                }

            } catch (err: any) {
                setError(err.message || 'Veri alınırken bir hata oluştu.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [companyId]);
    
    const renderItemBadges = (items: string[] | undefined, map: readonly { id: string, label: string }[] | readonly { code: string, name: string }[], emptyText: string) => {
        if (!items || items.length === 0) {
        return <p className="text-sm text-muted-foreground italic">{emptyText}</p>;
        }
        
        const getLabel = (value: string) => {
            if(map.length === 0) return value; // For city list
            const found = map.find(item => ('id' in item && item.id === value) || ('code' in item && item.code === value));
            return found ? ('label' in found ? found.label : found.name) : value;
        };
        
        return (
            <div className="flex flex-wrap gap-2">
                {items.map((item, index) => <Badge key={index} variant="secondary">{getLabel(item)}</Badge>)}
            </div>
        );
    };

    const renderSimpleBadges = (items: string[] | undefined, emptyText: string) => {
        if (!items || items.length === 0) {
            return <p className="text-sm text-muted-foreground italic">{emptyText}</p>;
        }
        return (
            <div className="flex flex-wrap gap-2">
                {items.map((item, index) => <Badge key={index} variant="outline">{item}</Badge>)}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center py-16 bg-card border border-destructive rounded-lg shadow">
                <AlertTriangle className="mx-auto h-20 w-20 text-destructive mb-6" />
                <h2 className="text-2xl font-semibold mb-3 text-destructive-foreground">Hata</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
                <Button onClick={() => router.push('/arama/firmalar')} className="mt-6">Firmalar Sayfasına Geri Dön</Button>
            </div>
        );
    }

    if (!company) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24">
                <Card className={cn("shadow-lg", isSponsor && "border-yellow-400/50 ring-2 ring-yellow-400/80")}>
                    <CardHeader className="items-center text-center p-4 relative">
                         {isSponsor && (
                            <Badge variant="default" className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90 shadow-lg px-3 py-1 text-sm z-10">
                                <Star className="h-4 w-4 mr-1.5" /> SPONSOR
                            </Badge>
                        )}
                        <Avatar className="w-28 h-28 mt-4 mb-3 border-2 border-muted shadow-md rounded-md">
                            <AvatarImage src={company.logoUrl} alt={`${company.name} logo`} className="object-contain" />
                            <AvatarFallback className="text-4xl bg-primary/10 text-primary rounded-md">{company.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl">{company.name}</CardTitle>
                        <CardDescription>{company.category}</CardDescription>
                    </CardHeader>
                </Card>

                {isSponsor && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><Star size={18} className="text-amber-500"/> Sponsorluk Bölgeleri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {sponsoredCountries.length > 0 && (
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-1.5 text-muted-foreground"><Globe size={14}/> Ülkeler</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {sponsoredCountries.map(country => (
                                            <Badge key={country} variant="secondary">{country}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {sponsoredCities.length > 0 && (
                                <div className="space-y-1">
                                    <Label className="flex items-center gap-1.5 text-muted-foreground"><MapPin size={14}/> Şehirler</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {sponsoredCities.map(city => (
                                            <Badge key={city} variant="outline">{city}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                 )}

                 <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Phone size={18}/> İletişim Bilgileri</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start gap-3"><MapPin size={16} className="text-muted-foreground mt-0.5 shrink-0" /><p>{company.fullAddress}, {company.addressDistrict ? `${company.addressDistrict}, ` : ''}{company.addressCity}</p></div>
                        {company.mobilePhone && <div className="flex items-center gap-3"><Smartphone size={16} className="text-muted-foreground shrink-0" /><a href={`tel:${company.mobilePhone}`} className="hover:underline">{company.mobilePhone} (Mobil)</a></div>}
                        {company.workPhone && <div className="flex items-center gap-3"><Phone size={16} className="text-muted-foreground shrink-0" /><a href={`tel:${company.workPhone}`} className="hover:underline">{company.workPhone} (İş)</a></div>}
                        {company.email && <div className="flex items-center gap-3"><Mail size={16} className="text-muted-foreground shrink-0" /><a href={`mailto:${company.email}`} className="hover:underline">{company.email}</a></div>}
                        {company.website && <div className="flex items-center gap-3"><Globe size={16} className="text-muted-foreground shrink-0" /><a href={company.website.startsWith('http') ? company.website : `//${company.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{company.website}</a></div>}
                    </CardContent>
                    <CardFooter className="flex-col items-stretch space-y-2">
                        {company.mobilePhone && <Button asChild className="w-full"><a href={`https://wa.me/${formatWhatsAppNumber(company.mobilePhone)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/> WhatsApp ile Mesaj Gönder</a></Button>}
                        {company.workPhone && <Button asChild variant="outline" className="w-full"><a href={`tel:${company.workPhone}`}><Phone size={18}/> İş Telefonunu Ara</a></Button>}
                    </CardFooter>
                </Card>

            </div>

            {/* Right Column */}
            <div className="lg:col-span-8 xl:col-span-9">
                 <Tabs defaultValue="about" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="about"><Info className="mr-2 h-4 w-4"/>Firma Hakkında</TabsTrigger>
                        <TabsTrigger value="listings"><ListChecks className="mr-2 h-4 w-4"/>Boş Araç İlanları ({listings.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="about" className="mt-4 space-y-6">
                        <Card>
                             <CardHeader><CardTitle className="text-xl">Firma Detayları</CardTitle></CardHeader>
                             <CardContent className="space-y-6">
                                {company.companyDescription && <p className="text-muted-foreground">{company.companyDescription}</p>}
                                <div className="space-y-1"><Label>Çalışma Yöntemleri</Label>{renderItemBadges(company.workingMethods, WORKING_METHODS, "Çalışma yöntemi belirtilmemiş.")}</div>
                                <div className="space-y-1"><Label>Çalışma Rotaları</Label>{renderItemBadges(company.workingRoutes, WORKING_ROUTES, "Çalışma rotası belirtilmemiş.")}</div>
                                <div className="space-y-1"><Label>Uzmanlık Bölgeleri (İl)</Label>{renderItemBadges(company.preferredCities, [], "Tercih edilen şehir belirtilmemiş.")}</div>
                                <div className="space-y-1"><Label>Uzmanlık Bölgeleri (Ülke)</Label>{renderItemBadges(company.preferredCountries, COUNTRIES, "Tercih edilen ülke belirtilmemiş.")}</div>
                             </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Truck size={20} /> Sahip Olunan Araçlar</CardTitle></CardHeader>
                            <CardContent>
                                {renderSimpleBadges(company.ownedVehicles, "Firma sahip olduğu araçları belirtmemiştir.")}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-xl flex items-center gap-2"><FileText size={20} /> Yetki Belgeleri</CardTitle></CardHeader>
                            <CardContent>
                                {renderSimpleBadges(company.authDocuments, "Firma sahip olduğu yetki belgelerini belirtmemiştir.")}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="listings" className="mt-4">
                        {listings.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {listings.map(listing => <FreightCard key={listing.id} freight={listing} />)}
                            </div>
                        ) : (
                            <Card className="text-center py-10">
                                 <CardContent>
                                    <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4"/>
                                    <h3 className="text-lg font-semibold">Aktif Boş Araç İlanı Bulunmuyor</h3>
                                    <p className="text-muted-foreground mt-1">Bu firmanın şu anda aktif bir boş araç ilanı yok.</p>
                                 </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );

}

export default function CompanyProfilePage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <CompanyProfileContent/>
        </Suspense>
    )
}
