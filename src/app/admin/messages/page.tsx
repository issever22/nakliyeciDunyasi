
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Mail, MailOpen, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { tr } from 'date-fns/locale';
import type { Message } from '@/types';
import { getAllMessages, markMessageAsRead } from '@/services/messagesService';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    const data = await getAllMessages();
    setMessages(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);
    if (!message.isRead) {
      handleMarkAsRead(message.id);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    const success = await markMessageAsRead(messageId);
    if (success) {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isRead: true } : m));
    } else {
      toast({ title: "Hata", description: "Mesaj durumu güncellenemedi.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Gelen Mesajlar</CardTitle>
          <CardDescription>Kullanıcılardan gelen mesajları buradan görüntüleyin ve yönetin.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] text-center">Durum</TableHead>
                    <TableHead className="min-w-[180px]">Gönderen</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead className="w-[180px]">Tarih</TableHead>
                    <TableHead className="w-[100px] text-right">Eylemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length > 0 ? messages.map((message) => (
                    <TableRow key={message.id} className={!message.isRead ? "font-bold bg-muted/30" : "font-normal"}>
                      <TableCell className="text-center">
                        {message.isRead ? (
                          <MailOpen className="h-5 w-5 text-muted-foreground mx-auto" title="Okundu" />
                        ) : (
                          <Mail className="h-5 w-5 text-primary mx-auto" title="Yeni Mesaj" />
                        )}
                      </TableCell>
                      <TableCell>{message.userName}</TableCell>
                      <TableCell className="truncate max-w-xs">{message.title}</TableCell>
                      <TableCell>{format(parseISO(message.createdAt), "dd.MM.yyyy HH:mm", { locale: tr })}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleViewMessage(message)} title="Görüntüle">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Gelen kutunuz boş.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMessage && (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage.title}</DialogTitle>
              <DialogDescription>
                <strong>Gönderen:</strong> {selectedMessage.userName} <br />
                <strong>Tarih:</strong> {format(parseISO(selectedMessage.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] my-4 border rounded-md p-4">
              <p className="whitespace-pre-wrap text-sm">{selectedMessage.content}</p>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Kapat</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
