
"use client";

import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { BookUser, Search, AlertTriangle, Loader2, StickyNote, PlusCircle, Edit, Trash2, UserPlus, Building, User as UserIcon } from 'lucide-react';
import type { CompanyUserProfile, DirectoryContact } from '@/types';
import { getActiveCompanyProfiles } from '@/services/authService'; 
import { getAllDirectoryContacts, addDirectoryContact, updateDirectoryContact, deleteDirectoryContact } from '@/services/directoryContactsService';
import { Badge } from '@/components/ui/badge';

type DirectoryItem = (CompanyUserProfile & { source: 'company' }) | (DirectoryContact & { source: 'manual' });

export default function DirectoryPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [allDirectoryItems, setAllDirectoryItems] = useState<DirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'company' | 'manual'>('all');

  // State for Add/Edit Contact Modal
  const [isAddEditContactModalOpen, setIsAddEditContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<DirectoryContact | null>(null);
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormData, setContactFormData] = useState<Partial<Omit<DirectoryContact, 'id' | 'createdAt'>>>({});


  const fetchDirectoryData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [companyResult, contacts] = await Promise.all([
        getActiveCompanyProfiles(),
        getAllDirectoryContacts(),
      ]);

      if (companyResult.error) {
        throw new Error(companyResult.error.message);
      }

      const companyItems: DirectoryItem[] = companyResult.companies.map(c => ({...c, source: 'company'}));
      const contactItems: DirectoryItem[] = contacts.map(c => ({...c, source: 'manual'}));

      const mergedItems = [...companyItems, ...contactItems].sort((a,b) => {
        const nameA = 'companyName' in a ? a.companyName || a.name : a.name;
        const nameB = 'companyName' in b ? b.companyName || b.name : b.name;
        return nameA.localeCompare(nameB, 'tr');
      });

      setAllDirectoryItems(mergedItems);
    } catch (error: any) {
      console.error("Failed to fetch directory data:", error);
      setFetchError(error.message || "Rehber verileri yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectoryData();
  }, [fetchDirectoryData]);

  const filteredItems = useMemo(() => {
    return allDirectoryItems.filter(item => {
        // Source Filter
        const sourceMatch = sourceFilter === 'all' || item.source === sourceFilter;
        if (!sourceMatch) return false;

        // Search Term Filter
        if (!searchTerm.trim()) return true;
        const lowerCaseSearch = searchTerm.toLowerCase();
        const name = item.source === 'company' ? item.name : item.companyName || item.name;
        const contactPerson = item.source === 'company' ? item.contactFullName : item.name;
        const phone = item.source === 'company' ? item.mobilePhone : item.phone;
        const email = item.email || '';
        
        return (
          name.toLowerCase().includes(lowerCaseSearch) ||
          contactPerson.toLowerCase().includes(lowerCaseSearch) ||
          phone.toLowerCase().includes(lowerCaseSearch) ||
          email.toLowerCase().includes(lowerCaseSearch)
        );
      });
  }, [allDirectoryItems, searchTerm, sourceFilter]);

  const handleViewNotes = (item: DirectoryItem) => {
    const itemName = 'companyName' in item ? item.companyName || item.name : item.name;
    const itemSource = item.source;
    router.push(`/admin/directory/${item.id}/notes?source=${itemSource}&name=${encodeURIComponent(itemName)}`);
  };

  const handleOpenAddEditContactModal = (contact: DirectoryContact | null) => {
    setEditingContact(contact);
    setContactFormData(contact ? { ...contact } : { name: '', companyName: '', phone: '', email: '' });
    setIsAddEditContactModalOpen(true);
  };

  const handleContactFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactFormData.name || !contactFormData.phone) {
        toast({ title: "Eksik Bilgi", description: "İsim ve Telefon alanları zorunludur.", variant: "destructive" });
        return;
    }
    setContactFormSubmitting(true);
    try {
        if (editingContact) {
            await updateDirectoryContact(editingContact.id, contactFormData);
            toast({ title: "Başarılı", description: "Kişi bilgileri güncellendi." });
        } else {
            await addDirectoryContact(contactFormData);
            toast({ title: "Başarılı", description: "Yeni kişi rehbere eklendi." });
        }
        setIsAddEditContactModalOpen(false);
        fetchDirectoryData();
    } catch (err: any) {
        toast({ title: "Hata", description: err.message || "İşlem sırasında bir hata oluştu.", variant: "destructive" });
    } finally {
        setContactFormSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    await deleteDirectoryContact(contactId);
    toast({ title: "Kişi Silindi", description: "Rehberden kişi kaydı silindi.", variant: "destructive" });
    fetchDirectoryData();
  };

  const handleConvertToCompany = (contact: DirectoryContact) => {
    const params = new URLSearchParams();
    if (contact.name) params.append('name', contact.name);
    if (contact.phone) params.append('phone', contact.phone);
    if (contact.email) params.append('email', contact.email);
    if (contact.companyName) params.append('companyName', contact.companyName);
    setIsAddEditContactModalOpen(false);
    router.push(`/admin/users/add?${params.toString()}`);
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><BookUser className="h-6 w-6 text-primary" /> Firma & Kişi Rehberi</CardTitle>
          <CardDescription>Sistemdeki onaylı firmalar ve manuel olarak eklediğiniz kişiler.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rehberde ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-full"
                    />
                </div>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                    <Button size="sm" variant={sourceFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setSourceFilter('all')}>Tümü</Button>
                    <Button size="sm" variant={sourceFilter === 'company' ? 'secondary' : 'ghost'} onClick={() => setSourceFilter('company')}>Firmalar</Button>
                    <Button size="sm" variant={sourceFilter === 'manual' ? 'secondary' : 'ghost'} onClick={() => setSourceFilter('manual')}>Kişiler</Button>
                </div>
            </div>
            <Button onClick={() => handleOpenAddEditContactModal(null)} className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kişi Ekle
            </Button>
          </div>
          {isLoading ? (
             <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
          ) : fetchError ? (
            <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-destructive-foreground mb-2">Rehber Yüklenemedi</h3>
              <p className="text-sm text-destructive-foreground/80 px-4">{fetchError}</p>
              <p className="text-xs text-destructive-foreground/70 mt-1 px-4">Eksik bir Firestore dizini olabilir. Lütfen tarayıcı konsolunu kontrol edin.</p>
              <Button onClick={fetchDirectoryData} variant="destructive" className="mt-4">Tekrar Dene</Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Firma/Kişi</TableHead>
                    <TableHead className="w-[100px]">Tip</TableHead>
                    <TableHead className="min-w-[150px]">Telefon</TableHead>
                    <TableHead className="min-w-[180px]">E-posta</TableHead>
                    <TableHead className="w-[180px] text-right">Eylemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length > 0 ? filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.source === 'company' ? item.name : item.companyName || item.name}</TableCell>
                      <TableCell>
                        {item.source === 'company' ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-400"><Building className="h-3 w-3 mr-1.5"/> Firma</Badge>
                        ) : (
                           <Badge variant="outline" className="text-green-600 border-green-400"><UserIcon className="h-3 w-3 mr-1.5"/> Kişi</Badge>
                        )}
                      </TableCell>
                      <TableCell>{item.source === 'company' ? item.mobilePhone : item.phone}</TableCell>
                      <TableCell className="text-sm">{item.email || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => handleViewNotes(item)}>
                                <StickyNote className="h-4 w-4 mr-2" /> Notları Gör
                            </Button>
                            {item.source === 'manual' && (
                                <>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenAddEditContactModal(item)} title="Düzenle"><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Sil" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>"{'companyName' in item ? item.companyName || item.name : item.name}" kaydını rehberden kalıcı olarak silmek üzeresiniz.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteContact(item.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                </>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Rehberde kayıtlı firma/kişi bulunamadı.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Contact Modal */}
        <Dialog open={isAddEditContactModalOpen} onOpenChange={setIsAddEditContactModalOpen}>
            <DialogContent>
                <form onSubmit={handleContactFormSubmit}>
                    <DialogHeader>
                        <DialogTitle>{editingContact ? 'Kişiyi Düzenle' : 'Rehbere Yeni Kişi Ekle'}</DialogTitle>
                        <DialogDescription>Rehbere eklenecek kişinin bilgilerini girin. Bu bir firma kaydı oluşturmaz.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5"><Label htmlFor="contact-name">İsim Soyisim (*)</Label><Input id="contact-name" value={contactFormData.name || ''} onChange={(e) => setContactFormData(p => ({ ...p, name: e.target.value }))} required /></div>
                        <div className="space-y-1.5"><Label htmlFor="contact-companyName">Firma Adı</Label><Input id="contact-companyName" value={contactFormData.companyName || ''} onChange={(e) => setContactFormData(p => ({ ...p, companyName: e.target.value }))} /></div>
                        <div className="space-y-1.5"><Label htmlFor="contact-phone">Telefon (*)</Label><Input id="contact-phone" value={contactFormData.phone || ''} onChange={(e) => setContactFormData(p => ({ ...p, phone: e.target.value }))} required /></div>
                        <div className="space-y-1.5"><Label htmlFor="contact-email">E-posta</Label><Input id="contact-email" type="email" value={contactFormData.email || ''} onChange={(e) => setContactFormData(p => ({ ...p, email: e.target.value }))} /></div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        {editingContact && (
                            <Button variant="outline" type="button" onClick={() => handleConvertToCompany(editingContact)}>
                                <UserPlus className="mr-2 h-4 w-4"/> Firmaya Dönüştür
                            </Button>
                        )}
                        <div className="flex gap-2 justify-end sm:mt-0">
                            <DialogClose asChild><Button variant="outline" type="button">İptal</Button></DialogClose>
                            <Button type="submit" disabled={contactFormSubmitting}>{contactFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {editingContact ? 'Güncelle' : 'Kaydet'}</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

    </div>
  );
}

    
