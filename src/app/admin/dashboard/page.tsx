
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Handshake, MessageSquare, PlusCircle, Megaphone, ShieldCheck } from "lucide-react";
import Link from "next/link";

// Mock data for demonstration. In a real app, this would be fetched from services.
const recentUsers = [
  { name: "Ahmet Yılmaz", email: "ahmet@nakliyat.com", initial: "A" },
  { name: "Veli Trans", email: "info@velitrans.com", initial: "V" },
  { name: "Çelik Lojistik", email: "destek@celiklojistik.com", initial: "Ç" },
  { name: "Marmara Nakliyat", email: "marmara@nakliyat.com.tr", initial: "M" },
  { name: "Ege Taşımacılık", email: "iletisim@egetasimacilik.com", initial: "E" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary"/> Yönetici Paneli
        </h1>
        <p className="text-muted-foreground mt-1">
          Nakliyeci Dünyası admin paneline hoş geldiniz. Uygulamanızı buradan yönetin.
        </p>
      </div>
      
      {/* Stat Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Firma</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">Onay bekleyen: 15</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif İlanlar</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">Son 24 saatte: +120</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Üyelik Talepleri</CardTitle>
            <Handshake className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">Yeni talep: 3</p>
          </CardContent>
        </Card>
        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Okunmamış Mesaj</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Toplam mesaj: 128</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Companies */}
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Son Eklenen Firmalar</CardTitle>
                <CardDescription>Platforma yeni katılan son 5 firma.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentUsers.map((user) => (
                        <div key={user.email} className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback>{user.initial}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/admin/users">İncele</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
            <CardHeader>
                <CardTitle>Hızlı Eylemler</CardTitle>
                <CardDescription>Sık kullanılan işlemlere hızlıca erişin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Button className="w-full justify-start" asChild>
                    <Link href="/admin/users/add">
                        <PlusCircle className="mr-2 h-4 w-4"/> Yeni Firma Ekle
                    </Link>
                </Button>
                 <Button className="w-full justify-start" asChild variant="secondary">
                    <Link href="/admin/listings">
                        <Package className="mr-2 h-4 w-4"/> İlanları Yönet
                    </Link>
                </Button>
                 <Button className="w-full justify-start" asChild variant="secondary">
                    <Link href="/admin/settings/announcements">
                        <Megaphone className="mr-2 h-4 w-4"/> Duyuru Yayınla
                    </Link>
                </Button>
                 <Button className="w-full justify-start" asChild variant="secondary">
                    <Link href="/admin/membership-requests">
                        <Handshake className="mr-2 h-4 w-4"/> Üyelik Taleplerini Gör
                    </Link>
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
