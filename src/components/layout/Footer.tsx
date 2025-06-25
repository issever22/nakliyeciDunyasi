
import Link from 'next/link';
import Image from 'next/image';
import { Truck as AppIcon, QrCode } from 'lucide-react'; 

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
          
          {/* Column 1: Brand Info */}
          <div className="md:col-span-4 lg:col-span-5 text-center md:text-left">
            <Link href="/" className="flex items-center justify-center md:justify-start gap-2 mb-4">
               <Image
                src="https://issever.co/wp-content/uploads/2025/06/n-logo-white.svg"
                alt="Nakliyeci Dünyası Logo"
                width={200}
                height={45}
              />
            </Link>
            <p className="text-sm text-primary-foreground/80 max-w-sm mx-auto md:mx-0">
              Türkiye'nin güvenilir nakliye platformu. Yüklerinizi en iyi fiyatlarla taşıtın, lojistik süreçlerinizi kolaylaştırın.
            </p>
          </div>
          
          {/* Column 2 & 3 & 4: Links and QR */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-4 text-base">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/hakkimizda" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Hakkımızda</Link></li>
                <li><Link href="/nasil-calisir" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Nasıl Çalışır?</Link></li>
                <li><Link href="/iletisim" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">İletişim</Link></li>
                <li><Link href="/blog" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-base">Yasal</h4>
              <ul className="space-y-3">
                <li><Link href="/gizlilik-politikasi" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                <li><Link href="/kullanim-kosullari" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                <li><Link href="/cerez-politikasi" className="text-sm text-primary-foreground/80 hover:text-white transition-colors">Çerez Politikası</Link></li>
              </ul>
            </div>
             <div className="col-span-2 sm:col-span-1">
              <h4 className="font-semibold text-white mb-4 text-base">Uygulamayı İndir</h4>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-md shadow-md">
                   <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded-sm" data-ai-hint="qr code">
                    <QrCode className="w-10 h-10 text-gray-400"/>
                   </div>
                </div>
                <p className="text-xs text-primary-foreground/80">QR kodu taratarak mobil uygulamamızı indirin.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/70">
          <p>&copy; {new Date().getFullYear()} Nakliyeci Dünyası. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
