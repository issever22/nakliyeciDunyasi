
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { CompanyUserProfile, AuthDocSetting } from '@/types';
import { updateUserProfile } from '@/services/authService';
import { Loader2, FileText as FileTextIcon } from 'lucide-react';

interface ManageCompanyAuthDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyUser: CompanyUserProfile;
  availableAuthDocTypes: AuthDocSetting[];
  onProfileUpdate: () => void;
}

export default function ManageCompanyAuthDocsModal({ isOpen, onClose, companyUser, availableAuthDocTypes, onProfileUpdate }: ManageCompanyAuthDocsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedDocs(companyUser.authDocuments || []);
    }
  }, [companyUser.authDocuments, isOpen]);

  const handleDocToggle = (docName: string) => {
    setSelectedDocs(prev =>
      prev.includes(docName)
        ? prev.filter(d => d !== docName)
        : [...prev, docName]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updateData: Partial<CompanyUserProfile> = {
      authDocuments: selectedDocs,
    };

    try {
      const success = await updateUserProfile(companyUser.id, updateData);
      if (success) {
        toast({ title: "Başarılı", description: "Yetki belgeleriniz güncellendi." });
        onProfileUpdate();
        onClose();
      } else {
        throw new Error("Yetki belgeleri güncellenemedi.");
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Yetki belgeleri güncellenirken bir sorun oluştu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const activeAuthDocTypes = availableAuthDocTypes.filter(doc => doc.isActive && (doc.requiredFor === 'Firma' || doc.requiredFor === 'Her İkisi de'));


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileTextIcon size={22}/> Yetki Belgelerinizi Yönetin</DialogTitle>
          <DialogDescription>
            Sahip olduğunuz yetki belgelerini seçin. Bu bilgiler profilinizde ve potansiyel müşteriler için önemli olabilir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
            <ScrollArea className="flex-grow pr-6 -mr-6 mb-4">
                <div className="space-y-3 py-1">
                {activeAuthDocTypes.length > 0 ? activeAuthDocTypes.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                        id={`doc-${doc.id}`}
                        checked={selectedDocs.includes(doc.name)}
                        onCheckedChange={() => handleDocToggle(doc.name)}
                    />
                    <Label htmlFor={`doc-${doc.id}`} className="font-normal cursor-pointer flex-grow">
                        {doc.name}
                        {doc.details && <p className="text-xs text-muted-foreground">{doc.details}</p>}
                    </Label>
                    </div>
                )) : (
                     <p className="text-sm text-muted-foreground text-center py-4">Sistemde firmanız için seçilebilecek aktif yetki belgesi bulunmamaktadır.</p>
                )}
                </div>
            </ScrollArea>
            <DialogFooter className="mt-auto pt-4 border-t">
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>İptal</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting || activeAuthDocTypes.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
