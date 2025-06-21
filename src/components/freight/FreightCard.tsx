
import type { Freight, CommercialFreight, ResidentialFreight, EmptyVehicleListing } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, CalendarDays, Info, User, Globe, Package as PackageIcon, Repeat, Layers, Weight, PackagePlus, Boxes, Home, Building, ArrowUpDown, ChevronsUpDown, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COUNTRIES } from '@/lib/locationData';
import Link from 'next/link';

interface FreightCardProps {
  freight: Freight;
}

export default function FreightCard({ freight }: FreightCardProps) {
  let timeAgo = 'bilinmiyor';
  if (freight.postedAt && isValid(parseISO(freight.postedAt))) {
    timeAgo = formatDistanceToNow(parseISO(freight.postedAt), { addSuffix: true, locale: tr });
  }
  
  let formattedLoadingDate = "Belirtilmemiş";
  if (freight.loadingDate && isValid(parseISO(freight.loadingDate))) {
      formattedLoadingDate = format(parseISO(freight.loadingDate), 'dd MMMM yyyy', { locale: tr });
  }

  const getCountryName = (code: string) => COUNTRIES.find(c => c.code === code)?.name || code;

  const originDisplay = `${getCountryName(freight.originCountry)}${freight.originCity ? `, ${freight.originCity}` : ''}${freight.originDistrict ? `, ${freight.originDistrict}` : ''}`;
  const destinationDisplay = `${getCountryName(freight.destinationCountry)}${freight.destinationCity ? `, ${freight.destinationCity}` : ''}${freight.destinationDistrict ? `, ${freight.destinationDistrict}` : ''}`;

  const FreightTypeIcon = freight.freightType === 'Evden Eve' ? Home : (freight.freightType === 'Boş Araç' ? PackagePlus : Truck);

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card text-card-foreground">
      <CardHeader className="bg-muted/20 p-4 border-b">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-semibold text-primary flex items-start gap-2">
            <MapPin size={20} className="mt-1 flex-shrink-0 text-primary" /> 
            <span className="leading-tight">{originDisplay} <br className="hidden sm:inline"/>&rarr; {destinationDisplay}</span>
          </CardTitle>
           <Badge variant={freight.freightType === 'Evden Eve' ? "secondary" : (freight.freightType === 'Yük' ? "default" : "outline")} className="whitespace-nowrap flex-shrink-0 text-xs py-1 px-2 flex items-center gap-1">
            <FreightTypeIcon size={14} /> {freight.freightType}
          </Badge>
        </div>
        <CardDescription className="text-xs mt-1 pt-1 flex items-center justify-between text-muted-foreground">
            <span className="flex items-center">
                <User size={14} className="mr-1.5" />
                {freight.companyName || freight.postedBy}
            </span>
            <span>{timeAgo}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm flex-grow">
        {freight.freightType === 'Yük' && (
          <>
            {(freight as CommercialFreight).shipmentScope && 
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Kapsam:</span> {(freight as CommercialFreight).shipmentScope} {(freight as CommercialFreight).isContinuousLoad && <Badge variant="outline" className="ml-1 bg-green-100 text-green-700 border-green-300 text-xs py-0.5 px-1.5"><Repeat size={12} className="inline mr-1"/>Sürekli</Badge>}</p>
              </div>
            }
            {(freight as CommercialFreight).cargoType && 
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Yük Cinsi:</span> {(freight as CommercialFreight).cargoType}</p>
              </div>
            }
            {(freight as CommercialFreight).vehicleNeeded &&
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Araç:</span> {(freight as CommercialFreight).vehicleNeeded}</p>
              </div>
            }
            {(freight as CommercialFreight).loadingType &&
              <div className="flex items-center gap-2">
                <PackagePlus size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Yükleniş:</span> {(freight as CommercialFreight).loadingType}</p>
              </div>
            }
            {(freight as CommercialFreight).cargoForm && 
              <div className="flex items-center gap-2">
                <Boxes size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Biçim:</span> {(freight as CommercialFreight).cargoForm}</p>
              </div>
            }
            {(freight as CommercialFreight).cargoWeight !== undefined &&
              <div className="flex items-center gap-2">
                <Weight size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Tonaj:</span> {(freight as CommercialFreight).cargoWeight} {(freight as CommercialFreight).cargoWeightUnit}</p>
              </div>
            }
          </>
        )}

        {freight.freightType === 'Evden Eve' && (
          <>
            {(freight as ResidentialFreight).residentialTransportType &&
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Taşıma Türü:</span> {(freight as ResidentialFreight).residentialTransportType}</p>
              </div>
            }
            {(freight as ResidentialFreight).residentialPlaceType &&
              <div className="flex items-center gap-2">
                <PackageIcon size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Nakliye Yeri:</span> {(freight as ResidentialFreight).residentialPlaceType}</p>
              </div>
            }
            {(freight as ResidentialFreight).residentialElevatorStatus &&
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} className="text-muted-foreground flex-shrink-0" /> {/* Changed icon */}
                <p><span className="font-medium">Asansör:</span> {(freight as ResidentialFreight).residentialElevatorStatus}</p>
              </div>
            }
            {(freight as ResidentialFreight).residentialFloorLevel &&
              <div className="flex items-center gap-2">
                <Building size={16} className="text-muted-foreground flex-shrink-0" />
                <p><span className="font-medium">Kat:</span> {(freight as ResidentialFreight).residentialFloorLevel}</p>
              </div>
            }
          </>
        )}
        
        {freight.freightType === 'Boş Araç' && (
          <>
            {(listing as EmptyVehicleListing).advertisedVehicleType && <p><strong className="text-muted-foreground">Araç Tipi:</strong> {(listing as EmptyVehicleListing).advertisedVehicleType}</p>}
            {(listing as EmptyVehicleListing).serviceTypeForLoad && <p><strong className="text-muted-foreground">Hizmet Tipi:</strong> {(listing as EmptyVehicleListing).serviceTypeForLoad}</p>}
            {(listing as EmptyVehicleListing).vehicleStatedCapacity !== undefined && <p><strong className="text-muted-foreground">Kapasite:</strong> {(listing as EmptyVehicleListing).vehicleStatedCapacity} {(listing as EmptyVehicleListing).vehicleStatedCapacityUnit}</p>}
          </>
        )}

        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-muted-foreground flex-shrink-0" />
          <p><span className="font-medium">Yükleme/Taşıma Tarihi:</span> {formattedLoadingDate}</p>
        </div>
        <div className="flex items-start gap-2 pt-1.5">
          <Info size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">Açıklama:</span>
            <p className="line-clamp-2 text-xs text-muted-foreground/80 leading-relaxed">{freight.description}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-muted/20 mt-auto border-t">
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <Link href={`/ilan/${freight.id}`}>Detayları Gör</Link> 
        </Button>
      </CardFooter>
    </Card>
  );
}
