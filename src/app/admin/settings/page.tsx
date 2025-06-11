
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Construction } from "lucide-react";

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
        <CardContent className="space-y-4">
          <div className="flex items-center p-4 bg-blue-50 border-l-4 border-blue-500 rounded-md">
            <Construction className="h-8 w-8 mr-3 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-blue-700">Geliştirme Aşamasında</h3>
              <p className="text-blue-600">
                Bu bölümde site başlığı, varsayılan para birimi, e-posta ayarları, sosyal medya bağlantıları ve API anahtarları gibi genel uygulama ayarlarını yapılandırabileceksiniz.
              </p>
            </div>
          </div>
           <p className="text-muted-foreground mt-4">
            Örnek ayar alanları: Site Adı, Logo Yükleme, Bakım Modu Anahtarı, İletişim Bilgileri vb.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
