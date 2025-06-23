
"use client";

import { useState, useEffect, useCallback, useMemo, type FormEvent, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, StickyNote, CreditCard, FilePlus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getCompanyNotes, addCompanyNote } from '@/services/companyNotesService';
import { getDirectoryContactNotes, addDirectoryContactNote } from '@/services/directoryContactNotesService';
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
    
    // Form state
    const [newNoteData, setNewNoteData] = useState({ title: '', content: '' });
    const [newNoteType, setNewNoteType] = useState<'note' | 'payment'>('note');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchNotes = useCallback(async () => {
        setIsLoading(true);
        if (itemSource === 'company') {
            const companyNotes = await getCompanyNotes(itemId);
            setNotes(companyNotes);
        } else {
            const contactNotes = await getDirectoryContactNotes(itemId);
            setNotes(contactNotes);
        }
        setIsLoading(false);
    }, [itemId, itemSource]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const filteredNotes = useMemo(() => {
        if (noteFilter === 'all') return notes;
        return notes.filter(note => note.type === noteFilter);
    }, [notes, noteFilter]);

    const handleAddNewNote = async (e: FormEvent) => {
        e.preventDefault();
        if (!itemId || !newNoteData.title.trim() || !newNoteData.content.trim()) {
             toast({ title: "Hata", description: "Başlık ve içerik boş bırakılamaz.", variant: "destructive" });
             return;
        }

        setIsSubmitting(true);
        let success = false;
        try {
            const notePayload = {
                ...newNoteData,
                author: 'Admin',
                type: newNoteType
            };

            if (itemSource === 'company') {
                await addCompanyNote(itemId, notePayload);
            } else {
                await addDirectoryContactNote(itemId, notePayload);
            }
            success = true;
        } catch (err: any) {
             toast({ title: "Hata", description: err.message || "Not eklenirken bir hata oluştu.", variant: "destructive" });
        }

        if (success) {
            toast({ title: "Başarılı", description: "Not eklendi." });
            setNewNoteData({ title: '', content: '' });
            setNewNoteType('note');
            fetchNotes(); // Refetch notes to show the new one
        }
        setIsSubmitting(false);
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
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/directory')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4"/> Rehbere Geri Dön
                </Button>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">"{itemName}" için Notlar</h1>
                <p className="text-muted-foreground mt-1">Bu kayıt için girilmiş tüm yönetici notları ve ödeme kayıtları.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader><CardTitle className="text-lg">Yeni Not Ekle</CardTitle></CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddNewNote} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="note-type">Not Tipi</Label>
                                    <Select value={newNoteType} onValueChange={(v) => setNewNoteType(v as 'note' | 'payment')}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="note">Genel Not</SelectItem>
                                            <SelectItem value="payment">Ödeme Kaydı</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5"><Label htmlFor="note-title">Başlık</Label><Input id="note-title" value={newNoteData.title} onChange={(e) => setNewNoteData(p => ({...p, title: e.target.value}))} required/></div>
                                <div className="space-y-1.5"><Label htmlFor="note-content">İçerik</Label><Textarea id="note-content" value={newNoteData.content} onChange={(e) => setNewNoteData(p => ({...p, content: e.target.value}))} required rows={4}/></div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmitting}><FilePlus className="mr-2 h-4 w-4"/> {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Notu Kaydet'}</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Kayıtlı Notlar</CardTitle>
                            <CardDescription>Mevcut notları görüntüleyin ve filtreleyin.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 border-b pb-4 mb-4">
                                <Button size="sm" variant={noteFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setNoteFilter('all')}>Tümü</Button>
                                <Button size="sm" variant={noteFilter === 'note' ? 'secondary' : 'ghost'} onClick={() => setNoteFilter('note')}>Notlar</Button>
                                <Button size="sm" variant={noteFilter === 'payment' ? 'secondary' : 'ghost'} onClick={() => setNoteFilter('payment')}>Ödemeler</Button>
                            </div>

                             <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-3 -mr-3">
                                {filteredNotes.length > 0 ? (
                                    filteredNotes.map(note => (
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
                                    ))
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                        {noteFilter === 'all' ? 'Bu kayıt için not bulunmamaktadır.' : `Bu kayıt için ${noteFilter === 'note' ? 'not' : 'ödeme'} bulunmamaktadır.`}
                                    </p>
                                )}
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}


export default function NotesPage() {
    return (
        <Suspense fallback={<div>Notlar Yükleniyor...</div>}>
            <NotesPageContent />
        </Suspense>
    )
}

    