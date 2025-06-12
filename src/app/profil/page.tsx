
"use client";

import { useEffect, useState } from 'react';
import { useRequireAuth, useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, User as UserIcon, Edit3, Building, Truck, FileText as FileTextIcon, ShieldCheck, Star, Loader2, Users, MapPin, Briefcase, Globe, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import EditProfileModal from '@/components/profile/EditProfileModal';
import EditCompanyDetailsModal from '@/components/profile/EditCompanyDetailsModal';
import ManageCompanyVehiclesModal from '@/components/profile/ManageCompanyVehiclesModal';
import ManageCompanyAuthDocsModal from '@/components/profile/ManageCompanyAuthDocsModal';
import ViewMembershipsModal from '@/components/profile/ViewMembershipsModal';
import { useRouter } from 'next/navigation';

import type { UserProfile, CompanyUserProfile, VehicleTypeSetting, AuthDocSetting, MembershipSetting } from '@/types';
import { getAllVehicleTypes } from '@/services/vehicleTypesService';
import { getAllAuthDocs } from '@/services/authDocsService';
import { getAllMemberships } from '@/services/membershipsService';
import { format, parseISO, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';

import { WORKING_METHODS, WORKING_ROUTES } from '@/lib/constants';
import { COUNTRIES } from '@/lib/locationData';


export default function ProfilePage() {
  const { user, loading: authLoading, isAuthenticated } = useRequireAuth();
  const { logout } = useAuth(); 
  const router = useRouter();
  
  const [companyUser, setCompanyUser] = useState<CompanyUserProfile | null>(null);

  // States for fetched settings data (for company users)
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeSetting[]>([]);
  const [authDocTypes, setAuthDocTypes] = useState<AuthDocSetting[]>([]);
  const [membershipPackages, setMembershipPackages] = useState<MembershipSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Modal states
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isEditCompanyDetailsModalOpen, setIsEditCompanyDetailsModalOpen] = useState(false);
  const [isManageVehiclesModalOpen, setIsManageVehiclesModalOpen] = useState(false);
  const [isManageAuthDocsModalOpen, setIsManageAuthDocsModalOpen] = useState(false);
  const [isViewMembershipsModalOpen, setIsViewMembershipsModalOpen] = useState(false);

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
          setAuthDocTypes(docs.filter(d => d.isActive));
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
    // This is a placeholder. In a real app, useAuth would likely expose
    // a way to refresh or update its internal user state, or the page could re-fetch.
    // For now, we assume useAuth's onAuthStateChanged will eventually reflect updates.
    // For immediate UI update, one might re-cast 'user' or merge.
    // For simplicity, we'll rely on the modal closing and potential re-render or useAuth update.
    console.log("Profile updated, parent page notified (placeholder)", updatedProfile);
    // Re-fetch the user or update context if useAuth provides a mechanism.
    // For now, if it's the current user, let's optimistically update the local state.
    if (user && user.id === updatedProfile.id) {
        if (updatedProfile.role === 'company') {
            setCompanyUser(updatedProfile as CompanyUserProfile);
        }
    }
  };


  if (authLoading || (user?.role === 'company' && settingsLoading)) {
    return (
      <div className="space-y-6 container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-8 w-48 mt-4" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-full" /> <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-12 w-full" /> {/* For TabsList */}
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

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-primary">Profilim</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Avatar and Basic Info */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="shadow-lg sticky top-24">
            <CardHeader className="items-center text-center">
              <Avatar className="w-28 h-28 mb-4 border-4 border-primary/50 shadow-md">
                <AvatarImage src={(companyUser?.logoUrl || `https://placehold.co/120x120.png?text=${user.name.charAt(0)}`)} alt={user.name} data-ai-hint="person company logo"/>
                <AvatarFallback className="text-4xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-1.5"><Mail size={14}/>{user.email}</CardDescription>
               {user.role === 'company' && companyUser?.username && (
                 <Badge variant="outline" className="mt-1 text-xs">@{companyUser.username}</Badge>
               )}
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setIsEditProfileModalOpen(true)} variant="outline" className="w-full">
                <Edit3 className="mr-2 h-4 w-4" /> Temel Bilgileri Düzenle
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs for Company or Simple View for Individual */}
        <div className="lg:col-span-8 xl:col-span-9">
          {user.role === 'company' && companyUser ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-6 bg-muted/50">
                <TabsTrigger value="details" className="text-xs sm:text-sm"><Info className="mr-1.5 h-4 w-4 hidden sm:inline"/>Firma Detayları</TabsTrigger>
                <TabsTrigger value="vehicles" className="text-xs sm:text-sm"><Truck className="mr-1.5 h-4 w-4 hidden sm:inline"/>Araçlarım</TabsTrigger>
                <TabsTrigger value="authDocs" className="text-xs sm:text-sm"><FileTextIcon className="mr-1.5 h-4 w-4 hidden sm:inline"/>Belgelerim</TabsTrigger>
                <TabsTrigger value="membership" className="text-xs sm:text-sm"><Star className="mr-1.5 h-4 w-4 hidden sm:inline"/>Üyeliğim</TabsTrigger>
                 {/* Add more tabs as needed */}
              </TabsList>

              <TabsContent value="details">
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
                        {renderItemBadges(companyUser.workingMethods.map(wm => WORKING_METHODS.find(m => m.id === wm)?.label || wm), "Çalışma yöntemi belirtilmemiş.")}
                    </div>
                    <div>
                        <strong className="text-muted-foreground block mb-1">Çalışma Rotaları:</strong>
                        {renderItemBadges(companyUser.workingRoutes.map(wr => WORKING_ROUTES.find(r => r.id === wr)?.label || wr), "Çalışma rotası belirtilmemiş.")}
                    </div>
                     <div>
                        <strong className="text-muted-foreground block mb-1">Tercih Edilen Şehirler:</strong>
                        {renderItemBadges(companyUser.preferredCities, "Tercih edilen şehir belirtilmemiş.")}
                    </div>
                    <div>
                        <strong className="text-muted-foreground block mb-1">Tercih Edilen Ülkeler:</strong>
                        {renderItemBadges(companyUser.preferredCountries.map(cc => COUNTRIES.find(c => c.code === cc)?.name || cc ), "Tercih edilen ülke belirtilmemiş.")}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => setIsEditCompanyDetailsModalOpen(true)}><Edit3 className="mr-2 h-4 w-4"/>Firma Detaylarını Düzenle</Button>
                  </CardFooter>
                </Card>
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

            </Tabs>
          ) : (
            // Individual User View (Simpler)
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><UserIcon size={20}/>Profil Detayları</CardTitle>
                <CardDescription>Kişisel bilgilerinizi buradan yönetebilirsiniz.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><strong className="text-muted-foreground">Ad Soyad:</strong> {user.name}</p>
                <p><strong className="text-muted-foreground">E-posta:</strong> {user.email}</p>
                {/* Add more individual-specific fields if any */}
              </CardContent>
               <CardFooter>
                <Button onClick={() => setIsEditProfileModalOpen(true)} disabled>
                    <Edit3 className="mr-2 h-4 w-4"/> Bilgileri Düzenle (Yakında)
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
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

