
import type { Freight } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, CalendarDays, Info, User, Globe, PackageIcon, Repeat, Layers, Weight, PackagePlus, Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COUNTRIES } from '@/lib/locationData';

interface FreightCardProps {
  freight: Freight;
}

export default function FreightCard({ freight }: FreightCardProps) {
  const timeAgo = formatDistanceToNow(parseISO(freight.postedAt), { addSuffix: true, locale: tr });
  
  let formattedLoadingDate = "Belirtilmemiş";
  try {
    // Ensure freight.loadingDate is a valid date string (YYYY-MM-DD) before parsing
    if (freight.loadingDate && typeof freight.loadingDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(freight.loadingDate)) {
      formattedLoadingDate = format(parseISO(freight.loadingDate), 'dd.MM.yyyy', { locale: tr });
    } else if (freight.loadingDate instanceof Date) { // Handle if it's already a Date object (less likely with current setup)
       formattedLoadingDate = format(freight.loadingDate, 'dd.MM.yyyy', { locale: tr });
    }
  } catch (e) {
    console.warn("Invalid loading date for freight card:", freight.loadingDate, e);
  }

  const ScopeIcon = freight.shipmentScope === 'Yurt Dışı' ? Globe : PackageIcon;

  const getCountryName = (code: string) => COUNTRIES.find(c => c.code === code)?.name || code;

  const originDisplay = `${getCountryName(freight.originCountry as string)}${freight.originCity ? `, ${freight.originCity}` : ''}${freight.originDistrict ? `, ${freight.originDistrict}` : ''}`;
  const destinationDisplay = `${getCountryName(freight.destinationCountry as string)}${freight.destinationCity ? `, ${freight.destinationCity}` : ''}${freight.destinationDistrict ? `, ${freight.destinationDistrict}` : ''}`;


  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg text-primary flex items-start gap-2">
            <MapPin size={20} className="mt-1 flex-shrink-0 text-primary" /> 
            <span className="leading-tight">{originDisplay} <br className="hidden sm:inline"/>&rarr; {destinationDisplay}</span>
          </CardTitle>
          <Badge variant="secondary" className="whitespace-nowrap flex-shrink-0 text-xs">{timeAgo}</Badge>
        </div>
        <CardDescription className="text-sm mt-1 pt-1 flex items-center">
            <User size={16} className="mr-2 text-muted-foreground" />
            İlan Veren: {freight.companyName || freight.postedBy}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2 flex-grow">
        <div className="flex items-center gap-2 text-sm">
          <ScopeIcon size={16} className="text-muted-foreground flex-shrink-0" />
          <p><span className="font-medium">Kapsam:</span> {freight.shipmentScope} {freight.isContinuousLoad && <Badge variant="outline" className="ml-1 bg-green-100 text-green-700 border-green-300 text-xs py-0.5 px-1.5"><Repeat size={12} className="inline mr-1"/>Sürekli</Badge>}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Layers size={16} className="text-muted-foreground flex-shrink-0" />
          <p><span className="font-medium">Yük Cinsi:</span> {freight.cargoType}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Truck size={16} className="text-muted-foreground flex-shrink-0" />
          <p><span className="font-medium">Araç:</span> {freight.vehicleNeeded}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <PackagePlus size={16} className="text-muted-foreground flex-shrink-0" />
          <p><span className="font-medium">Yükleniş:</span> {freight.loadingType}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Boxes size={16} className="text-muted-foreground flex-shrink-0" />
          <p><span className="font-medium">Biçim:</span> {freight.cargoForm}</p>
        </div>
         <div className="flex items-center gap-2 text-sm">
          <Weight size={16} className="text-muted-foreground flex-shrink-0" />
          <p><span className="font-medium">Tonaj:</span> {freight.cargoWeight} {freight.cargoWeightUnit}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays size={16} className="text-muted-foreground flex-shrink-0" />
          <p><span className="font-medium">Yükleme:</span> {formattedLoadingDate}</p>
        </div>
        <div className="flex items-start gap-2 text-sm pt-1.5">
          <Info size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Açıklama:</span>
            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{freight.description}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/30 mt-auto border-t">
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Detayları Gör ve Teklif Ver
        </Button>
      </CardFooter>
    </Card>
  );
}
