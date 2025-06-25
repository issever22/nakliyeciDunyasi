
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; 

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); 

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      // The onAuthStateChanged listener in useAuth will handle redirection and user state setting.
      toast({
        title: "Başarılı Giriş",
        description: `Giriş yapıldı. Yönlendiriliyorsunuz...`,
      });
      router.push('/'); 
    } catch (error: any) {
      console.error("Login form error:", error);
      toast({
        title: "Giriş Hatası",
        description: error.message || "Giriş sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.",
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
            placeholder="E-posta adresiniz"
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
