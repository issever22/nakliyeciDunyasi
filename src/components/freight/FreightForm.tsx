
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VEHICLE_TYPES, SHIPMENT_SCOPES } from '@/lib/constants';
import type { VehicleType, ShipmentScope, Freight } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Send, MapPin, Truck as VehicleIcon, Info, Globe, PackageIcon } from 'lucide-react';

interface FreightFormProps {
  onSubmitSuccess?: (newFreight: Freight) => void;
}

export default function FreightForm({ onSubmitSuccess }: FreightFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [shipmentScope, setShipmentScope] = useState<ShipmentScope | ''>('');
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Hata", description: "İlan vermek için giriş yapmalısınız.", variant: "destructive" });
      return;
    }
    if (!vehicleType) {
      toast({ title: "Hata", description: "Lütfen araç tipini seçin.", variant: "destructive" });
      return;
    }
    if (!shipmentScope) {
      toast({ title: "Hata", description: "Lütfen gönderi kapsamını seçin.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const newFreight: Freight = {
      id: String(Date.now()),
      origin,
      destination,
      vehicleType: vehicleType as VehicleType,
      shipmentScope: shipmentScope as ShipmentScope,
      details,
      postedAt: new Date().toISOString(),
      postedBy: user.name,
      userId: user.id,
    };

    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Yeni İlan:", newFreight);
    toast({
      title: "İlan Başarıyla Oluşturuldu!",
      description: `${origin} - ${destination} arası ilanınız yayında.`,
    });

    setOrigin('');
    setDestination('');
    setVehicleType('');
    setShipmentScope('');
    setDetails('');
    setIsLoading(false);

    if (onSubmitSuccess) {
      onSubmitSuccess(newFreight);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-card border rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="origin">Nereden (Kalkış Yeri)</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="origin" placeholder="Örn: İstanbul, Esenyurt" value={origin} onChange={(e) => setOrigin(e.target.value)} required className="pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="destination">Nereye (Varış Yeri)</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input id="destination" placeholder="Örn: Ankara, Çankaya" value={destination} onChange={(e) => setDestination(e.target.value)} required className="pl-10" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Gönderi Kapsamı</Label>
        <RadioGroup
          value={shipmentScope}
          onValueChange={(value) => setShipmentScope(value as ShipmentScope)}
          className="flex gap-4 pt-1"
        >
          {SHIPMENT_SCOPES.map((scope) => (
            <div key={scope} className="flex items-center space-x-2">
              <RadioGroupItem value={scope} id={`scope-${scope}`} />
              <Label htmlFor={`scope-${scope}`} className="font-normal">
                {scope === 'Yurt İçi' ? <PackageIcon className="inline h-4 w-4 mr-1" /> : <Globe className="inline h-4 w-4 mr-1" />}
                {scope}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleType">Araç Tipi</Label>
        <div className="relative">
          <VehicleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Select value={vehicleType} onValueChange={(value) => setVehicleType(value as VehicleType | '')} required>
            <SelectTrigger id="vehicleType" className="pl-10">
              <SelectValue placeholder="Araç tipi seçin..." />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="details">Yük Detayları ve Açıklama</Label>
        <div className="relative">
          <Info className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
          <Textarea 
            id="details" 
            placeholder="Yükün cinsi, ağırlığı, hacmi, yükleme/boşaltma saatleri gibi bilgileri giriniz." 
            value={details} 
            onChange={(e) => setDetails(e.target.value)} 
            required 
            rows={4}
            className="pl-10 pt-3"
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3" disabled={isLoading}>
        {isLoading ? 'İlan Yayınlanıyor...' : <><Send size={20} className="mr-2" /> İlanı Yayınla</>}
      </Button>
    </form>
  );
}
