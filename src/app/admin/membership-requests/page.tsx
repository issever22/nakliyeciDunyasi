
"use client";

import { useState, useEffect, useCallback, type FormEvent, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Handshake, Eye, User, Building, Phone, Mail, MessageCircle, FileText, CalendarIcon, UserPlus, Star, CreditCard, Search, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { tr } from 'date-fns/locale';
import type { MembershipRequest, CompanyUserProfile, MembershipSetting } from '@/types';
import { getAllMembershipRequests, updateMembershipRequestStatus, deleteMembershipRequest } from '@/services/membershipRequestsService';
import { getUserProfile, updateUserProfile } from '@/services/authService';
import { getAllMemberships } from '@/services/membershipsService';
import { addCompanyNote } from '@/services/companyNotesService';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useRouter } from 'next/navigation';

const formatWhatsAppNumber = (phone: string) => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (!cleaned.startsWith('90')) {
    cleaned = '90' + cleaned;
  }
  return cleaned;
};

export default function MembershipRequestsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isMakeMemberModalOpen, setIsMakeMemberModalOpen] = useState(false);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<MembershipRequest | null>(null);

  const [companyProfile, setCompanyProfile] = useState<CompanyUserProfile | null>(null);
  const [membershipOptions, setMembershipOptions] = useState<MembershipSetting[]>([]);
  
  const [selectedMembership, setSelectedMembership] = useState<MembershipSetting | null>(null);
  const [membershipEndDate, setMembershipEndDate] = useState<Date | undefined>();
  const [membershipFee, setMembershipFee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'guest' | 'registered'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MembershipRequest['status']>('all');


  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllMembershipRequests();
    setRequests(data);
    setIsLoading(false);
  }, []);
  
  const fetchMembershipOptions = useCallback(async () => {
    const membershipsFromDb = await getAllMemberships();
    setMembershipOptions(membershipsFromDb.filter(m => m.isActive));
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchMembershipOptions();
  }, [fetchRequests, fetchMembershipOptions]);
  
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
        if (userTypeFilter === 'registered' && !request.userId) return false;
        if (userTypeFilter === 'guest' && request.userId) return false;
        if (statusFilter !== 'all' && request.status !== statusFilter) return false;
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            const searchIn = [ request.name, request.phone, request.email || '', request.companyName || '' ].join(' ').toLowerCase();
            if (!searchIn.includes(lowerCaseSearch)) return false;
        }
        return true;
    });
  }, [requests, searchTerm, userTypeFilter, statusFilter]);

  const handleViewRequest = async (request: MembershipRequest) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    if (request.userId) {
      const profile = await getUserProfile(request.userId);
      setCompanyProfile(profile);
    } else {
      setCompanyProfile(null);
    }
  };

  const handleMakeMemberClick = () => {
    if (!companyProfile) return;
    setIsViewModalOpen(false);
    setIsMakeMemberModalOpen(true);
  };
  
  const handleCreateCompanyClick = () => {
      if (!selectedRequest) return;
      const params = new URLSearchParams();
      params.append('name', selectedRequest.name);
      params.append('phone', selectedRequest.phone);
      if(selectedRequest.email) params.append('email', selectedRequest.email);
      if(selectedRequest.companyName) params.append('companyName', selectedRequest.companyName);
      router.push(`/admin/users/add?${params.toString()}`);
  }

  const handleMembershipPackageSelect = (membershipId: string) => {
      const pkg = membershipOptions.find(m => m.id === membershipId);
      if(pkg) {
          setSelectedMembership(pkg);
          const newEndDate = new Date();
           if (pkg.durationUnit === 'Ay') newEndDate.setMonth(newEndDate.getMonth() + pkg.duration);
           else if (pkg.durationUnit === 'Yıl') newEndDate.setFullYear(newEndDate.getFullYear() + pkg.duration);
           else if (pkg.durationUnit === 'Gün') newEndDate.setDate(newEndDate.getDate() + pkg.duration);
          setMembershipEndDate(newEndDate);
      }
  }

  const handleConfirmMembership = async (e: FormEvent) => {
      e.preventDefault();
      if(!selectedRequest || !companyProfile || !selectedMembership || !membershipEndDate || !membershipFee) {
          toast({ title: "Hata", description: "Lütfen tüm üyelik bilgilerini doldurun.", variant: "destructive" });
          return;
      }
      setIsSubmitting(true);
      try {
          const fee = parseFloat(membershipFee);
          if(isNaN(fee) || fee < 0) {
               toast({ title: "Hata", description: "Geçerli bir ücret girin.", variant: "destructive" });
               setIsSubmitting(false);
               return;
          }

          const profileUpdateSuccess = await updateUserProfile(companyProfile.id, {
              membershipStatus: selectedMembership.name as any,
              membershipEndDate: format(membershipEndDate, 'yyyy-MM-dd')
          });
          if(!profileUpdateSuccess) throw new Error("Firma profili güncellenemedi.");

          await addCompanyNote(companyProfile.id, {
              title: `Üyelik Satışı: ${selectedMembership.name}`,
              content: `"${selectedRequest.name}" talebi üzerinden "${selectedMembership.name}" paketi ${fee} TL karşılığında satıldı. Bitiş tarihi: ${format(membershipEndDate, 'dd.MM.yyyy')}`,
              author: 'Admin',
              type: 'payment'
          });
          
          await deleteMembershipRequest(selectedRequest.id);

          toast({ title: "Başarılı", description: `${companyProfile.name} firması üye yapıldı ve talep listeden kaldırıldı.` });
          setIsMakeMemberModalOpen(false);
          fetchRequests();

      } catch (error: any) {
           toast({ title: "Hata", description: error.message || "Üyelik atama sırasında bir hata oluştu.", variant: "destructive" });
      } finally {
          setIsSubmitting(false);
          setSelectedMembership(null);
          setMembershipFee('');
          setMembershipEndDate(undefined);
      }
  }

  const handleDeleteRequest = async (request: MembershipRequest) => {
    const success = await deleteMembershipRequest(request.id);
    if(success) {
        toast({ title: "Talep Silindi", description: `"${request.name}" adlı talep listeden kaldırıldı.`, variant: "destructive"});
        fetchRequests();
    } else {
        toast({ title: "Hata", description: "Talep silinemedi.", variant: "destructive" });
    }
    setIsDeleteConfirmOpen(false);
    setRequestToDelete(null);
  };

  const handleStatusChange = async (request: MembershipRequest, status: MembershipRequest['status']) => {
      if (status === 'converted') {
          setRequestToDelete(request);
          setIsDeleteConfirmOpen(true);
      } else {
        const success = await updateMembershipRequestStatus(request.id, status);
        if(success) {
            toast({title: "Başarılı", description: "Talep durumu güncellendi."});
            fetchRequests();
        } else {
            toast({title: "Hata", description: "Durum güncellenemedi.", variant: "destructive"});
        }
      }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><Handshake className="h-6 w-6 text-primary" /> Üyelik İstekleri</CardTitle>
          <CardDescription>Kullanıcılardan gelen "Sizi Arayalım" taleplerini yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="İsteklerde ara (isim, firma, tel...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={userTypeFilter} onValueChange={(v) => setUserTypeFilter(v as any)}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Kullanıcı Tipi" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                            <SelectItem value="registered">Kayıtlı Firmalar</SelectItem>
                            <SelectItem value="guest">Misafirler</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Durum" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Durumlar</SelectItem>
                            <SelectItem value="new">Yeni</SelectItem>
                            <SelectItem value="contacted">İletişime Geçildi</SelectItem>
                            <SelectItem value="converted">Üye Yapıldı</SelectItem>
                            <SelectItem value="closed">Kapatıldı</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          {isLoading ? (
            <div className="space-y-4"> <Skeleton className="h-12 w-full" /> <Skeleton className="h-16 w-full" /> <Skeleton className="h-16 w-full" /> </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Firma Adı</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>{request.phone}</TableCell>
                      <TableCell>{request.companyName || '-'}</TableCell>
                      <TableCell>{format(parseISO(request.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })}</TableCell>
                      <TableCell>
                         <Select value={request.status} onValueChange={(value) => handleStatusChange(request, value as MembershipRequest['status'])}>
                            <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">Yeni</SelectItem>
                                <SelectItem value="contacted">İletişime Geçildi</SelectItem>
                                <SelectItem value="converted">Üye Yapıldı</SelectItem>
                                <SelectItem value="closed">Kapatıldı</SelectItem>
                            </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewRequest(request)} title="Detayları Gör"><Eye className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Talebi Sil"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Talebi Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>"{request.name}" adlı kişinin talebini kalıcı olarak sileceksiniz. Bu işlem geri alınamaz.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteRequest(request)}>Onayla ve Sil</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{searchTerm || statusFilter !== 'all' || userTypeFilter !== 'all' ? 'Arama kriterlerine uygun talep bulunamadı.' : 'Henüz üyelik talebi bulunmamaktadır.'}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedRequest && (
        <Dialog open={isViewModalOpen} onOpenChange={(open) => !open && setIsViewModalOpen(false)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Üyelik Talebi: {selectedRequest.name}</DialogTitle>
              <DialogDescription>{format(parseISO(selectedRequest.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <p><strong className="text-muted-foreground w-28 inline-block">Ad Soyad:</strong> {selectedRequest.name}</p>
                <p><strong className="text-muted-foreground w-28 inline-block">Telefon:</strong> {selectedRequest.phone}</p>
                <p><strong className="text-muted-foreground w-28 inline-block">E-posta:</strong> {selectedRequest.email || '-'}</p>
                <p><strong className="text-muted-foreground w-28 inline-block">Firma Adı:</strong> {selectedRequest.companyName || '-'}</p>
                <div className="border-t pt-3"><p className="font-semibold mb-1">Talep Detayları:</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRequest.details}</p></div>
                {companyProfile && <p className="text-sm text-green-600 border-t pt-3"><User className="inline h-4 w-4 mr-1"/> Bu talep mevcut bir firma ({companyProfile.name}) ile ilişkili.</p>}
            </div>
            <DialogFooter className="sm:justify-between flex-wrap gap-2">
                <div className="flex gap-2"><Button asChild size="sm"><a href={`tel:${selectedRequest.phone}`}><Phone className="mr-2 h-4 w-4"/> Ara</a></Button><Button asChild size="sm" variant="secondary"><a href={`https://wa.me/${formatWhatsAppNumber(selectedRequest.phone)}`} target="_blank"><MessageCircle className="mr-2 h-4 w-4"/> WhatsApp</a></Button></div>
                <div className="flex gap-2">
                    {companyProfile ? ( <Button onClick={handleMakeMemberClick} size="sm" variant="default" className="bg-green-600 hover:bg-green-700"><Star className="mr-2 h-4 w-4"/> Üye Yap</Button>) : (<Button onClick={handleCreateCompanyClick} size="sm"><UserPlus className="mr-2 h-4 w-4"/> Firma Oluştur</Button>)}
                     <DialogClose asChild><Button variant="outline" size="sm">Kapat</Button></DialogClose>
                </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isMakeMemberModalOpen && companyProfile && (
        <Dialog open={isMakeMemberModalOpen} onOpenChange={(open) => !open && setIsMakeMemberModalOpen(false)}>
            <DialogContent>
                <form onSubmit={handleConfirmMembership}>
                    <DialogHeader>
                        <DialogTitle>Üyelik Ata: {companyProfile.name}</DialogTitle>
                        <DialogDescription>Firma için bir üyelik paketi seçin, bitiş tarihini ve ücreti onaylayın.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5"><Label>Üyelik Paketi (*)</Label><Select onValueChange={handleMembershipPackageSelect} required><SelectTrigger><SelectValue placeholder="Paket seçin..."/></SelectTrigger><SelectContent>{membershipOptions.map(opt => <SelectItem key={opt.id} value={opt.id}>{opt.name} ({opt.duration} {opt.durationUnit})</SelectItem>)}</SelectContent></Select></div>
                        {selectedMembership && (
                            <>
                                <div className="space-y-1.5">
                                    <Label>Üyelik Bitiş Tarihi</Label>
                                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{membershipEndDate ? format(membershipEndDate, "PPP", { locale: tr }) : <span>Tarih seçin</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={membershipEndDate} onSelect={setMembershipEndDate} initialFocus locale={tr} /></PopoverContent></Popover>
                                </div>
                                <div className="space-y-1.5"><Label htmlFor="fee">Alınan Ücret (TL) (*)</Label><div className="relative"><CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/><Input id="fee" type="number" value={membershipFee} onChange={e => setMembershipFee(e.target.value)} required placeholder="Örn: 249.90" className="pl-10"/></div></div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button" disabled={isSubmitting}>İptal</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting || !selectedMembership}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Onayla ve Üye Yap</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Onayla ve Sil</AlertDialogTitle>
                <AlertDialogDescription>
                    Bu talebi "Üye Yapıldı" olarak işaretleyip listeden kalıcı olarak kaldırmak istediğinize emin misiniz? Bu eylem geri alınamaz.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setRequestToDelete(null)}>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={() => requestToDelete && handleDeleteRequest(requestToDelete)}>Onayla</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    
