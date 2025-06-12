
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { IndividualRegisterData } from '@/types'; 
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Hata", description: "Şifreler eşleşmiyor.", variant: "destructive" });
      return;
    }
    if (!agreement) {
      toast({ title: "Hata", description: "Lütfen üyelik sözleşmesini onaylayın.", variant: "destructive" });
      return;
    }
    if (!name || !email || !password) {
       toast({ title: "Eksik Bilgi", description: "Lütfen tüm zorunlu alanları (*) doldurun.", variant: "destructive" });
       return;
    }

    setIsLoading(true);
    try {
      const registrationData: IndividualRegisterData = {
        role: 'individual',
        name,
        email,
        password,
      };
      const userProfile = await register(registrationData); 
      if (userProfile) {
        toast({
          title: "Bireysel Kayıt Başarılı",
          description: `Hesabınız oluşturuldu, ${userProfile.name}! Ana sayfaya yönlendiriliyorsunuz...`,
        });
        router.push('/'); 
      } else {
         // This case should ideally be handled by errors thrown from the register function
         toast({
          title: "Kayıt Başarısız",
          description: "Lütfen bilgilerinizi kontrol edin ve tekrar deneyin.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Individual registration form error:", error);
      let description = "Kayıt sırasında bir hata oluştu.";
      if (error.code) { // Firebase error codes
        switch (error.code) {
          case 'auth/email-already-in-use':
            description = "Bu e-posta adresi zaten kayıtlı.";
            break;
          case 'auth/weak-password':
            description = "Şifre yeterince güçlü değil. En az 6 karakter olmalıdır.";
            break;
          case 'auth/invalid-email':
            description = "Geçersiz e-posta formatı.";
            break;
          default:
            description = error.message || "Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        }
      } else if (error.message) {
        description = error.message;
      }
      toast({
        title: "Kayıt Hatası",
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="individual-name">Ad Soyad (*)</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="individual-name"
            type="text"
            placeholder="Adınız ve soyadınız"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="pl-10"
            autoComplete="name"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="individual-email">E-posta Adresi (*)</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="individual-email"
            type="email"
            placeholder="ornek@eposta.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
            autoComplete="email"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="individual-password">Şifre (*)</Label>
        <div className="relative">
         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="individual-password"
            type="password"
            placeholder="•••••••• (En az 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="individual-confirmPassword">Şifre Tekrar (*)</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="individual-confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div className="flex items-start space-x-3 pt-2">
         <Checkbox id="individual-agreement" checked={agreement} onCheckedChange={(checked) => setAgreement(Boolean(checked))} className="mt-1 flex-shrink-0"/>
        <Label htmlFor="individual-agreement" className="font-normal leading-relaxed text-sm cursor-pointer">
          <Link href="/uyelik-sozlesmesi" target="_blank" className="text-primary hover:underline">Üyelik Sözleşmesini</Link> okudum, anladım ve tüm koşullarıyla kabul ediyorum. (*)
        </Label>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Kayıt Olunuyor...' : 'Bireysel Kayıt Ol'}
      </Button>
    </form>
  );
}
