
"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, StickyNote, CreditCard, PlusCircle, Edit, Trash2, Search, FilePlus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { updateCompanyNote, deleteCompanyNote, getCompanyNotes, addCompanyNote } from '@/services/companyNotesService';
import { updateDirectoryContactNote, deleteDirectoryContactNote, getDirectoryContactNotes, addDirectoryContactNote } from '@/services/directoryContactNotesService';
import type { CompanyNote } from '@/types';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

function NotesPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const itemId = params.id as string;
    const itemSource = searchParams.get('source') as 'company' | 'manual';
    const itemName = searchParams.get('name') || 'Kayıt';

    const [notes, setNotes] = useState<CompanyNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [noteFilter, setNoteFilter] = useState<'all' | 'note' | 'payment'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<CompanyNote | null>(null);
    const [noteFormData, setNoteFormData] = useState<{ title: string; content: string; type: 'note' | 'payment' }>({ title: '', content: '', type: 'note' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        try {
            if (itemSource === 'company') {
                const companyNotes = await getCompanyNotes(itemId);
                setNotes(companyNotes);
            } else {
                const contactNotes = await getDirectoryContactNotes(itemId);
                setNotes(contactNotes);
            }
        } catch (error) {
            toast({ title: "Hata", description: "Notlar yüklenirken bir sorun oluştu.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [itemId, itemSource, toast]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            const typeMatch = noteFilter === 'all' || note.type === noteFilter;
            const searchTermLower = searchTerm.toLowerCase();
            const searchMatch = !searchTerm || note.title.toLowerCase().includes(searchTermLower) || note.content.toLowerCase().includes(searchTermLower);
            return typeMatch && searchMatch;
        });
    }, [notes, noteFilter, searchTerm]);

    const handleOpenAddModal = () => {
        setEditingNote(null);
        setNoteFormData({ title: '', content: '', type: 'note' });
        setIsNoteModalOpen(true);
    };

    const handleOpenEditModal = (note: CompanyNote) => {
        setEditingNote(note);
        setNoteFormData({ title: note.title, content: note.content, type: note.type || 'note' });
        setIsNoteModalOpen(true);
    };

    const handleNoteFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!noteFormData.title.trim() || !noteFormData.content.trim()) {
            toast({ title: "Hata", description: "Başlık ve içerik boş bırakılamaz.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        let success = false;
        try {
            if (editingNote) {
                const notePayload = { title: noteFormData.title, content: noteFormData.content, type: noteFormData.type };
                if (itemSource === 'company') {
                    await updateCompanyNote(itemId, editingNote.id, notePayload);
                } else {
                    await updateDirectoryContactNote(itemId, editingNote.id, notePayload);
                }
            } else {
                const notePayload = { ...noteFormData, author: 'Admin' };
                if (itemSource === 'company') {
                    await addCompanyNote(itemId, notePayload);
                } else {
                    await addDirectoryContactNote(itemId, notePayload);
                }
            }
            success = true;
        } catch (err: any) {
            toast({ title: "Hata", description: err.message || "İşlem sırasında bir hata oluştu.", variant: "destructive" });
        }

        if (success) {
            toast({ title: "Başarılı", description: `Not başarıyla ${editingNote ? 'güncellendi' : 'eklendi'}.` });
            setIsNoteModalOpen(false);
            fetchNotes();
        }
        setIsSubmitting(false);
    };
    
    const handleDeleteNote = async (noteId: string) => {
        let success = false;
        try {
            if (itemSource === 'company') {
                success = await deleteCompanyNote(itemId, noteId);
            } else {
                success = await deleteDirectoryContactNote(itemId, noteId);
            }
        } catch (err: any) {
            toast({ title: "Hata", description: err.message || "Not silinirken bir hata oluştu.", variant: "destructive" });
        }
        if(success) {
            toast({ title: "Başarılı", description: "Not silindi.", variant: "destructive" });
            fetchNotes();
        } else {
            toast({ title: "Hata", description: "Not silinemedi.", variant: "destructive" });
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/4"/>
                <Skeleton className="h-32 w-full"/>
                <Skeleton className="h-48 w-full"/>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Geri Dön
                </Button>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">"{itemName}" için Notlar</h1>
                <p className="text-muted-foreground mt-1">Bu kayıt için girilmiş tüm yönetici notları ve ödeme kayıtları.</p>
            </div>
            
            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-lg">Kayıtlı Notlar</CardTitle>
                        <CardDescription>Mevcut notları görüntüleyin, filtreleyin veya yeni not ekleyin.</CardDescription>
                    </div>
                    <Button onClick={handleOpenAddModal}><PlusCircle className="mr-2 h-4 w-4"/> Yeni Not Ekle</Button>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-center gap-4 border-b pb-4 mb-4">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Notlarda ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant={noteFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setNoteFilter('all')}>Tümü</Button>
                            <Button size="sm" variant={noteFilter === 'note' ? 'secondary' : 'ghost'} onClick={() => setNoteFilter('note')}>Notlar</Button>
                            <Button size="sm" variant={noteFilter === 'payment' ? 'secondary' : 'ghost'} onClick={() => setNoteFilter('payment')}>Ödemeler</Button>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-3 -mr-3">
                        {filteredNotes.length > 0 ? (
                            filteredNotes.map(note => (
                                <div key={note.id} className="p-4 border rounded-lg bg-muted/30 group">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-md flex items-center gap-2 mb-2">
                                            {note.type === 'payment' ? <CreditCard className="h-4 w-4 text-green-600" /> : <StickyNote className="h-4 w-4 text-blue-600" />}
                                            {note.title}
                                        </h4>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEditModal(note)} title="Düzenle"><Edit className="h-4 w-4" /></Button>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Sil"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                                        <AlertDialogDescription>"{note.title}" başlıklı notu kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteNote(note.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                             </AlertDialog>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                                    <p className="text-xs text-muted-foreground/70 mt-3 text-right">
                                        {format(parseISO(note.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                                        {note.author && ` - ${note.author}`}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                {searchTerm ? `"${searchTerm}" için sonuç bulunamadı.` : 'Bu kayıt için not bulunmamaktadır.'}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
                <DialogContent>
                    <form onSubmit={handleNoteFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingNote ? 'Notu Düzenle' : 'Yeni Not Ekle'}</DialogTitle>
                            <DialogDescription>
                                {itemName} için bir not veya ödeme kaydı girin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="note-type">Not Tipi</Label>
                                <Select value={noteFormData.type} onValueChange={(v) => setNoteFormData(p => ({...p, type: v as 'note' | 'payment'}))}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="note">Genel Not</SelectItem>
                                        <SelectItem value="payment">Ödeme Kaydı</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="note-title">Başlık</Label>
                                <Input id="note-title" value={noteFormData.title} onChange={(e) => setNoteFormData(p => ({...p, title: e.target.value}))} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="note-content">İçerik</Label>
                                <Textarea id="note-content" value={noteFormData.content} onChange={(e) => setNoteFormData(p => ({...p, content: e.target.value}))} required rows={4}/>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline" type="button">İptal</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FilePlus className="mr-2 h-4 w-4" />}
                                {editingNote ? 'Değişiklikleri Kaydet' : 'Notu Kaydet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

        </div>
    );
}

export default function NotesPage() {
    return (
        <Suspense fallback={<div>Notlar Yükleniyor...</div>}>
            <NotesPageContent />
        </Suspense>
    )
}
