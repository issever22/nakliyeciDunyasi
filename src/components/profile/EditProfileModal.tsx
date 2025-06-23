
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, CompanyUserProfile } from '@/types'; // UserProfile is now CompanyUserProfile
import { updateUserProfile } from '@/services/authService';
import { Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CompanyUserProfile; // Now always CompanyUserProfile
  onProfileUpdate: () => void; 
}

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdate }: EditProfileModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - directly using CompanyUserProfile fields
  const [companyTitle, setCompanyTitle] = useState(user.companyTitle);
  const [email, setEmail] = useState(user.email); 
  const [contactFullName, setContactFullName] = useState(user.contactFullName);
  const [workPhone, setWorkPhone] = useState(user.workPhone || '');
  const [mobilePhone, setMobilePhone] = useState(user.mobilePhone || '');
  const [fax, setFax] = useState(user.fax || '');
  const [website, setWebsite] = useState(user.website || '');
  const [logoUrl, setLogoUrl] = useState(user.logoUrl || '');


  useEffect(() => {
    // user is always CompanyUserProfile here
    setCompanyTitle(user.companyTitle);
    setEmail(user.email);
    setContactFullName(user.contactFullName);
    setWorkPhone(user.workPhone || '');
    setMobilePhone(user.mobilePhone || '');
    setFax(user.fax || '');
    setWebsite(user.website || '');
    setLogoUrl(user.logoUrl || '');
  }, [user, isOpen]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!companyTitle || !contactFullName || !mobilePhone) {
         toast({title: "Hata", description: "Firma Adı, Yetkili Adı ve Cep Telefonu zorunludur.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }

    // Construct updateData specifically for CompanyUserProfile fields
    const updateData: Partial<CompanyUserProfile> = {
      name: companyTitle, // 'name' in DB is the display name, which is companyTitle
      companyTitle: companyTitle,
      contactFullName: contactFullName,
      workPhone: workPhone || undefined,
      mobilePhone: mobilePhone,
      fax: fax || undefined,
      website: website || undefined,
      logoUrl: logoUrl || undefined,
    };

    try {
      const success = await updateUserProfile(user.id, updateData);
      if (success) {
        toast({ title: "Başarılı", description: "Firma temel bilgileri güncellendi." });
        onProfileUpdate(); 
        onClose();
      } else {
        throw new Error("Profil güncellenemedi.");
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Profil güncellenirken bir sorun oluştu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Firma Temel Bilgilerini Düzenle</DialogTitle>
            <DialogDescription>
              Firma temel iletişim ve görünen bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-1.5">
                <Label htmlFor="edit-logoUrl">Logo URL</Label>
                <Input id="edit-logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://firma.com/logo.png"/>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="edit-companyTitle">Firma Adı (Görünen Ad) (*)</Label>
                <Input id="edit-companyTitle" value={companyTitle} onChange={(e) => setCompanyTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="edit-contactFullName">Yetkili Adı Soyadı (*)</Label>
                <Input id="edit-contactFullName" value={contactFullName} onChange={(e) => setContactFullName(e.target.value)} required />
            </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="edit-workPhone">İş Telefonu</Label>
                    <Input id="edit-workPhone" value={workPhone} onChange={(e) => setWorkPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="edit-mobilePhone">Cep Telefonu (*)</Label>
                    <Input id="edit-mobilePhone" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="edit-fax">Fax</Label>
                    <Input id="edit-fax" value={fax} onChange={(e) => setFax(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="edit-website">Web Sitesi</Label>
                    <Input id="edit-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="www.firma.com"/>
                </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">E-posta (Değiştirilemez)</Label>
              <Input id="edit-email" value={email} disabled />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>İptal</Button></DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
