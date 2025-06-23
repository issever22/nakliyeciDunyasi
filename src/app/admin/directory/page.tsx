
"use client";

import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { BookUser, Search, AlertTriangle, Loader2, StickyNote, CreditCard, Mail, Phone, PlusCircle, Edit, Trash2, Repeat, UserPlus } from 'lucide-react';
import type { CompanyUserProfile, CompanyNote, DirectoryContact } from '@/types';
import { getActiveCompanyProfiles } from '@/services/authService'; 
import { getCompanyNotes } from '@/services/companyNotesService';
import { getAllDirectoryContacts, addDirectoryContact, updateDirectoryContact, deleteDirectoryContact } from '@/services/directoryContactsService';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

type DirectoryItem = (CompanyUserProfile & { source: 'company' }) | (DirectoryContact & { source: 'manual' });

export default function DirectoryPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [allDirectoryItems, setAllDirectoryItems] = useState<DirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for notes modal
  const [isViewNotesModalOpen, setIsViewNotesModalOpen] = useState(false);
  const [notesForViewing, setNotesForViewing] = useState<CompanyNote[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<CompanyUserProfile | null>(null);
  const [noteFilter, setNoteFilter] = useState<'all' | 'note' | 'payment'>('all');

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
    if (!searchTerm) return allDirectoryItems;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allDirectoryItems.filter(item => {
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
  }, [allDirectoryItems, searchTerm]);

  const handleViewNotes = async (company: CompanyUserProfile) => {
    setViewingCompany(company);
    setNoteFilter('all');
    setIsNotesLoading(true);
    setIsViewNotesModalOpen(true);
    const notes = await getCompanyNotes(company.id);
    setNotesForViewing(notes);
    setIsNotesLoading(false);
  };
  
  const filteredNotesForViewing = useMemo(() => {
    if (noteFilter === 'all') return notesForViewing;
    return notesForViewing.filter(note => note.type === noteFilter);
  }, [notesForViewing, noteFilter]);

  const handleOpenAddEditContactModal = (contact: DirectoryContact | null) => {
    setEditingContact(contact);
    setContactFormData(contact ? { ...contact } : { name: '', companyName: '', phone: '', email: '', notes: '' });
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
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rehberde ara (Firma, Kişi, Telefon, E-posta)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={() => handleOpenAddEditContactModal(null)}>
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
                    <TableHead className="min-w-[180px]">Firma Adı</TableHead>
                    <TableHead className="min-w-[150px]">Yetkili/Kişi Adı</TableHead>
                    <TableHead className="min-w-[150px]">Telefon</TableHead>
                    <TableHead className="min-w-[180px]">E-posta</TableHead>
                    <TableHead className="w-[180px] text-right">Eylemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length > 0 ? filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.source === 'company' ? item.name : (item.companyName || <span className="text-muted-foreground italic">(Kişi)</span>)}</TableCell>
                      <TableCell>{item.source === 'company' ? item.contactFullName : item.name}</TableCell>
                      <TableCell>{item.source === 'company' ? item.mobilePhone : item.phone}</TableCell>
                      <TableCell className="text-sm">{item.email || '-'}</TableCell>
                      <TableCell className="text-right">
                        {item.source === 'company' ? (
                             <Button variant="outline" size="sm" onClick={() => handleViewNotes(item)}>
                                <StickyNote className="h-4 w-4 mr-2" /> Notları Gör
                            </Button>
                        ) : (
                            <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenAddEditContactModal(item)} title="Düzenle"><Edit className="h-4 w-4" /></Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Sil" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Emin misiniz?</AlertDialogTitle><AlertDialogDescription>"{item.name}" adlı kişiyi rehberden kalıcı olarak silmek üzeresiniz.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteContact(item.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                <Button variant="outline" size="sm" onClick={() => handleConvertToCompany(item)}><UserPlus className="h-4 w-4 mr-2"/> Firmaya Dönüştür</Button>
                            </div>
                        )}
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

      {/* View Notes Modal */}
      {viewingCompany && (
        <Dialog open={isViewNotesModalOpen} onOpenChange={(open) => {
            if (!open) setViewingCompany(null);
            setIsViewNotesModalOpen(open);
        }}>
          <DialogContent className="sm:max-w-3xl">
              <DialogHeader><DialogTitle>"{viewingCompany?.name}" İçin Notlar</DialogTitle><DialogDescription>Bu firma için kaydedilmiş tüm yönetici notları ve ödeme kayıtları.</DialogDescription></DialogHeader>
              <div className="flex items-center gap-2 border-b pb-4"><Button size="sm" variant={noteFilter === 'all' ? 'default' : 'ghost'} onClick={() => setNoteFilter('all')}>Tümü</Button><Button size="sm" variant={noteFilter === 'note' ? 'default' : 'ghost'} onClick={() => setNoteFilter('note')}>Notlar</Button><Button size="sm" variant={noteFilter === 'payment' ? 'default' : 'ghost'} onClick={() => setNoteFilter('payment')}>Ödemeler</Button></div>
              <div className="max-h-[50vh] overflow-y-auto p-1 -mx-1 pr-3">
                  {isNotesLoading ? <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin"/></div> : filteredNotesForViewing.length > 0 ? (
                      <div className="space-y-4">{filteredNotesForViewing.map(note => (<div key={note.id} className="p-4 border rounded-lg bg-muted/30"><h4 className="font-semibold text-md flex items-center gap-2">{note.type === 'payment' ? <CreditCard className="h-4 w-4 text-green-600" /> : <StickyNote className="h-4 w-4 text-blue-600" />}{note.title}</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{note.content}</p><p className="text-xs text-muted-foreground/70 mt-3 text-right">{format(parseISO(note.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}{note.author && ` - ${note.author}`}</p></div>))}</div>
                  ) : (<p className="text-center text-muted-foreground py-8">{noteFilter === 'all' ? 'Bu firma için kayıtlı not bulunmamaktadır.' : `Bu firma için kayıtlı ${noteFilter === 'note' ? 'not' : 'ödeme'} bulunmamaktadır.`}</p>)}
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setIsViewNotesModalOpen(false)}>Kapat</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                        <div className="space-y-1.5"><Label htmlFor="contact-notes">Notlar</Label><Textarea id="contact-notes" value={contactFormData.notes || ''} onChange={(e) => setContactFormData(p => ({ ...p, notes: e.target.value }))} rows={3}/></div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">İptal</Button></DialogClose>
                        <Button type="submit" disabled={contactFormSubmitting}>{contactFormSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} {editingContact ? 'Güncelle' : 'Kaydet'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

    </div>
  );
}
