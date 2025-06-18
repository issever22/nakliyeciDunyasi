
"use client";

import type { CompanyUserProfile } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Building } from 'lucide-react';
import Link from 'next/link';
// import Image from 'next/image'; // Not used here currently

interface CompanyCardProps {
  company: CompanyUserProfile;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full bg-card text-card-foreground">
      <CardHeader className="items-center text-center p-4 border-b">
        <Avatar className="w-24 h-24 mb-3 border-2 border-muted shadow-md">
          {company.logoUrl ? (
            <AvatarImage src={company.logoUrl} alt={`${company.name} logo`} data-ai-hint="company logo" />
          ) : null}
          <AvatarFallback className="text-3xl bg-primary/10 text-primary">
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
          {/* Placeholder for future company profile page */}
          <Link href={`#`}>Firma Detaylarını Gör (Yakında)</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
