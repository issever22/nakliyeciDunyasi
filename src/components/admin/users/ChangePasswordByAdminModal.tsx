"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from 'lucide-react';
import type { CompanyUserProfile } from '@/types';
import { changeUserPasswordByAdmin } from '@/services/authService';

interface ChangePasswordByAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CompanyUserProfile | null;
  onUpdate: () => void;
}

export default function ChangePasswordByAdminModal({ isOpen, onClose, user, onUpdate }: ChangePasswordByAdminModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNewPassword('');
      setConfirmNewPassword('');
    }
  }, [isOpen]);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Hata", description: "Yeni şifreler eşleşmiyor.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await changeUserPasswordByAdmin(user.id, newPassword);
      if (result.success) {
        toast({ title: "Başarılı", description: result.message });
        onUpdate();
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: "Şifre Değiştirme Hatası", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>"{user.name}" için Şifre Değiştir</DialogTitle>
            <DialogDescription>
              Bu işlem, kullanıcının veritabanındaki şifre kaydını günceller.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-1.5">
              <Label htmlFor="admin-new-password">Yeni Şifre (*)</Label>
              <div className="relative">
                <Input
                  id="admin-new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-confirm-new-password">Yeni Şifre (Tekrar) (*)</Label>
              <div className="relative">
                <Input
                  id="admin-confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>İptal</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Şifreyi Değiştir
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
