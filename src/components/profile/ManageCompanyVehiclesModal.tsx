
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { CompanyUserProfile, VehicleTypeSetting } from '@/types';
import { updateUserProfile } from '@/services/authService';
import { Loader2, Truck } from 'lucide-react';

interface ManageCompanyVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyUser: CompanyUserProfile;
  availableVehicleTypes: VehicleTypeSetting[];
  onProfileUpdate: () => void;
}

export default function ManageCompanyVehiclesModal({ isOpen, onClose, companyUser, availableVehicleTypes, onProfileUpdate }: ManageCompanyVehiclesModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedVehicles(companyUser.ownedVehicles || []);
    }
  }, [companyUser.ownedVehicles, isOpen]);

  const handleVehicleToggle = (vehicleName: string) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleName)
        ? prev.filter(v => v !== vehicleName)
        : [...prev, vehicleName]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updateData: Partial<CompanyUserProfile> = {
      ownedVehicles: selectedVehicles,
    };

    try {
      const success = await updateUserProfile(companyUser.id, updateData);
      if (success) {
        toast({ title: "Başarılı", description: "Araç listeniz güncellendi." });
        onProfileUpdate();
        onClose();
      } else {
        throw new Error("Araç listesi güncellenemedi.");
      }
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Araç listesi güncellenirken bir sorun oluştu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const activeVehicleTypes = availableVehicleTypes.filter(vt => vt.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Truck size={22}/> Araçlarınızı Yönetin</DialogTitle>
          <DialogDescription>
            Firmanızın sahip olduğu veya kullandığı araç türlerini seçin. Bu araçlar ilanlarınızda ve profilinizde görünebilir.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
            <ScrollArea className="flex-grow pr-6 -mr-6 mb-4">
                <div className="space-y-3 py-1">
                {activeVehicleTypes.length > 0 ? activeVehicleTypes.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                        id={`vehicle-${vehicle.id}`}
                        checked={selectedVehicles.includes(vehicle.name)}
                        onCheckedChange={() => handleVehicleToggle(vehicle.name)}
                    />
                    <Label htmlFor={`vehicle-${vehicle.id}`} className="font-normal cursor-pointer flex-grow">
                        {vehicle.name}
                        {vehicle.description && <p className="text-xs text-muted-foreground">{vehicle.description}</p>}
                    </Label>
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Sistemde kayıtlı aktif araç tipi bulunmamaktadır.</p>
                )}
                </div>
            </ScrollArea>
            <DialogFooter className="mt-auto pt-4 border-t">
                <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>İptal</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting || activeVehicleTypes.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
