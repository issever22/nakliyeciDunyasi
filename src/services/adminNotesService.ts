"use client";

import { useState, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addCompanyNote } from '@/services/companyNotesService';
import type { CompanyNote } from '@/types';
import { Loader2, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function FeedbackModal({ isOpen, onClose, userId, userName }: FeedbackModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen hem başlık hem de geri bildirim içeriğini doldurun.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);

    const feedbackData: Omit<CompanyNote, 'id' | 'createdAt'> = {
      title: `Kullanıcı Geri Bildirimi: ${title}`,
      content: content,
      author: userName,
    };

    try {
      const newNoteId = await addCompanyNote(userId, feedbackData);
      if (newNoteId) {
        toast({
          title: "Geri Bildirim Gönderildi",
          description: "Değerli geri bildiriminiz için teşekkür ederiz!",
        });
        setTitle('');
        setContent('');
        onClose();
      } else {
        throw new Error("Geri bildirim kaydedilemedi.");
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Geri bildirim gönderilirken bir sorun oluştu.",
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
            <DialogTitle>Geri Bildirim Gönder</DialogTitle>
            <DialogDescription>
              Platform hakkındaki düşüncelerinizi, önerilerinizi veya karşılaştığınız sorunları bizimle paylaşın.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-1.5">
              <Label htmlFor="feedback-title">Başlık (*)</Label>
              <Input
                id="feedback-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Geri bildiriminizin konusu"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feedback-content">Geri Bildiriminiz (*)</Label>
              <Textarea
                id="feedback-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Lütfen düşüncelerinizi detaylıca yazın..."
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
              {isSubmitting ? 'Gönderiliyor...' : 'Geri Bildirimi Gönder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}