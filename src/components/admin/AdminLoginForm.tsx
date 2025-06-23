
"use client";
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginAdmin } from '@/services/authService';

const ADMIN_AUTH_KEY = 'isAdminAuthenticated';

export default function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const adminProfile = await loginAdmin(username, password);
      
      localStorage.setItem(ADMIN_AUTH_KEY, 'true'); 
      localStorage.setItem('admin_profile_info', JSON.stringify({ name: adminProfile.name, role: adminProfile.role }));

      toast({ title: "Giriş Başarılı", description: `Hoş geldin, ${adminProfile.name}! Panele yönlendiriliyorsunuz...` });
      router.push('/admin/dashboard');
      
    } catch (error: any) {
       toast({ title: "Giriş Başarısız", description: error.message || "Bilinmeyen bir hata oluştu.", variant: "destructive" });
       setIsLoading(false);
    } 
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
