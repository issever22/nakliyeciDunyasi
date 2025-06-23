
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookUser, Search, AlertTriangle, Loader2, StickyNote, CreditCard, Mail, Phone } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { CompanyUserProfile, CompanyNote } from '@/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getActiveCompanyProfiles } from '@/services/authService'; 
import { getCompanyNotes } from '@/services/companyNotesService';
import { Skeleton } from '@/components/ui/skeleton';

export default function DirectoryPage() {
  const { toast } = useToast();
  const [allCompanies, setAllCompanies] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State for notes modal
  const [isViewNotesModalOpen, setIsViewNotesModalOpen] = useState(false);
  const [notesForViewing, setNotesForViewing] = useState<CompanyNote[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [viewingCompany, setViewingCompany] = useState<CompanyUserProfile | null>(null);
  const [noteFilter, setNoteFilter] = useState<'all' | 'note' | 'payment'>('all');

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const result = await getActiveCompanyProfiles();
      if (result.error) {
        throw new Error(result.error.message);
      }
      setAllCompanies(result.companies);
    } catch (error: any) {
      console.error("Failed to fetch directory companies:", error);
      setFetchError(error.message || "Firmalar yüklenirken bir sorun oluştu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return allCompanies;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allCompanies.filter(company =>
      company.name.toLowerCase().includes(lowerCaseSearch) ||
      company.contactFullName.toLowerCase().includes(lowerCaseSearch) ||
      company.mobilePhone.toLowerCase().includes(lowerCaseSearch) ||
      company.email.toLowerCase().includes(lowerCaseSearch) ||
      (company.workPhone && company.workPhone.toLowerCase().includes(lowerCaseSearch))
    );
  }, [allCompanies, searchTerm]);

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
    if (noteFilter === 'all') {
        return notesForViewing;
    }
    return notesForViewing.filter(note => note.type === noteFilter);
  }, [notesForViewing, noteFilter]);

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><BookUser className="h-6 w-6 text-primary" /> Firma Rehberi</CardTitle>
          <CardDescription>Onaylanmış ve aktif tüm firmaların iletişim bilgileri ve kişisel notlarınız.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rehberde ara (Firma, Yetkili, Telefon, E-posta)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
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
              <Button onClick={fetchCompanies} variant="destructive" className="mt-4">Tekrar Dene</Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Firma Adı</TableHead>
                    <TableHead className="min-w-[150px]">Yetkili Kişi</TableHead>
                    <TableHead className="min-w-[150px]">Cep Telefonu</TableHead>
                    <TableHead className="min-w-[180px]">E-posta</TableHead>
                    <TableHead className="w-[100px] text-right">Notlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length > 0 ? filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.contactFullName}</TableCell>
                      <TableCell>{company.mobilePhone}</TableCell>
                      <TableCell className="text-sm">{company.email}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewNotes(company)} title="Notları Görüntüle">
                          <StickyNote className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Rehberde kayıtlı aktif firma bulunamadı.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {viewingCompany && (
        <Dialog open={isViewNotesModalOpen} onOpenChange={(open) => {
            if (!open) {
              setViewingCompany(null);
              setNoteFilter('all');
            }
            setIsViewNotesModalOpen(open);
          }}>
          <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                  <DialogTitle>"{viewingCompany?.name}" İçin Notlar</DialogTitle>
                  <DialogDescription>
                      Bu firma için kaydedilmiş tüm yönetici notları ve ödeme kayıtları.
                  </DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-2 border-b pb-4">
                  <Button size="sm" variant={noteFilter === 'all' ? 'default' : 'ghost'} onClick={() => setNoteFilter('all')}>Tümü</Button>
                  <Button size="sm" variant={noteFilter === 'note' ? 'default' : 'ghost'} onClick={() => setNoteFilter('note')}>Notlar</Button>
                  <Button size="sm" variant={noteFilter === 'payment' ? 'default' : 'ghost'} onClick={() => setNoteFilter('payment')}>Ödemeler</Button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-1 -mx-1 pr-3">
                  {isNotesLoading ? (
                      <div className="flex justify-center items-center h-24">
                          <Loader2 className="h-6 w-6 animate-spin"/>
                      </div>
                  ) : filteredNotesForViewing.length > 0 ? (
                      <div className="space-y-4">
                          {filteredNotesForViewing.map(note => (
                              <div key={note.id} className="p-4 border rounded-lg bg-muted/30">
                                  <h4 className="font-semibold text-md flex items-center gap-2">
                                      {note.type === 'payment' ? <CreditCard className="h-4 w-4 text-green-600" /> : <StickyNote className="h-4 w-4 text-blue-600" />}
                                      {note.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{note.content}</p>
                                  <p className="text-xs text-muted-foreground/70 mt-3 text-right">
                                      {format(parseISO(note.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                                      {note.author && ` - ${note.author}`}
                                  </p>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-center text-muted-foreground py-8">
                          {noteFilter === 'all' ? 'Bu firma için kayıtlı not bulunmamaktadır.' : `Bu firma için kayıtlı ${noteFilter === 'note' ? 'not' : 'ödeme'} bulunmamaktadır.`}
                      </p>
                  )}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => {
                      setIsViewNotesModalOpen(false);
                      setViewingCompany(null);
                      setNoteFilter('all');
                  }}>Kapat</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
