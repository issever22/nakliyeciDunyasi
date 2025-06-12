
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, IndividualUserProfile, CompanyUserProfile } from '@/types';
import { updateUserProfile } from '@/services/authService';
import { Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdate }: EditProfileModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email); // Email is typically not editable here

  // Company specific fields
  const [companyTitle, setCompanyTitle] = useState(user.role === 'company' ? (user as CompanyUserProfile).companyTitle : '');
  const [contactFullName, setContactFullName] = useState(user.role === 'company' ? (user as CompanyUserProfile).contactFullName : '');
  const [workPhone, setWorkPhone] = useState(user.role === 'company' ? (user as CompanyUserProfile).workPhone || '' : '');
  const [mobilePhone, setMobilePhone] = useState(user.role === 'company' ? (user as CompanyUserProfile).mobilePhone || '' : '');
  const [fax, setFax] = useState(user.role === 'company' ? (user as CompanyUserProfile).fax || '' : '');
  const [website, setWebsite] = useState(user.role === 'company' ? (user as CompanyUserProfile).website || '' : '');
  const [logoUrl, setLogoUrl] = useState(user.role === 'company' ? (user as CompanyUserProfile).logoUrl || '' : '');


  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    if (user.role === 'company') {
      const companyUser = user as CompanyUserProfile;
      setCompanyTitle(companyUser.companyTitle);
      setContactFullName(companyUser.contactFullName);
      setWorkPhone(companyUser.workPhone || '');
      setMobilePhone(companyUser.mobilePhone || '');
      setFax(companyUser.fax || '');
      setWebsite(companyUser.website || '');
      setLogoUrl(companyUser.logoUrl || '');
    }
  }, [user, isOpen]); // Re-populate form when modal opens or user changes

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    let updateData: Partial<UserProfile> = {
      name: name, // For individual, this is name; for company, it's the display name (companyTitle)
    };

    if (user.role === 'company') {
      updateData = {
        ...updateData,
        name: companyTitle, // companyTitle becomes the 'name' for display
        companyTitle: companyTitle,
        contactFullName: contactFullName,
        workPhone: workPhone || undefined,
        mobilePhone: mobilePhone,
        fax: fax || undefined,
        website: website || undefined,
        logoUrl: logoUrl || undefined,
      };
    } else {
        // Individual user specific updates if any
    }
    
    if (!name && user.role === 'individual') {
        toast({title: "Hata", description: "Ad Soyad boş bırakılamaz.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }
    if (user.role === 'company' && (!companyTitle || !contactFullName || !mobilePhone)) {
         toast({title: "Hata", description: "Firma Adı, Yetkili Adı ve Cep Telefonu zorunludur.", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }


    try {
      const success = await updateUserProfile(user.id, updateData);
      if (success) {
        toast({ title: "Başarılı", description: "Profil bilgileri güncellendi." });
        onProfileUpdate({ ...user, ...updateData } as UserProfile); // Notify parent
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
            <DialogTitle>Temel Profil Bilgilerini Düzenle</DialogTitle>
            <DialogDescription>
              {user.role === 'individual' ? "Kişisel bilgilerinizi güncelleyin." : "Firma temel iletişim ve görünen bilgilerini güncelleyin."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            {user.role === 'individual' && (
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Ad Soyad (*)</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            {user.role === 'company' && (
              <>
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
              </>
            )}
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
