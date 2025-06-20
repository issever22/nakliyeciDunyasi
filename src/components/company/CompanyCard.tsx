
"use client";

import type { CompanyUserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CompanyCardProps {
  company: CompanyUserProfile;
  isSponsor?: boolean;
}

export default function CompanyCard({ company, isSponsor = false }: CompanyCardProps) {
  return (
    <Card className={cn(
      "shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card text-card-foreground relative",
      isSponsor && "border-yellow-400/50 ring-2 ring-yellow-400/80 shadow-yellow-500/10"
    )}>
      <CardHeader className="items-center text-center p-4 border-b relative">
        {isSponsor && (
          <Badge variant="default" className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90 shadow-lg px-2 py-0.5 text-xs z-10">
            <Star className="h-3 w-3 mr-1" /> SPONSOR
          </Badge>
        )}
        <Avatar className="w-24 h-24 mb-3 mt-2 border-2 border-muted shadow-md rounded-md">
          {company.logoUrl ? (
            <AvatarImage src={company.logoUrl} alt={`${company.name} logo`} data-ai-hint="company logo" className="object-contain" />
          ) : null}
          <AvatarFallback className="text-3xl bg-primary/10 text-primary rounded-md">
            {company.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg font-semibold text-primary">{company.name}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{company.category}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-2 text-sm flex-grow">
        {company.companyDescription && (
          <p className="text-muted-foreground line-clamp-3 text-xs mb-3 leading-relaxed">
            {company.companyDescription}
          </p>
        )}
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <MapPin size={14} className="shrink-0" /> <span>{company.addressCity}{company.addressDistrict ? `, ${company.addressDistrict}` : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Building size={14} className="shrink-0" /> <span>{company.companyType === 'local' ? 'Yerel Firma' : 'Yabancı Firma'}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto">
        <Button variant="outline" className="w-full text-xs" asChild>
          <Link href={`/uyelerimiz/firma/${company.id}`}>Profili Görüntüle</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
