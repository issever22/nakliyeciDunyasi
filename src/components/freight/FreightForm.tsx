"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VEHICLE_TYPES } from '@/lib/constants';
import type { VehicleType, Freight } from '@/types'; // Ensure Freight is imported if used for typing submission data
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Send, MapPin, Truck as VehicleIcon, Info } from 'lucide-react';

interface FreightFormProps {
  onSubmitSuccess?: (newFreight: Freight) => void; // Callback for successful submission
}

export default function FreightForm({ onSubmitSuccess }: FreightFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
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

    setIsLoading(true);

    // Mock submission
    const newFreight: Freight = {
      id: String(Date.now()),
      origin,
      destination,
      vehicleType: vehicleType as VehicleType, // Ensure vehicleType is not empty
      details,
      postedAt: new Date().toISOString(),
      postedBy: user.name,
      userId: user.id,
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Yeni İlan:", newFreight);
    toast({
      title: "İlan Başarıyla Oluşturuldu!",
      description: `${origin} - ${destination} arası ilanınız yayında.`,
    });

    // Reset form
    setOrigin('');
    setDestination('');
    setVehicleType('');
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
