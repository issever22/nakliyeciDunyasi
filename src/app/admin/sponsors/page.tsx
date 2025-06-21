
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { CompanyUserProfile, SponsorshipLocation } from '@/types';
import { getSponsoredCompanies, updateSponsorshipsForUser } from '@/services/authService';
import { COUNTRIES, TURKISH_CITIES } from '@/lib/locationData';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Edit, Trash2, Globe, MapPin, PlusCircle, AlertTriangle } from 'lucide-react';
import EditSponsorshipsModal from '@/components/admin/sponsors/EditSponsorshipsModal';
import Link from 'next/link';

export default function SponsorsListPage() {
  const { toast } = useToast();
  const [sponsoredCompanies, setSponsoredCompanies] = useState<CompanyUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyUserProfile | null>(null);

  const fetchSponsors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const companies = await getSponsoredCompanies();
      setSponsoredCompanies(companies);
    } catch (err: any) {
      setError("Sponsorlu firmalar yüklenirken bir hata oluştu.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const handleEditClick = (company: CompanyUserProfile) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  const handleRemoveSponsorship = async (company: CompanyUserProfile) => {
    const result = await updateSponsorshipsForUser(company.id, []);
    if (result.success) {
      toast({ title: "Başarılı", description: `${company.name} firmasının tüm sponsorlukları kaldırıldı.` });
      fetchSponsors(); // Refresh the list
    } else {
      toast({ title: "Hata", description: result.message, variant: "destructive" });
    }
  };

  const handleModalUpdate = () => {
    fetchSponsors(); // Refresh list after modal update
  };
  
  const getCountryName = (code: string) => COUNTRIES.find(c => c.code === code)?.name || code;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
     return (
        <div className="text-center py-10 bg-destructive/10 border border-destructive rounded-lg">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-destructive-foreground mb-2">Sponsorlar Yüklenemedi</h3>
            <p className="text-sm text-destructive-foreground/80 px-4">{error}</p>
            <Button onClick={fetchSponsors} variant="destructive" className="mt-4">Tekrar Dene</Button>
        </div>
      );
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Sponsor Firma Listesi</CardTitle>
            <CardDescription>Aktif sponsorlukları olan firmaları yönetin.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/admin/sponsors/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Sponsor Ekle
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Firma Adı</TableHead>
                  <TableHead>Sponsorluklar</TableHead>
                  <TableHead className="w-[120px] text-right">Eylemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sponsoredCompanies.length > 0 ? sponsoredCompanies.map((company) => {
                  const sponsoredCountries = company.sponsorships?.filter(s => s.type === 'country') || [];
                  const sponsoredCities = company.sponsorships?.filter(s => s.type === 'city') || [];
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                           {sponsoredCountries.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Globe size={16} className="text-muted-foreground" />
                                <div className="flex flex-wrap gap-1">
                                    {sponsoredCountries.map(s => <Badge key={s.name} variant="secondary">{getCountryName(s.name)}</Badge>)}
                                </div>
                            </div>
                           )}
                           {sponsoredCities.length > 0 && (
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-muted-foreground" />
                                 <div className="flex flex-wrap gap-1">
                                    {sponsoredCities.map(s => <Badge key={s.name} variant="outline">{s.name}</Badge>)}
                                </div>
                            </div>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(company)} title="Sponsorlukları Düzenle">
                                <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Tüm Sponsorlukları Kaldır" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    "{company.name}" firmasının tüm sponsorluklarını kaldırmak üzeresiniz. Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveSponsorship(company)} className="bg-destructive hover:bg-destructive/90">
                                    Kaldır
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      Aktif sponsor firma bulunamadı.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedCompany && (
        <EditSponsorshipsModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          company={selectedCompany}
          onUpdate={handleModalUpdate}
        />
      )}
    </>
  );
}
