
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import type { MembershipSetting, CompanyUserProfile } from '@/types';
import { CheckCircle, Star, Loader2, Send } from 'lucide-react';
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { addMembershipRequest } from '@/services/membershipRequestsService';

interface ViewMembershipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMemberships: MembershipSetting[];
  companyUser: CompanyUserProfile;
}

export default function ViewMembershipsModal({ isOpen, onClose, availableMemberships, companyUser }: ViewMembershipsModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUserMembership = companyUser.membershipStatus;

  const handlePackageRequest = async (pkg: MembershipSetting) => {
    setIsSubmitting(true);
    try {
      const result = await addMembershipRequest({
        name: companyUser.contactFullName || companyUser.name,
        phone: companyUser.mobilePhone || 'Belirtilmedi',
        details: `"${companyUser.name}" firması "${pkg.name}" üyelik paketine geçiş yapmak için talepte bulundu.`,
        email: companyUser.email,
        companyName: companyUser.companyTitle || companyUser.name,
        userId: companyUser.id
      });
      if (result.success) {
        toast({
          title: "Talep Gönderildi",
          description: `"${pkg.name}" üyeliği için talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.`
        });
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Talep gönderilirken bir sorun oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl flex items-center gap-2"><Star size={24} className="text-primary"/> Üyelik Paketleri</DialogTitle>
          <DialogDescription>
            Firmanız için sunulan üyelik paketlerini inceleyebilir ve avantajlarından faydalanabilirsiniz.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow overflow-y-auto p-6">
          {availableMemberships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableMemberships.map((pkg) => (
                <Card key={pkg.id} className={`flex flex-col shadow-lg transition-all hover:shadow-xl ${currentUserMembership === pkg.name ? 'border-primary ring-2 ring-primary' : 'border-border'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-center mb-2">
                        <CardTitle className="text-xl text-primary">{pkg.name}</CardTitle>
                        {currentUserMembership === pkg.name && <Badge className="bg-green-500 text-white">Aktif Paket</Badge>}
                    </div>
                    <CardDescription className="text-sm min-h-[3em]">{pkg.description || "Bu paket için açıklama bulunmamaktadır."}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <div className="text-2xl font-bold text-foreground">
                      {pkg.duration} {pkg.durationUnit}
                    </div>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0"/> 
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="mt-auto pt-4">
                    <Button 
                      className="w-full" 
                      disabled={isSubmitting || currentUserMembership === pkg.name}
                      onClick={() => handlePackageRequest(pkg)}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                      ) : (
                        currentUserMembership === pkg.name ? 'Mevcut Paketiniz' : <><Send className="mr-2 h-4 w-4"/> Yükseltme Talebi Gönder</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">Şu anda aktif üyelik paketi bulunmamaktadır.</p>
          )}
        </ScrollArea>
        
        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild><Button variant="outline">Kapat</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
