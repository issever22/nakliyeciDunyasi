
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneCall, Send, Star, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { addMembershipRequest } from '@/services/membershipRequestsService';
import type { CompanyUserProfile } from '@/types';

export default function MembershipCTA() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // This effect is for the guest form, pre-filling if a user happens to be logged in but the non-member card isn't shown for some reason.
    if (isAuthenticated && user) {
        const companyUser = user as CompanyUserProfile;
        setName(companyUser.contactFullName || companyUser.name);
        setPhone(companyUser.mobilePhone || '');
        setEmail(companyUser.email || '');
        setCompanyName(companyUser.companyTitle || user.name);
    }
  }, [user, isAuthenticated]);

  const handleGuestFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name || !phone || !details) {
        toast({ title: "Eksik Bilgi", description: "Lütfen Ad Soyad, Telefon ve Talep Detayları alanlarını doldurun.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
        const result = await addMembershipRequest({
            name, phone, details,
            email: email || undefined,
            companyName: companyName || undefined,
            userId: user?.id
        });
        if (result.success) {
            toast({ title: "Talebiniz Alındı!", description: "En kısa sürede sizinle iletişime geçeceğiz." });
            setName('');
            setPhone('');
            setEmail('');
            setCompanyName('');
            setDetails('');
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ title: "Hata", description: error.message || "Talep gönderilirken bir sorun oluştu.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDirectRequestSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
        const result = await addMembershipRequest({
            name: user.contactFullName || user.name,
            phone: user.mobilePhone || 'Belirtilmedi',
            details: `"${user.name}" firmasından otomatik üyelik talebi.`,
            email: user.email,
            companyName: user.companyTitle || user.name,
            userId: user.id
        });
        if (result.success) {
            toast({ title: "Talebiniz Alındı!", description: "Üyelik temsilcimiz en kısa sürede sizinle iletişime geçecektir." });
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ title: "Hata", description: error.message || "Talep gönderilirken bir sorun oluştu.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isAuthenticated && user) {
    return (
        <div className="max-w-4xl mx-auto py-12">
            <Card className="shadow-2xl border-primary/20 bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="text-center items-center">
                    <Star className="h-16 w-16 text-primary mb-4" />
                    <CardTitle className="text-3xl font-bold text-primary">Sayın {user.name}, Ayrıcalıklara Sahip Olun!</CardTitle>
                    <CardDescription className="max-w-2xl mx-auto text-lg text-muted-foreground">
                        Bu ilanın detaylarını ve iletişim bilgilerini görmek, platformdaki tüm fırsatlardan yararlanmak için üyeliğinizi şimdi başlatın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                     <p className="text-muted-foreground mb-6">
                        Tek bir tıkla üyelik talebinizi bize iletin veya doğrudan bizimle iletişime geçin. Uzmanlarımız size özel tekliflerle en kısa sürede ulaşsın.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button onClick={handleDirectRequestSubmit} size="lg" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            <PhoneCall className="mr-2 h-5 w-5"/> Sizi Arayalım
                        </Button>
                        <Button asChild size="lg" variant="outline">
                           <Link href="/iletisim"><Phone className="mr-2 h-5 w-5"/> Siz Bizi Arayın</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card className="shadow-2xl border-primary/20 bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="text-center items-center">
          <Star className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Üye Olun, Fırsatları Kaçırmayın!</CardTitle>
          <CardDescription className="max-w-xl mx-auto text-lg text-muted-foreground">
            İlan detaylarını görmek ve diğer tüm premium özelliklerden faydalanmak için hemen üye olun.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-6">
          <div className="space-y-4 p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold flex items-center gap-2"><PhoneCall className="text-accent"/> Sizi Arayalım</h3>
            <p className="text-sm text-muted-foreground">
                Aşağıdaki formu doldurun, üyelik uzmanlarımız size en uygun paketler hakkında bilgi vermek için en kısa sürede ulaşsın.
            </p>
            <form onSubmit={handleGuestFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="cta-name">Ad Soyad (*)</Label>
                    <Input id="cta-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Adınız Soyadınız"/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="cta-phone">Telefon (*)</Label>
                    <Input id="cta-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="05XX XXX XX XX"/>
                </div>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <Label htmlFor="cta-email">E-posta</Label>
                    <Input id="cta-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@mail.com"/>
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="cta-companyName">Firma Adı</Label>
                    <Input id="cta-companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Firma Adınız"/>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cta-details">Talep Detayları (*)</Label>
                <Textarea id="cta-details" value={details} onChange={(e) => setDetails(e.target.value)} required placeholder="Üyelik hakkında bilgi almak istiyorum..." rows={3}/>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Gönder
              </Button>
            </form>
          </div>
          <div className="space-y-4 p-6 bg-card rounded-lg border">
            <h3 className="text-xl font-semibold flex items-center gap-2"><Send className="text-accent"/> Kendiniz İletişime Geçin</h3>
             <p className="text-sm text-muted-foreground">
                Dilerseniz iletişim sayfamız üzerinden bize doğrudan ulaşabilir veya üyelik paketlerimizi inceleyebilirsiniz.
            </p>
            <div className="space-y-2 pt-4">
                 <Button asChild className="w-full" size="lg">
                    <Link href="/auth/kayit">Hemen Firma Kaydı Oluştur</Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                    <Link href="/iletisim">İletişim Sayfası</Link>
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
