
"use client";

import { useState, useEffect, type FormEvent, useMemo, useCallback, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PlusCircle, Edit, Trash2, Search, Building, ShieldAlert, CheckCircle, XCircle, Star, Clock, CalendarIcon, Loader2, List, MapPin, Briefcase, AlertTriangle, Award, Check, StickyNote, CreditCard, Mail, Phone, Users as UsersIcon, Truck, FileText, KeyRound, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import type { CompanyUserProfile, CompanyCategory, CompanyUserType, WorkingMethodType, WorkingRouteType, TurkishCity, CountryCode, MembershipSetting, CompanyNote, VehicleTypeSetting, AuthDocSetting } from '@/types';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COMPANY_CATEGORIES, COMPANY_TYPES, WORKING_METHODS, WORKING_ROUTES } from '@/lib/constants';
import { COUNTRIES, TURKISH_CITIES, DISTRICTS_BY_CITY_TR } from '@/lib/locationData';
import { 
  updateUserProfile,
  getUserProfile,
} from '@/services/authService'; 
import { getAllMemberships } from '@/services/membershipsService';
import { getAllVehicleTypes } from '@/services/vehicleTypesService';
import { getAllAuthDocs } from '@/services/authDocsService';
import { addCompanyNote } from '@/services/companyNotesService';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import ChangePasswordByAdminModal from '@/components/admin/users/ChangePasswordByAdminModal';

const CLEAR_SELECTION_VALUE = "__CLEAR_SELECTION__";
const MAX_PREFERRED_LOCATIONS = 5;

function CompanyDetailsAdminContent() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const companyId = params.id as string;

    const [company, setCompany] = useState<CompanyUserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    
    // States moved from user list page
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<CompanyUserProfile | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [currentFormData, setCurrentFormData] = useState<Partial<CompanyUserProfile>>({});
    const [availableDistricts, setAvailableDistricts] = useState<readonly string[]>([]);
    
    const [membershipOptions, setMembershipOptions] = useState<MembershipSetting[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeSetting[]>([]);
    const [authDocTypes, setAuthDocTypes] = useState<AuthDocSetting[]>([]);
    const [optionsLoading, setOptionsLoading] = useState(true);
    
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [isRecordFeeAlertOpen, setIsRecordFeeAlertOpen] = useState(false);
    const [noteContent, setNoteContent] = useState({ title: '', content: '' });
    const [membershipFee, setMembershipFee] = useState('');
    const [pendingMembershipSelection, setPendingMembershipSelection] = useState<{ status: CompanyUserProfile['membershipStatus'], endDate?: Date } | null>(null);
    
    const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

    const fetchCompanyData = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        if (!companyId) {
            setFetchError("Firma ID'si bulunamadı.");
            setIsLoading(false);
            return;
        }
        try {
            const profile = await getUserProfile(companyId);
            if (!profile) {
                throw new Error("Firma profili bulunamadı veya geçerli değil.");
            }
            setCompany(profile);
        } catch (err: any) {
            setFetchError(err.message || "Firma bilgileri yüklenirken bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    const fetchOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            const [membershipsFromDb, vehicles, authDocs] = await Promise.all([
                getAllMemberships(),
                getAllVehicleTypes(),
                getAllAuthDocs()
            ]);
            setMembershipOptions(membershipsFromDb.filter(m => m.isActive));
            setVehicleTypes(vehicles.filter(v => v.isActive));
            setAuthDocTypes(authDocs.filter(d => d.isActive));
        } catch (error) {
             console.error("Error fetching options:", error);
             toast({ title: "Hata", description: "Sayfa seçenekleri yüklenirken bir sorun oluştu.", variant: "destructive" });
        }
        setOptionsLoading(false);
    }, [toast]);

    useEffect(() => {
        fetchCompanyData();
        fetchOptions();
    }, [fetchCompanyData, fetchOptions]);

    useEffect(() => {
        if (editingUser) {
            let membershipEndDateToSet: Date | undefined = undefined;
            if (editingUser.membershipEndDate && isValid(parseISO(editingUser.membershipEndDate as string))) {
                membershipEndDateToSet = parseISO(editingUser.membershipEndDate as string);
            }
            setCurrentFormData({
                ...editingUser,
                password: editingUser.password || '',
                membershipEndDate: membershipEndDateToSet,
                workingMethods: editingUser.workingMethods || [],
                workingRoutes: editingUser.workingRoutes || [],
                preferredCities: Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, i) => editingUser.preferredCities?.[i] || ''),
                preferredCountries: Array.from({ length: MAX_PREFERRED_LOCATIONS }).map((_, i) => editingUser.preferredCountries?.[i] || ''),
                ownedVehicles: editingUser.ownedVehicles || [],
                authDocuments: editingUser.authDocuments || [],
            });
        }
    }, [editingUser]);

    useEffect(() => {
        if (currentFormData.addressCountry === 'TR') {
            const city = currentFormData.addressCity;
            if (city && TURKISH_CITIES.includes(city as TurkishCity)) {
            setAvailableDistricts(DISTRICTS_BY_CITY_TR[city as TurkishCity] || []);
            } else {
            setAvailableDistricts([]);
            }
        } else {
            setAvailableDistricts([]);
            setCurrentFormData(prev => ({...prev, addressCity: ''}))
        }
    }, [currentFormData.addressCity, currentFormData.addressCountry]);

    const handleEdit = (user: CompanyUserProfile) => {
        setEditingUser(user);
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingUser) return;
        
        const requiredFields: (keyof CompanyUserProfile)[] = ['name', 'email', 'category', 'contactFullName', 'mobilePhone', 'companyType', 'addressCountry', 'addressCity', 'fullAddress'];
        for (const field of requiredFields) {
            const value = (currentFormData as any)[field];
            if (!value || (typeof value === 'string' && !value.trim())) {
                toast({ title: "Eksik Bilgi", description: `Lütfen zorunlu alanları (*) doldurun. Eksik alan: ${field}`, variant: "destructive" });
                setFormSubmitting(false);
                return;
            }
        }
        
        setFormSubmitting(true);

        const dataToSubmit: any = { ...currentFormData };
        if (dataToSubmit.membershipEndDate instanceof Date) {
            dataToSubmit.membershipEndDate = format(dataToSubmit.membershipEndDate, "yyyy-MM-dd");
        } else if (dataToSubmit.membershipEndDate === undefined || dataToSubmit.membershipEndDate === null) {
            dataToSubmit.membershipEndDate = null; 
        }
        dataToSubmit.name = dataToSubmit.companyTitle || dataToSubmit.name;
        dataToSubmit.preferredCities = (dataToSubmit.preferredCities || []).filter((c: string) => c);
        dataToSubmit.preferredCountries = (dataToSubmit.preferredCountries || []).filter((c: string) => c);
        
        const { id, createdAt, email, role, ...updateData } = dataToSubmit; 
        
        const success = await updateUserProfile(editingUser.id, updateData as Partial<CompanyUserProfile>);
        if (success) {
            toast({ title: "Başarılı", description: "Firma profili güncellendi." });
            fetchCompanyData();
        } else {
            toast({ title: "Hata", description: "Firma profili güncellenemedi.", variant: "destructive" });
        }
        setFormSubmitting(false);
        setIsEditDialogOpen(false);
    };

    const handleOpenChangePasswordModal = (user: CompanyUserProfile) => {
        setIsChangePasswordModalOpen(true);
    };

    const handleDialogMultiCheckboxChange = (value: string, key: 'workingMethods' | 'workingRoutes' | 'ownedVehicles' | 'authDocuments') => {
        const currentValues = currentFormData[key] || [];
        const newValues = currentValues.includes(value as never)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value as never];
        setCurrentFormData(prev => ({ ...prev, [key]: newValues }));
    };

    const handleDialogPreferredLocationChange = (index: number, value: string, type: 'city' | 'country') => {
        const actualValue = value === CLEAR_SELECTION_VALUE ? '' : value;
        const key = type === 'city' ? 'preferredCities' : 'preferredCountries';
        const newLocations = [...(currentFormData[key] || Array(MAX_PREFERRED_LOCATIONS).fill(''))];
        newLocations[index] = actualValue;
        setCurrentFormData(prev => ({...prev, [key]: newLocations}));
    };

    const handleNoteSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingUser || !noteContent.title.trim() || !noteContent.content.trim()) return;

        setFormSubmitting(true);
        const success = await addCompanyNote(editingUser.id, {
            title: noteContent.title,
            content: noteContent.content,
            author: 'Admin',
            type: 'note',
        });
        if (success) {
            toast({ title: "Başarılı", description: "Not eklendi." });
            setIsAddNoteModalOpen(false);
            setNoteContent({ title: '', content: '' });
        } else {
            toast({ title: "Hata", description: "Not eklenirken bir sorun oluştu.", variant: "destructive" });
        }
        setFormSubmitting(false);
    };
    
    const handleMembershipChange = (value: string) => {
        const newStatus = value as CompanyUserProfile['membershipStatus'];
        const oldStatus = currentFormData.membershipStatus || 'Yok';

        if (newStatus !== 'Yok' && oldStatus === 'Yok') {
            const selectedPackage = membershipOptions.find(opt => opt.name === newStatus);
            if (selectedPackage) {
                const newEndDate = new Date();
                if (selectedPackage.durationUnit === 'Ay') newEndDate.setMonth(newEndDate.getMonth() + selectedPackage.duration);
                else if (selectedPackage.durationUnit === 'Yıl') newEndDate.setFullYear(newEndDate.getFullYear() + selectedPackage.duration);
                else if (selectedPackage.durationUnit === 'Gün') newEndDate.setDate(newEndDate.getDate() + selectedPackage.duration);
                setPendingMembershipSelection({ status: newStatus, endDate: newEndDate });
                setIsRecordFeeAlertOpen(true);
            } else {
                setCurrentFormData(prev => ({ ...prev, membershipStatus: newStatus, membershipEndDate: undefined }));
            }
        } else if (newStatus === 'Yok') {
            setCurrentFormData(prev => ({...prev, membershipStatus: newStatus, membershipEndDate: undefined }));
        } else {
            setCurrentFormData(prev => ({...prev, membershipStatus: newStatus}));
        }
    };
    
    const handleRecordFeeSubmit = async () => {
        if (!editingUser || !pendingMembershipSelection) return;
        const fee = parseFloat(membershipFee);
        if (isNaN(fee) || fee <= 0) {
            toast({ title: "Geçersiz Ücret", description: "Lütfen geçerli bir ücret tutarı girin.", variant: "destructive" });
            return;
        }
        setFormSubmitting(true);
        
        const noteSuccess = await addCompanyNote(editingUser.id, {
            title: `Üyelik Satışı: ${editingUser.name}`,
            content: `Yeni üyelik paketi: ${pendingMembershipSelection.status}. Alınan ücret: ${membershipFee} TL. Yeni son kullanma tarihi: ${pendingMembershipSelection.endDate ? format(pendingMembershipSelection.endDate, 'dd.MM.yyyy') : 'N/A'}`,
            author: 'Admin',
            type: 'payment',
        });
        
        if (noteSuccess) {
            toast({ title: "Not Eklendi", description: "Üyelik ücreti kaydedildi." });
            setCurrentFormData(prev => ({
                ...prev, 
                membershipStatus: pendingMembershipSelection.status,
                membershipEndDate: pendingMembershipSelection.endDate
            }));
        } else {
            toast({ title: "Hata", description: "Ücret notu kaydedilemedi.", variant: "destructive" });
        }
        
        setFormSubmitting(false);
        setIsRecordFeeAlertOpen(false);
        setMembershipFee('');
        setPendingMembershipSelection(null);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-1/3 mb-4" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 w-full lg:col-span-1" />
                    <Skeleton className="h-96 w-full lg:col-span-2" />
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="text-center py-10">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <h3 className="mt-4 text-lg font-semibold text-destructive-foreground">{fetchError}</h3>
                <Button onClick={() => router.back()} variant="outline" className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                </Button>
            </div>
        );
    }
    
    if (!company) return null;

    const renderItemBadges = (items: string[] | undefined, map: readonly { id: string, label: string }[] | readonly { code: string, name: string }[], emptyText: string) => {
        if (!items || items.length === 0) {
            return <p className="text-sm text-muted-foreground italic">{emptyText}</p>;
        }
        const getLabel = (value: string) => {
            if(map.length === 0) return value;
            const found = map.find(item => ('id' in item && item.id === value) || ('code' in item && item.code === value));
            return found ? ('label' in found ? found.label : found.name) : value;
        };
        return <div className="flex flex-wrap gap-2">{items.map((item, index) => <Badge key={index} variant="secondary">{getLabel(item)}</Badge>)}</div>;
    };
    
    const renderSimpleBadges = (items: string[] | undefined, emptyText: string) => {
        if (!items || items.length === 0) return <p className="text-sm text-muted-foreground italic">{emptyText}</p>;
        return <div className="flex flex-wrap gap-2">{items.map((item, index) => <Badge key={index} variant="outline">{item}</Badge>)}</div>;
    };

    const renderOptionsSkeletons = () => <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-8 w-full"/>)}</div>;
    
    const isSponsor = company.sponsorships && company.sponsorships.length > 0;

    return (
        <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4"/> Firma Listesine Geri Dön
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-24">
                     <Card className={cn("shadow-lg", isSponsor && "border-yellow-400/50 ring-2 ring-yellow-400/80")}>
                        <CardHeader className="items-center text-center p-4 relative">
                            {isSponsor && <Badge variant="default" className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90 shadow-lg px-3 py-1 text-sm z-10"><Star className="h-4 w-4 mr-1.5"/> SPONSOR</Badge>}
                            <Avatar className="w-28 h-28 mt-4 mb-3 border-2 border-muted shadow-md rounded-md">
                                <AvatarImage src={company.logoUrl} alt={`${company.name} logo`} className="object-contain" />
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary rounded-md">{company.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-2xl">{company.name}</CardTitle>
                            <CardDescription>{company.category}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex flex-col gap-2 p-4">
                            <Button onClick={() => handleEdit(company)} className="w-full"><Edit size={16} /> Profili Düzenle</Button>
                             <Button onClick={() => router.push(`/admin/directory/${company.id}/notes?source=company&name=${encodeURIComponent(company.name)}`)} variant="outline" className="w-full"><StickyNote size={16}/> Notları Görüntüle</Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-xl">Firma Detayları</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><strong className="text-muted-foreground">Yetkili:</strong> {company.contactFullName || '-'}</div>
                                <div><strong className="text-muted-foreground">Firma Türü:</strong> {company.companyType === 'local' ? 'Yerel Firma' : 'Yabancı Firma'}</div>
                                <div><strong className="text-muted-foreground">E-Posta:</strong> {company.email || '-'}</div>
                                <div><strong className="text-muted-foreground">Durum:</strong> <Badge variant={company.isActive ? 'default' : 'destructive'} className={company.isActive ? "bg-green-500/10 text-green-700 border-green-400" : "bg-yellow-500/10 text-yellow-700 border-yellow-400"}>{company.isActive ? "Onaylı" : "Onay Bekliyor"}</Badge></div>
                                <div><strong className="text-muted-foreground">Cep Tel:</strong> {company.mobilePhone || '-'}</div>
                                <div><strong className="text-muted-foreground">İş Tel:</strong> {company.workPhone || '-'}</div>
                            </div>
                            <div><strong className="text-muted-foreground">Adres:</strong> {`${company.fullAddress || ''}${company.addressDistrict ? `, ${company.addressDistrict}` : ''}${company.addressCity ? `, ${company.addressCity}` : ''}`}</div>
                            <div>
                                <strong className="text-muted-foreground block mb-1">Çalışma Yöntemleri:</strong>
                                {renderItemBadges(company.workingMethods, WORKING_METHODS, "Çalışma yöntemi belirtilmemiş.")}
                            </div>
                            <div>
                                <strong className="text-muted-foreground block mb-1">Çalışma Rotaları:</strong>
                                {renderItemBadges(company.workingRoutes, WORKING_ROUTES, "Çalışma rotası belirtilmemiş.")}
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Truck size={20} /> Sahip Olunan Araçlar</CardTitle></CardHeader>
                        <CardContent>{renderSimpleBadges(company.ownedVehicles, "Firma sahip olduğu araçları belirtmemiştir.")}</CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-xl flex items-center gap-2"><FileText size={20} /> Yetki Belgeleri</CardTitle></CardHeader>
                        <CardContent>{renderSimpleBadges(company.authDocuments, "Firma sahip olduğu yetki belgelerini belirtmemiştir.")}</CardContent>
                    </Card>
                </div>
            </div>

            {/* MODALS */}
            <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { setIsEditDialogOpen(isOpen); if (!isOpen) setEditingUser(null); }}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <form onSubmit={handleEditSubmit}>
                    <DialogHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
                        <DialogTitle>Firma Profilini Düzenle</DialogTitle>
                        <DialogDescription>{editingUser ? `"${editingUser.name}" firmasının profilini güncelleyin.` : ''}</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Giriş ve Temel Bilgiler</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-logoUrl">Logo URL'si</Label>
                                    <Input id="edit-logoUrl" value={currentFormData.logoUrl || ''} onChange={(e) => setCurrentFormData(prev => ({ ...prev, logoUrl: e.target.value }))} placeholder="https://.../logo.png" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-companyTitle">Firma Adı (*)</Label>
                                        <Input id="edit-companyTitle" value={currentFormData.companyTitle || ''} onChange={(e) => setCurrentFormData(prev => ({ ...prev, name: e.target.value, companyTitle: e.target.value }))} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-email">E-posta Adresi (Değiştirilemez)</Label>
                                        <Input id="edit-email" type="email" value={currentFormData.email || ''} disabled />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Kayıtlı Şifre (Görüntüleniyor)</Label>
                                    <Input value={currentFormData.password || 'Şifre kaydı yok'} disabled />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Firma Şifresini Değiştir</Label>
                                    <Button type="button" variant="secondary" onClick={() => editingUser && handleOpenChangePasswordModal(editingUser)} className="w-full">
                                        <KeyRound className="mr-2 h-4 w-4" /> Firma Şifresini Değiştir
                                    </Button>
                                </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-category">Firma Kategorisi (*)</Label>
                                    <Select value={currentFormData.category} onValueChange={(value) => setCurrentFormData(prev => ({...prev, category: value as CompanyCategory}))}><SelectTrigger id="edit-category"><SelectValue /></SelectTrigger><SelectContent>{COMPANY_CATEGORIES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>İletişim Bilgileri</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-contactFullName">Yetkili Adı Soyadı (*)</Label>
                                        <Input id="edit-contactFullName" value={currentFormData.contactFullName || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, contactFullName: e.target.value}))} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edit-mobilePhone">Cep Telefonu (*)</Label>
                                        <Input id="edit-mobilePhone" value={currentFormData.mobilePhone || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, mobilePhone: e.target.value}))} required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5"><Label htmlFor="edit-workPhone">İş Telefonu</Label><Input id="edit-workPhone" value={currentFormData.workPhone || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, workPhone: e.target.value}))} /></div>
                                    <div className="space-y-1.5"><Label htmlFor="edit-fax">Fax</Label><Input id="edit-fax" value={currentFormData.fax || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, fax: e.target.value}))} /></div>
                                    <div className="space-y-1.5"><Label htmlFor="edit-website">Web Sitesi</Label><Input id="edit-website" value={currentFormData.website || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, website: e.target.value}))} /></div>
                                </div>
                                <div className="space-y-1.5"><Label htmlFor="edit-companyDescription">Firma Tanıtım Yazısı</Label><Textarea id="edit-companyDescription" value={currentFormData.companyDescription || ''} onChange={(e) => setCurrentFormData(prev => ({...prev, companyDescription: e.target.value}))} rows={2} /></div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Adres ve Firma Tipi</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label className="font-medium">Firma Türü (*)</Label><RadioGroup value={currentFormData.companyType} onValueChange={(value) => setCurrentFormData(prev => ({...prev, companyType: value as CompanyUserType}))} className="flex gap-4">{COMPANY_TYPES.map(type => (<div key={type.value} className="flex items-center space-x-2"><RadioGroupItem value={type.value} id={`edit-type-${type.value}`} /><Label htmlFor={`edit-type-${type.value}`} className="font-normal">{type.label}</Label></div>))}</RadioGroup></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><Label htmlFor="edit-addressCountry">Adres Ülke (*)</Label><Select value={currentFormData.addressCountry} onValueChange={(v) => setCurrentFormData(prev => ({...prev, addressCountry: v}))} required><SelectTrigger id="edit-addressCountry"><SelectValue placeholder="Ülke seçin..." /></SelectTrigger><SelectContent>{COUNTRIES.filter(c=>c.code !== 'OTHER').map(country => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-1.5"><Label htmlFor="edit-addressCity">Adres İl (*)</Label><Select value={currentFormData.addressCity} onValueChange={(v) => setCurrentFormData(prev => ({...prev, addressCity: v, addressDistrict: ''}))} required disabled={currentFormData.addressCountry !== 'TR'}><SelectTrigger id="edit-addressCity"><SelectValue placeholder="İl seçin..." /></SelectTrigger><SelectContent>{TURKISH_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent></Select></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><Label htmlFor="edit-addressDistrict">Adres İlçe</Label><Select value={currentFormData.addressDistrict} onValueChange={(v) => setCurrentFormData(prev => ({...prev, addressDistrict: v}))} disabled={!availableDistricts.length}><SelectTrigger id="edit-addressDistrict"><SelectValue placeholder="İlçe seçin..." /></SelectTrigger><SelectContent>{availableDistricts.map(district => <SelectItem key={district} value={district}>{district}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-1.5"><Label htmlFor="edit-fullAddress">Açık Adres (*)</Label><Textarea id="edit-fullAddress" placeholder="Mahalle, cadde, sokak, no, daire..." value={currentFormData.fullAddress} onChange={(e) => setCurrentFormData(prev => ({...prev, fullAddress: e.target.value}))} required /></div>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Çalışma Alanları ve Tercihler</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div><Label className="font-medium text-sm mb-2 block">Çalışma Şekli</Label><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{WORKING_METHODS.map(method => (<div key={method.id} className="flex items-center space-x-2"><Checkbox id={`edit-wm-${method.id}`} checked={(currentFormData.workingMethods || []).includes(method.id as WorkingMethodType)} onCheckedChange={() => handleDialogMultiCheckboxChange(method.id, 'workingMethods')} /><Label htmlFor={`edit-wm-${method.id}`} className="font-normal text-sm">{method.label}</Label></div>))}</div></div>
                                <div><Label className="font-medium text-sm mb-2 block">Çalışma Yolu</Label><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">{WORKING_ROUTES.map(route => (<div key={route.id} className="flex items-center space-x-2"><Checkbox id={`edit-wr-${route.id}`} checked={(currentFormData.workingRoutes || []).includes(route.id as WorkingRouteType)} onCheckedChange={() => handleDialogMultiCheckboxChange(route.id, 'workingRoutes')} /><Label htmlFor={`edit-wr-${route.id}`} className="font-normal text-sm">{route.label}</Label></div>))}</div></div>
                                <div className="border-t pt-4"><Label className="font-medium text-md mb-3 block">Tercih Edilen İller (En fazla {MAX_PREFERRED_LOCATIONS})</Label><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{(currentFormData.preferredCities || []).map((city, index) => (<div key={`edit-city-${index}`} className="space-y-1.5"><Select value={city} onValueChange={(val) => handleDialogPreferredLocationChange(index, val, 'city')}><SelectTrigger><SelectValue placeholder={`Şehir ${index + 1}`} /></SelectTrigger><SelectContent><SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>{TURKISH_CITIES.map(c => <SelectItem key={c} value={c} disabled={(currentFormData.preferredCities || []).includes(c) && city !== c}>{c}</SelectItem>)}</SelectContent></Select></div>))}</div></div>
                                <div className="border-t pt-4"><Label className="font-medium text-md mb-3 block">Tercih Edilen Ülkeler (En fazla {MAX_PREFERRED_LOCATIONS})</Label><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{(currentFormData.preferredCountries || []).map((country, index) => (<div key={`edit-country-${index}`} className="space-y-1.5"><Select value={country} onValueChange={(val) => handleDialogPreferredLocationChange(index, val, 'country')}><SelectTrigger><SelectValue placeholder={`Ülke ${index + 1}`} /></SelectTrigger><SelectContent><SelectItem value={CLEAR_SELECTION_VALUE}>Seçimi Kaldır</SelectItem>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code} disabled={(currentFormData.preferredCountries || []).includes(c.code) && country !== c.code}>{c.name}</SelectItem>)}</SelectContent></Select></div>))}</div></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Araçlar ve Belgeler</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                                <div><Label className="font-medium text-sm mb-2 block">Sahip Olunan Araç Tipleri</Label>{optionsLoading ? renderOptionsSkeletons() : (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{vehicleTypes.map(vehicle => (<div key={vehicle.id} className="flex items-center space-x-2"><Checkbox id={`edit-vehicle-${vehicle.id}`} checked={(currentFormData.ownedVehicles || []).includes(vehicle.name)} onCheckedChange={() => handleDialogMultiCheckboxChange(vehicle.name, 'ownedVehicles')} /><Label htmlFor={`edit-vehicle-${vehicle.id}`} className="font-normal text-sm cursor-pointer">{vehicle.name}</Label></div>))}</div>)}</div>
                                <div className="border-t pt-6"><Label className="font-medium text-sm mb-2 block">Yetki Belgeleri</Label>{optionsLoading ? renderOptionsSkeletons() : (<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">{authDocTypes.map(doc => (<div key={doc.id} className="flex items-center space-x-2"><Checkbox id={`edit-doc-${doc.id}`} checked={(currentFormData.authDocuments || []).includes(doc.name)} onCheckedChange={() => handleDialogMultiCheckboxChange(doc.name, 'authDocuments')} /><Label htmlFor={`edit-doc-${doc.id}`} className="font-normal text-sm cursor-pointer">{doc.name}</Label></div>))}</div>)}</div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Üyelik ve Durum</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5"><Label htmlFor="edit-membershipStatus">Üyelik Durumu</Label><Select value={currentFormData.membershipStatus || 'Yok'} onValueChange={handleMembershipChange} disabled={optionsLoading}><SelectTrigger id="edit-membershipStatus"><SelectValue placeholder={optionsLoading ? "Yükleniyor..." : "Üyelik durumu seçin"}/></SelectTrigger><SelectContent><SelectItem value="Yok">Yok</SelectItem>{membershipOptions.map(opt => <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>)}</SelectContent></Select></div>
                                    <div className="space-y-1.5"><Label htmlFor="edit-membershipEndDate">Üyelik Bitiş Tarihi</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!currentFormData.membershipEndDate && "text-muted-foreground"}`}><CalendarIcon className="mr-2 h-4 w-4" />{currentFormData.membershipEndDate && isValid(new Date(currentFormData.membershipEndDate!)) ? format(new Date(currentFormData.membershipEndDate!), "PPP", { locale: tr }) : <span>Tarih seçin</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start" side="bottom"><Calendar mode="single" locale={tr} selected={currentFormData.membershipEndDate ? new Date(currentFormData.membershipEndDate) : undefined} onSelect={(date) => { setCurrentFormData(prev => ({...prev, membershipEndDate: date}));}} disabled={(date) => date < new Date()} initialFocus /></PopoverContent></Popover></div>
                                </div>
                                <div className="flex items-center space-x-2"><Switch id="edit-isActive" checked={currentFormData.isActive === true} onCheckedChange={(checked) => setCurrentFormData(prev => ({...prev, isActive: checked}))} /><Label htmlFor="edit-isActive">Firma Onayı (Aktif/Pasif)</Label></div>
                            </CardContent>
                            <CardFooter><Button type="button" variant="outline" onClick={() => {if (editingUser) {setNoteContent({ title: `Not: ${editingUser.name}`, content: '' }); setIsAddNoteModalOpen(true);}} }><StickyNote className="mr-2 h-4 w-4" />Bu Firma İçin Not Ekle</Button></CardFooter>
                        </Card>
                    </div>
                    <DialogFooter className="p-6 pt-4 border-t sticky bottom-0 bg-background"><DialogClose asChild><Button type="button" variant="outline" disabled={formSubmitting}>İptal</Button></DialogClose><Button type="submit" disabled={formSubmitting}>{formSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...</> : 'Değişiklikleri Kaydet'}</Button></DialogFooter>
                </form>
                </DialogContent>
            </Dialog>

            {editingUser && (
                <>
                    <Dialog open={isAddNoteModalOpen} onOpenChange={setIsAddNoteModalOpen}>
                        <DialogContent><form onSubmit={handleNoteSubmit}><DialogHeader><DialogTitle>Firma İçin Not Ekle</DialogTitle><DialogDescription>"{editingUser.name}" firması için dahili bir not oluşturun. Bu notlar sadece adminler tarafından görülebilir.</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="note-title" className="text-right">Başlık</Label><Input id="note-title" value={noteContent.title} onChange={(e) => setNoteContent(prev => ({...prev, title: e.target.value}))} className="col-span-3" /></div><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="note-content" className="text-right">İçerik</Label><Textarea id="note-content" value={noteContent.content} onChange={(e) => setNoteContent(prev => ({...prev, content: e.target.value}))} className="col-span-3" /></div></div><DialogFooter><DialogClose asChild><Button variant="outline" type="button">İptal</Button></DialogClose><Button type="submit" disabled={formSubmitting}>{formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Notu Kaydet</Button></DialogFooter></form></DialogContent>
                    </Dialog>

                    <AlertDialog open={isRecordFeeAlertOpen} onOpenChange={setIsRecordFeeAlertOpen}>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Üyelik Ücreti Kaydı</AlertDialogTitle><AlertDialogDescription>Firmaya yeni bir üyelik tanımlıyorsunuz. Lütfen alınan ücreti girin. Bu bilgi, bu firmaya özel "Notlar" bölümüne kaydedilecektir.</AlertDialogDescription></AlertDialogHeader><div className="py-2"><Label htmlFor="membership-fee">Alınan Ücret (TL)</Label><Input id="membership-fee" type="number" value={membershipFee} onChange={(e) => setMembershipFee(e.target.value)} placeholder="Örn: 249"/></div><AlertDialogFooter><AlertDialogCancel onClick={() => setPendingMembershipSelection(null)}>İptal</AlertDialogCancel><AlertDialogAction onClick={handleRecordFeeSubmit} disabled={formSubmitting || !membershipFee}>{formSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Onayla ve Kaydet</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                </>
            )}

            {company && (
                <ChangePasswordByAdminModal isOpen={isChangePasswordModalOpen} onClose={() => setIsChangePasswordModalOpen(false)} user={company} onUpdate={fetchCompanyData} />
            )}
        </div>
    )
}

export default function CompanyProfileAdminPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"/> Yükleniyor...</div>}>
            <CompanyDetailsAdminContent />
        </Suspense>
    )
}
