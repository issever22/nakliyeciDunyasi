
import Link from 'next/link';
import { Truck as AppIcon } from 'lucide-react'; // Using Truck as AppIcon as in Header

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Logo and Site Name */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <AppIcon className="h-10 w-10 text-primary" data-ai-hint="truck logistics" />
              <span className="text-xl font-bold text-primary font-headline">Nakliyeci Dünyası</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Türkiye'nin güvenilir nakliye platformu. Yüklerinizi en iyi fiyatlarla taşıtın.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:col-span-2 md:justify-self-end">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><Link href="/hakkimizda" className="text-sm text-muted-foreground hover:text-primary transition-colors">Hakkımızda</Link></li>
                <li><Link href="/nasil-calisir" className="text-sm text-muted-foreground hover:text-primary transition-colors">Nasıl Çalışır?</Link></li>
                <li><Link href="/iletisim" className="text-sm text-muted-foreground hover:text-primary transition-colors">İletişim</Link></li>
                <li><Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3">Yasal</h4>
              <ul className="space-y-2">
                <li><Link href="/gizlilik-politikasi" className="text-sm text-muted-foreground hover:text-primary transition-colors">Gizlilik Politikası</Link></li>
                <li><Link href="/kullanim-kosullari" className="text-sm text-muted-foreground hover:text-primary transition-colors">Kullanım Koşulları</Link></li>
                <li><Link href="/cerez-politikasi" className="text-sm text-muted-foreground hover:text-primary transition-colors">Çerez Politikası</Link></li>
              </ul>
            </div>
            {/* 
            Optionally, add a social media section here
            <div>
              <h4 className="font-semibold text-foreground mb-3">Bizi Takip Edin</h4>
              <div className="flex space-x-3">
                <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Facebook size={20} /></Link>
                <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><Twitter size={20} /></Link>
                <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram size={20} /></Link>
              </div>
            </div> 
            */}
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Nakliyeci Dünyası. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
}
