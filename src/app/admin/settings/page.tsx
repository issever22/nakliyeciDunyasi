
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Construction, DatabaseZap } from "lucide-react";
import Link from "next/link";

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Genel Ayarlar
          </CardTitle>
          <CardDescription>
            Uygulamanın genel yapılandırma ayarlarını buradan yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
            <Construction className="h-8 w-8 mr-3 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-700">Geliştirme Aşamasında</h3>
              <p className="text-blue-600">
                Bu bölümde site başlığı, varsayılan para birimi, e-posta ayarları, sosyal medya bağlantıları ve API anahtarları gibi genel uygulama ayarlarını yapılandırabileceksiniz.
              </p>
            </div>
          </div>
           <p className="text-muted-foreground">
            Örnek ayar alanları: Site Adı, Logo Yükleme, Bakım Modu Anahtarı, İletişim Bilgileri vb.
          </p>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-semibold text-foreground mb-3">Geliştirici Araçları</h3>
            <Button asChild variant="outline">
              <Link href="/admin/seed-settings" className="flex items-center gap-2">
                <DatabaseZap size={18} /> Başlangıç Verilerini Yükle (Seed)
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Uygulama için gerekli olan Araç Tipleri, Yük Cinsleri gibi temel ayar verilerini Firestore'a tek seferlik yükler.
              Bu işlem, aynı isimde mevcut olan kayıtları atlayacaktır.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
