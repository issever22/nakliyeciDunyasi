
"use client";

import { useEffect, useState } from 'react';
import { useRequireAuth, useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, User as UserIcon, Edit3, Building, Truck, FileText as FileTextIcon, ShieldCheck, Star, Loader2, Users, MapPin, Briefcase, Globe, Info, ListChecks, Tag, KeyRound, MessageSquareText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import EditProfileModal from '@/components/profile/EditProfileModal';
import EditCompanyDetailsModal from '@/components/profile/EditCompanyDetailsModal';
import ManageCompanyVehiclesModal from '@/components/profile/ManageCompanyVehiclesModal';
import ManageCompanyAuthDocsModal from '@/components/profile/ManageCompanyAuthDocsModal';
import ViewMembershipsModal from '@/components/profile/ViewMembershipsModal';
import MyListingsTab from '@/components/profile/MyListingsTab';
import MyTransportOffersTab from '@/components/profile/MyTransportOffersTab';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import type { UserProfile, CompanyUserProfile, VehicleTypeSetting, AuthDocSetting, MembershipSetting } from '@/types';
import { getAllVehicleTypes } from '@/services/vehicleTypesService';
import { getAllAuthDocs } from '@/services/authDocsService';
import { getAllMemberships } from '@/services/membershipsService';
import { format, parseISO, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import Image from 'next/image';

import { WORKING_METHODS, WORKING_ROUTES } from '@/lib/constants';
import { COUNTRIES } from '@/lib/locationData';


export default function ProfilePage() {
  const { user, loading: authLoading, isAuthenticated } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [companyUser, setCompanyUser] = useState<CompanyUserProfile | null>(null);

  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeSetting[]>([]);
  const [authDocTypes, setAuthDocTypes] = useState<AuthDocSetting[]>([]);
  const [membershipPackages, setMembershipPackages] = useState<MembershipSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isEditCompanyDetailsModalOpen, setIsEditCompanyDetailsModalOpen] = useState(false);
  const [isManageVehiclesModalOpen, setIsManageVehiclesModalOpen] = useState(false);
  const [isManageAuthDocsModalOpen, setIsManageAuthDocsModalOpen] = useState(false);
  const [isViewMembershipsModalOpen, setIsViewMembershipsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");


  useEffect(() => {
    if (user && user.role === 'company') {
      setCompanyUser(user as CompanyUserProfile);
      const fetchCompanySettings = async () => {
        setSettingsLoading(true);
        try {
          const [vehicles, docs, memberships] = await Promise.all([
            getAllVehicleTypes(),
            getAllAuthDocs(),
            getAllMemberships()
          ]);
          setVehicleTypes(vehicles.filter(v => v.isActive));
          setAuthDocTypes(docs.filter(d => d.isActive && (d.requiredFor === 'Firma' || d.requiredFor === 'Her İkisi de')));
          setMembershipPackages(memberships.filter(m => m.isActive));
        } catch (error) {
          console.error("Error fetching company settings:", error);
        } finally {
          setSettingsLoading(false);
        }
      };
      fetchCompanySettings();
    } else if (user && user.role === 'individual') {
      setCompanyUser(null);
    }
  }, [user]);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    if (user && user.id === updatedProfile.id) {
        if (updatedProfile.role === 'company') {
            setCompanyUser(updatedProfile as CompanyUserProfile);
        }
        // Potentially update the main `user` state in AuthContext if basic info like name changes
        // This might require a refresh function in AuthContext or refetching the user.
        // For now, only local state `companyUser` is updated for company-specific fields.
    }
  };

  const handlePlaceholderClick = (featureName: string) => {
    toast({
      title: "Geliştirme Aşamasında",
      description: `${featureName} özelliği yakında eklenecektir.`,
      variant: "default",
    });
  };


  if (authLoading || (user?.role === 'company' && settingsLoading && !['myListings', 'myTransportOffers'].includes(activeTab) )) {
    return (
      <div className="space-y-6 container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 xl:col-span-3">
            <Card className="md:col-span-1">
              <CardHeader className="items-center">
                <Skeleton className="h-32 w-32 rounded-md mb-4" />
                <Skeleton className="h-8 w-48 mt-4" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" /> <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-1/3" /></CardContent></Card>
            <Card><CardContent className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-1/3" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl text-muted-foreground">Profil bilgileri yüklenemedi veya giriş yapılmamış.</p>
        <Button onClick={() => router.push('/auth/giris')} className="mt-4">Giriş Yap</Button>
      </div>
    );
  }

  const renderItemBadges = (items: string[] | undefined, emptyText: string) => {
    if (!items || items.length === 0) {
      return <p className="text-sm text-muted-foreground italic">{emptyText}</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => <Badge key={index} variant="secondary">{item}</Badge>)}
      </div>
    );
  };

  const companyTabsCount = 6; // Increased for "Nakliye Fiyatlarım"
  const individualTabsCount = 2;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-primary">Profilim</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="shadow-lg sticky top-24">
            <CardHeader className="items-center text-center">
              {user.role === 'company' && companyUser?.logoUrl ? (
                <div className="w-36 h-36 md:w-40 md:h-40 mb-4 relative border border-muted rounded-lg overflow-hidden shadow-md bg-card flex items-center justify-center p-2">
                  <img
                    src={companyUser.logoUrl}
                    alt={`${user.name} logo`}
                    className="max-w-full max-h-full object-contain"
                    data-ai-hint="company logo"
                  />
                </div>
              ) : (
                <Avatar className="w-28 h-28 mb-4 border-4 border-primary/50 shadow-md">
                  <AvatarFallback className="text-4xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5"><Mail size={14}/>{user.email}</CardDescription>
               {user.role === 'company' && companyUser?.username && (
                 <Badge variant="outline" className="mt-1 text-xs">@{companyUser.username}</Badge>
               )}
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <Button onClick={() => setIsEditProfileModalOpen(true)} variant="outline" className="w-full">
                <Edit3 className="mr-2 h-4 w-4" /> Temel Bilgileri Düzenle
              </Button>
              <Button onClick={() => handlePlaceholderClick("Şifre Değiştirme")} variant="outline" className="w-full">
                <KeyRound className="mr-2 h-4 w-4" /> Şifre Değiştir
              </Button>
              <Button onClick={() => handlePlaceholderClick("Geri Bildirim")} variant="outline" className="w-full">
                <MessageSquareText className="mr-2 h-4 w-4" /> Geri Bildirim Gönder
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 xl:col-span-9">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="mb-6">
                 <TabsList
                    className={cn(
                      "grid w-full p-1 rounded-md bg-muted/50",
                      user.role === 'company'
                        ? "grid-cols-3 md:grid-cols-3 lg:grid-cols-6" // Company: 3 mobile, 6 lg
                        : "grid-cols-2" // Individual: 2 cols on all screens
                    )}
                  >
                    <TabsTrigger value="details" className="text-xs sm:text-sm">
                      {user.role === 'company' ? <><Building className="mr-1.5 h-4 w-4 hidden sm:inline"/>Firma Detayları</> : <><UserIcon className="mr-1.5 h-4 w-4 hidden sm:inline"/>Profil Detayları</>}
                    </TabsTrigger>
                    <TabsTrigger value="myListings" className="text-xs sm:text-sm"><ListChecks className="mr-1.5 h-4 w-4 hidden sm:inline"/>Yük İlanlarım</TabsTrigger>
                    {user.role === 'company' && (
                      <>
                        <TabsTrigger value="myTransportOffers" className="text-xs sm:text-sm"><Tag className="mr-1.5 h-4 w-4 hidden sm:inline"/>Fiyat Tekliflerim</TabsTrigger>
                        <TabsTrigger value="vehicles" className="text-xs sm:text-sm"><Truck className="mr-1.5 h-4 w-4 hidden sm:inline"/>Araçlarım</TabsTrigger>
                        <TabsTrigger value="authDocs" className="text-xs sm:text-sm"><FileTextIcon className="mr-1.5 h-4 w-4 hidden sm:inline"/>Belgelerim</TabsTrigger>
                        <TabsTrigger value="membership" className="text-xs sm:text-sm"><Star className="mr-1.5 h-4 w-4 hidden sm:inline"/>Üyeliğim</TabsTrigger>
                      </>
                    )}
                  </TabsList>
              </div>

              <TabsContent value="details">
                {user.role === 'company' && companyUser ? (
                    <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><Building size={20}/>Firma Detayları</CardTitle>
                        <CardDescription>Firmanızın operasyonel ve iletişim bilgileri.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><strong className="text-muted-foreground">Yetkili:</strong> {companyUser.contactFullName || '-'}</div>
                            <div><strong className="text-muted-foreground">Cep Tel:</strong> {companyUser.mobilePhone || '-'}</div>
                            <div><strong className="text-muted-foreground">İş Tel:</strong> {companyUser.workPhone || '-'}</div>
                            <div><strong className="text-muted-foreground">Fax:</strong> {companyUser.fax || '-'}</div>
                            <div><strong className="text-muted-foreground">Firma Türü:</strong> {companyUser.companyType === 'local' ? 'Yerel Firma' : 'Yabancı Firma'}</div>
                            <div><strong className="text-muted-foreground">Web Sitesi:</strong> {companyUser.website ? <a href={companyUser.website.startsWith('http') ? companyUser.website : `//${companyUser.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{companyUser.website}</a> : '-'}</div>
                        </div>
                        <div><strong className="text-muted-foreground">Adres:</strong> {`${companyUser.fullAddress || ''}${companyUser.addressDistrict ? `, ${companyUser.addressDistrict}` : ''}${companyUser.addressCity ? `, ${companyUser.addressCity}` : ''}`}</div>
                        <div><strong className="text-muted-foreground">Açıklama:</strong> {companyUser.companyDescription || <span className="italic text-muted-foreground/70">Belirtilmemiş</span>}</div>
                        <div>
                            <strong className="text-muted-foreground block mb-1">Çalışma Yöntemleri:</strong>
                            {renderItemBadges(companyUser.workingMethods?.map(wm => WORKING_METHODS.find(m => m.id === wm)?.label || wm), "Çalışma yöntemi belirtilmemiş.")}
                        </div>
                        <div>
                            <strong className="text-muted-foreground block mb-1">Çalışma Rotaları:</strong>
                            {renderItemBadges(companyUser.workingRoutes?.map(wr => WORKING_ROUTES.find(r => r.id === wr)?.label || wr), "Çalışma rotası belirtilmemiş.")}
                        </div>
                        <div>
                            <strong className="text-muted-foreground block mb-1">Tercih Edilen Şehirler:</strong>
                            {renderItemBadges(companyUser.preferredCities, "Tercih edilen şehir belirtilmemiş.")}
                        </div>
                        <div>
                            <strong className="text-muted-foreground block mb-1">Tercih Edilen Ülkeler:</strong>
                            {renderItemBadges(companyUser.preferredCountries?.map(cc => COUNTRIES.find(c => c.code === cc)?.name || cc ), "Tercih edilen ülke belirtilmemiş.")}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => setIsEditCompanyDetailsModalOpen(true)}><Edit3 className="mr-2 h-4 w-4"/>Firma Detaylarını Düzenle</Button>
                    </CardFooter>
                    </Card>
                ) : (
                    <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><UserIcon size={20}/>Profil Detayları</CardTitle>
                        <CardDescription>Kişisel bilgilerinizi buradan yönetebilirsiniz.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p><strong className="text-muted-foreground">Ad Soyad:</strong> {user.name}</p>
                        <p><strong className="text-muted-foreground">E-posta:</strong> {user.email}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => setIsEditProfileModalOpen(true)}>
                            <Edit3 className="mr-2 h-4 w-4"/> Bilgileri Düzenle
                        </Button>
                    </CardFooter>
                    </Card>
                )}
              </TabsContent>

              <TabsContent value="myListings">
                <MyListingsTab userId={user.id} />
              </TabsContent>

              {user.role === 'company' && companyUser && (
                <>
                    <TabsContent value="myTransportOffers">
                        <MyTransportOffersTab userId={user.id} companyName={companyUser.name} />
                    </TabsContent>
                    <TabsContent value="vehicles">
                        <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2"><Truck size={20}/> Araçlarım</CardTitle>
                            <CardDescription>Firmanıza kayıtlı araç tipleri.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderItemBadges(companyUser.ownedVehicles, "Henüz kayıtlı aracınız bulunmamaktadır.")}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => setIsManageVehiclesModalOpen(true)}><Edit3 className="mr-2 h-4 w-4"/>Araçları Yönet</Button>
                        </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="authDocs">
                        <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2"><FileTextIcon size={20}/>Yetki Belgelerim</CardTitle>
                            <CardDescription>Firmanıza ait yetki belgeleri.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {renderItemBadges(companyUser.authDocuments, "Henüz kayıtlı yetki belgeniz bulunmamaktadır.")}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => setIsManageAuthDocsModalOpen(true)}><Edit3 className="mr-2 h-4 w-4"/>Belgeleri Yönet</Button>
                        </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="membership">
                        <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2"><Star size={20}/>Üyelik Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm">
                            <strong className="text-muted-foreground">Mevcut Durum: </strong>
                            <Badge variant={companyUser.membershipStatus && companyUser.membershipStatus !== 'Yok' ? 'default' : 'outline'} className={companyUser.membershipStatus === 'Premium' ? 'bg-purple-500' : (companyUser.membershipStatus === 'Standart' ? 'bg-orange-500' : '') }>
                                {companyUser.membershipStatus || 'Yok'}
                            </Badge>
                            </p>
                            {companyUser.membershipEndDate && isValid(parseISO(companyUser.membershipEndDate)) && (
                            <p className="text-sm"><strong className="text-muted-foreground">Bitiş Tarihi: </strong> {format(parseISO(companyUser.membershipEndDate), "dd MMMM yyyy", { locale: tr })}</p>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => setIsViewMembershipsModalOpen(true)} variant="secondary">
                                <Star className="mr-2 h-4 w-4" /> Üyelik Paketlerini Görüntüle
                            </Button>
                        </CardFooter>
                        </Card>
                    </TabsContent>
                </>
              )}
            </Tabs>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />
      {companyUser && (
        <>
          <EditCompanyDetailsModal
            isOpen={isEditCompanyDetailsModalOpen}
            onClose={() => setIsEditCompanyDetailsModalOpen(false)}
            companyUser={companyUser}
            onProfileUpdate={handleProfileUpdate}
          />
          <ManageCompanyVehiclesModal
            isOpen={isManageVehiclesModalOpen}
            onClose={() => setIsManageVehiclesModalOpen(false)}
            companyUser={companyUser}
            availableVehicleTypes={vehicleTypes}
            onProfileUpdate={handleProfileUpdate}
          />
          <ManageCompanyAuthDocsModal
            isOpen={isManageAuthDocsModalOpen}
            onClose={() => setIsManageAuthDocsModalOpen(false)}
            companyUser={companyUser}
            availableAuthDocTypes={authDocTypes}
            onProfileUpdate={handleProfileUpdate}
          />
          <ViewMembershipsModal
            isOpen={isViewMembershipsModalOpen}
            onClose={() => setIsViewMembershipsModalOpen(false)}
            availableMemberships={membershipPackages}
            currentUserMembership={companyUser.membershipStatus}
          />
        </>
      )}
    </div>
  );
}
