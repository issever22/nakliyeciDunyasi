
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const userProfile = await login(email, password);
      if (userProfile) {
        toast({
          title: "Başarılı Giriş",
          description: `Hoş geldiniz, ${userProfile.name}! Panele yönlendiriliyorsunuz...`,
        });
        router.push('/'); // Redirect to homepage or dashboard after successful login
      } else {
        // This else block might not be reached if login throws an error for failures
        toast({
          title: "Giriş Başarısız",
          description: "E-posta veya şifre hatalı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Login form error:", error);
      let description = "Giriş sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.";
      if (error.code) { // Firebase error codes
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // Covers both wrong email and password for newer SDK versions
            description = "E-posta veya şifre hatalı.";
            break;
          case 'auth/invalid-email':
            description = "Geçersiz e-posta formatı.";
            break;
          case 'auth/too-many-requests':
            description = "Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.";
            break;
          default:
            description = "Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        }
      }
      toast({
        title: "Giriş Hatası",
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
        <Label htmlFor="email">E-posta Adresi</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
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
        <Label htmlFor="password">Şifre</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
            autoComplete="current-password"
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
      </Button>
    </form>
  );
}
