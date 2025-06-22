
import Image from "next/image";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus2, Gavel, Truck, UserPlus, Search, Star, ShieldCheck, BadgePercent, MousePointerClick, Network } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <Card className="overflow-hidden bg-primary text-primary-foreground shadow-lg">
        <div className="grid md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Nasıl Çalışır?</h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              Nakliyeci Dünyası ile lojistik süreçlerinizi nasıl kolayca yöneteceğinizi keşfedin.
            </p>
          </div>
          <div className="relative h-64 md:h-full hidden md:block">
            <Image
              src="https://issever.co/wp-content/uploads/2025/06/nakliye-kamyon-1.svg"
              alt="Nasıl Çalışır İllüstrasyonu"
              layout="fill"
              objectFit="cover"
              data-ai-hint="process flowchart"
            />
          </div>
        </div>
      </Card>

      {/* For Freight Owners */}
      <section className="text-center">
        <h2 className="text-3xl font-bold text-center mb-2">Yük Sahipleri İçin</h2>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">Platformumuzu kullanarak nakliye sürecini sadece üç basit adımda tamamlayın.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="items-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-3">
                <FilePlus2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>1. İlan Oluşturun</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">İhtiyacınıza uygun ilan tipini seçin (Yük, Evden Eve), yükünüzün ve güzergahınızın detaylarını saniyeler içinde ücretsiz olarak girin.</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="items-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-3">
                 <Gavel className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>2. Teklifleri Değerlendirin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Güvenilir nakliyecilerden gelen fiyat tekliflerini karşılaştırın, firmanın profilini, daha önceki işlerini ve puanını inceleyin.</p>
            </CardContent>
          </Card>
          <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="items-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-3">
                 <Truck className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>3. Taşımanızı Gerçekleştirin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">En uygun teklifi seçerek nakliyecinizle anlaşın ve yükünüzün güvenle, zamanında taşınmasını sağlayın.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* For Transporters */}
      <section className="text-center bg-muted/30 py-16 rounded-xl">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Nakliyeciler İçin</h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">Platformumuza katılarak iş hacminizi artırın ve daha fazla müşteriye ulaşın.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="items-center">
                <div className="mx-auto bg-accent/20 p-4 rounded-full w-fit mb-3">
                    <UserPlus className="h-10 w-10 text-accent" />
                </div>
                <CardTitle>1. Kayıt Olun & Profilinizi Oluşturun</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">Ücretsiz firma kaydı oluşturun. Araçlarınızı, yetki belgelerinizi ve uzmanlık alanlarınızı ekleyerek profilinizi güçlendirin.</p>
                </CardContent>
            </Card>
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="items-center">
                <div className="mx-auto bg-accent/20 p-4 rounded-full w-fit mb-3">
                    <Search className="h-10 w-10 text-accent" />
                </div>
                <CardTitle>2. İlanları İnceleyin & Teklif Verin</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">Size en uygun yük ilanlarını filtreleyerek bulun. İlan detaylarını inceleyin ve rekabetçi fiyat teklifinizi verin.</p>
                </CardContent>
            </Card>
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="items-center">
                <div className="mx-auto bg-accent/20 p-4 rounded-full w-fit mb-3">
                    <Star className="h-10 w-10 text-accent" />
                </div>
                <CardTitle>3. İşi Alın & Değerlendirme Kazanın</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">Teklifiniz kabul edildiğinde işi alın. Taşımanızı başarıyla tamamlayarak olumlu müşteri yorumları kazanın ve profilinizi yükseltin.</p>
                </CardContent>
            </Card>
            </div>
        </div>
      </section>

      {/* Platform Advantages */}
      <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="hidden lg:block">
                  <Image 
                      src="https://issever.co/wp-content/uploads/2025/06/nakliyeci-hakkimizda.svg"
                      alt="Platform avantajları görseli"
                      width={600}
                      height={500}
                      data-ai-hint="digital connection"
                  />
              </div>
              <div>
                  <h2 className="text-3xl font-bold mb-4">Platformun Avantajları</h2>
                  <p className="text-muted-foreground mb-8">
                      Geniş nakliyeci ağımız, rekabetçi fiyatlarımız ve kullanıcı dostu platformumuz ile lojistik ihtiyaçlarınız için en doğru adresiz. Güvenilir ve hızlı çözümlerle işinizi kolaylaştırıyoruz.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex gap-4">
                          <div className="bg-primary/10 text-primary p-3 rounded-full h-fit"><Network size={24} /></div>
                          <div>
                              <h3 className="font-semibold mb-1">Geniş Pazar Yeri</h3>
                              <p className="text-sm text-muted-foreground">Türkiye'nin dört bir yanından binlerce güvenilir nakliyeciye ve yük sahibine anında ulaşın.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                           <div className="bg-primary/10 text-primary p-3 rounded-full h-fit"><BadgePercent size={24} /></div>
                          <div>
                              <h3 className="font-semibold mb-1">Rekabetçi Fiyatlar</h3>
                              <p className="text-sm text-muted-foreground">Birden fazla teklif alarak veya vererek piyasa koşullarında en uygun fiyatı bulun.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                           <div className="bg-primary/10 text-primary p-3 rounded-full h-fit"><ShieldCheck size={24} /></div>
                          <div>
                              <h3 className="font-semibold mb-1">Güvenilir Sistem</h3>
                              <p className="text-sm text-muted-foreground">Onaylanmış firma profilleri ve şeffaf kullanıcı yorumları ile güvenle iş yapın.</p>
                          </div>
                      </div>
                      <div className="flex gap-4">
                           <div className="bg-primary/10 text-primary p-3 rounded-full h-fit"><MousePointerClick size={24} /></div>
                          <div>
                              <h3 className="font-semibold mb-1">Kolay Kullanım</h3>
                              <p className="text-sm text-muted-foreground">Basit ve anlaşılır arayüzümüzle ilan vermek ve teklifleri yönetmek çok kolay.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* CTA Section */}
       <section className="bg-primary/5 border-t border-b border-primary/10">
          <div className="container mx-auto px-4 py-16 text-center">
              <h2 className="text-3xl font-bold text-primary mb-4">Hemen Başlayın!</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                  İster yük sahibi olun ister nakliyeci, platformumuzda sizin için bir yer var. Hemen kayıt olun, fırsatları kaçırmayın.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-lg py-3 px-8">
                      <Link href="/yeni-ilan">
                          <FilePlus2 className="mr-2 h-5 w-5" /> Ücretsiz İlan Ver
                      </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg py-3 px-8 border-primary text-primary hover:bg-primary/10 hover:text-primary">
                       <Link href="/auth/kayit">
                          <Truck className="mr-2 h-5 w-5" /> Nakliyeci Olarak Kaydol
                      </Link>
                  </Button>
              </div>
          </div>
      </section>

    </div>
  );
}
