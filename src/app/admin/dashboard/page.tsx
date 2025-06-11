
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Paneli</h1>
        <p className="text-muted-foreground mt-1">
          Nakliyeci Dünyası admin paneline hoş geldiniz. Uygulamanızı buradan yönetin.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">geçen aydan +%20.1</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/admin/users">Kullanıcıları Yönet</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif İlanlar</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">son saatten beri +12</p>
             <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/admin/listings">İlanları Yönet</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Ayarları</CardTitle>
            <Settings className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Yapılandırma</div>
            <p className="text-xs text-muted-foreground">Genel & Gelişmiş</p>
             <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/admin/settings">Ayarlara Git</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-10 p-4 border-l-4 border-destructive bg-destructive/10 rounded-md">
        <h3 className="text-lg font-semibold text-destructive mb-1">Güvenlik Uyarısı</h3>
        <p className="text-sm text-destructive/80">
          Bu admin paneli şu anda <strong>sadece gösterim amaçlı</strong> istemci tarafı kimlik doğrulaması kullanmaktadır. 
          Bu, <strong>üretim kullanımı için GÜVENLİ DEĞİLDİR</strong>. 
          Gerçek bir uygulama için güçlü sunucu tarafı kimlik doğrulama ve yetkilendirme uygulayın.
        </p>
      </div>
    </div>
  );
}
