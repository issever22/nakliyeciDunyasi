import type { Freight } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, CalendarDays, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale'; // For Turkish relative time

interface FreightCardProps {
  freight: Freight;
}

export default function FreightCard({ freight }: FreightCardProps) {
  const timeAgo = formatDistanceToNow(new Date(freight.postedAt), { addSuffix: true, locale: tr });

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-primary flex items-center gap-2">
              <MapPin size={20} /> {freight.origin} &rarr; {freight.destination}
            </CardTitle>
            <CardDescription className="text-sm mt-1">İlan Veren: {freight.postedBy}</CardDescription>
          </div>
          <Badge variant="secondary" className="whitespace-nowrap">{timeAgo}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Truck size={18} className="text-muted-foreground" />
          <span className="font-medium">Araç Tipi:</span>
          <span>{freight.vehicleType}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Info size={18} className="text-muted-foreground" />
          <span className="font-medium">Detaylar:</span>
          <span className="truncate">{freight.details}</span>
        </div>
        {/* Example of future fields:
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays size={18} className="text-muted-foreground" />
          <span className="font-medium">Yükleme Tarihi:</span>
          <span>{new Date(freight.postedAt).toLocaleDateString('tr-TR')}</span>
        </div>
        */}
      </CardContent>
      <CardFooter className="p-4 bg-muted/30">
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Detayları Gör ve Teklif Ver
        </Button>
      </CardFooter>
    </Card>
  );
}
