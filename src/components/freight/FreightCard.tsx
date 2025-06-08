
import type { Freight } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, CalendarDays, Info, User, Globe, PackageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface FreightCardProps {
  freight: Freight;
}

export default function FreightCard({ freight }: FreightCardProps) {
  const timeAgo = formatDistanceToNow(new Date(freight.postedAt), { addSuffix: true, locale: tr });
  const loadingDate = format(new Date(freight.postedAt), 'dd.MM.yyyy', { locale: tr });

  const ScopeIcon = freight.shipmentScope === 'Yurt Dışı' ? Globe : PackageIcon;

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl text-primary flex items-center gap-2">
            <MapPin size={20} /> 
            <span className="truncate">{freight.origin} &rarr; {freight.destination}</span>
          </CardTitle>
          <Badge variant="secondary" className="whitespace-nowrap flex-shrink-0">{timeAgo}</Badge>
        </div>
        <CardDescription className="text-sm mt-1 pt-1 flex items-center">
            <User size={16} className="mr-2 text-muted-foreground" />
            İlan Veren: {freight.postedBy}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3 flex-grow">
        <div className="flex items-start gap-2 text-sm">
          <ScopeIcon size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Gönderi Kapsamı:</span>
            <p>{freight.shipmentScope}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <Truck size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Araç Tipi:</span>
            <p>{freight.vehicleType}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <CalendarDays size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Yükleme Tarihi:</span>
            <p>{loadingDate}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <Info size={18} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Detaylar:</span>
            <p className="line-clamp-3">{freight.details}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30 mt-auto">
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Detayları Gör ve Teklif Ver
        </Button>
      </CardFooter>
    </Card>
  );
}
