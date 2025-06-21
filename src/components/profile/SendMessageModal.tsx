
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addMessage } from '@/services/messagesService';
import type { Message } from '@/types';
import { Loader2, Send } from 'lucide-react';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function SendMessageModal({ isOpen, onClose, userId, userName }: SendMessageModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen hem konu hem de mesaj içeriğini doldurun.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

    const messageData: Omit<Message, 'id' | 'createdAt' | 'isRead'> = {
      userId,
      userName,
      title,
      content,
    };

    try {
      const newMessageId = await addMessage(messageData);
      if (newMessageId) {
        toast({
          title: "Mesajınız Gönderildi",
          description: "Mesajınız başarıyla yönetime iletildi. En kısa sürede dönüş yapılacaktır.",
        });
        setTitle('');
        setContent('');
        onClose();
      } else {
        throw new Error("Mesaj gönderilemedi.");
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilirken bir sorun oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setTitle('');
        setContent('');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mesaj Gönder</DialogTitle>
            <DialogDescription>
              Yönetime soru, öneri veya taleplerinizi iletmek için formu kullanabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-1.5">
              <Label htmlFor="message-title">Konu (*)</Label>
              <Input
                id="message-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mesajınızın konusu"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message-content">Mesajınız (*)</Label>
              <Textarea
                id="message-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Lütfen mesajınızı detaylıca yazın..."
                required
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>İptal</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Gönderiliyor...' : 'Mesajı Gönder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
