
"use client";
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '123'; 
const ADMIN_AUTH_KEY = 'isAdminAuthenticated';

export default function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Simulate async check (can be removed if not needed for UI, but helps with perceived responsiveness)
    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(ADMIN_AUTH_KEY, 'true');
            // Log to confirm item is set and what its value is immediately after setting
            console.log('ADMIN_AUTH_KEY set in localStorage. Value:', localStorage.getItem(ADMIN_AUTH_KEY));
          } catch (e) {
            console.error('Failed to set ADMIN_AUTH_KEY in localStorage:', e);
            toast({ 
              title: "LocalStorage Hatası", 
              description: "Oturum bilgisi kaydedilemedi. Tarayıcı ayarlarınızı (örneğin, gizli modda depolama izni) kontrol edin veya site verilerini temizlemeyi deneyin.", 
              variant: "destructive",
              duration: 7000 // Show for longer
            });
            setIsLoading(false);
            return; // Stop further execution if localStorage fails
          }
        } else {
          console.warn('window object not available when trying to set localStorage for admin auth. This should not happen in a client component event handler.');
           toast({ title: "İstemci Hatası", description: "Beklenmedik bir durum oluştu, lütfen tekrar deneyin.", variant: "destructive" });
           setIsLoading(false);
           return;
        }
        
        toast({ title: "Giriş Başarılı", description: "Panele yönlendiriliyorsunuz..." });
        router.push('/admin/dashboard');
        // setIsLoading(false) is not strictly necessary here as navigation will unmount or change context
      } else {
        toast({ title: "Giriş Başarısız", description: "Geçersiz kullanıcı adı veya şifre.", variant: "destructive" });
        setIsLoading(false);
      }
    }, 500); 
  };

  return (
    <Card className="w-full max-w-sm shadow-xl border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Admin Panel Girişi</CardTitle>
        <CardDescription>Yönetici alanına erişmek için bilgilerinizi girin.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Kullanıcı Adı</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="admin"
              className="text-base"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="text-base pr-10"
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
